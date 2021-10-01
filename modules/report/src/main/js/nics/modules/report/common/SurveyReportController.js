/*
 * Copyright (c) 2008-2021, Massachusetts Institute of Technology (MIT)
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this
 * list of conditions and the following disclaimer.
 *
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 * this list of conditions and the following disclaimer in the documentation
 * and/or other materials provided with the distribution.
 *
 * 3. Neither the name of the copyright holder nor the names of its contributors
 * may be used to endorse or promote products derived from this software without
 * specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
 * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
 * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
define(['ext', 'ol', 'iweb/CoreModule', 'iweb/modules/MapModule',
			'nics/modules/UserProfileModule', 'survey-knockout', './SurveyReportView'],

function(Ext, ol, Core, MapModule, UserProfile, Survey, SurveyReportView) {

	'use strict';

	Ext.define('modules.report.SurveyReportController', {
		extend : 'Ext.app.ViewController',

		alias : 'controller.surveyreportcontroller',

		newButtonText: Core.Translate.i18nJSON('New'),
		updateButtonText: Core.Translate.i18nJSON('Update'),
		viewButtonText: Core.Translate.i18nJSON('View'),

		reportView: {},

		formTypeSurveyMapping: {},

		reportTemplate: null,
		surveyTitle: undefined,
		surveyId: undefined,
		currentSurveyId: null,
		currentSurvey: null,

		surveyListReference: null,

		fillColor : 'rgb(0,0,0)',

		strokeColor : 'rgb(0,0,0)',

		orgCaps: [],

		
		init : function(args) {
			//console.log("INIT SurveyReportController...", args);
			this.mediator = Core.Mediator.getInstance();

			Survey.StylesManager.applyTheme("winter");

			// Configure Survey options
			Survey.surveyStrings.savingData = "Please wait. We are validating and saving your responses";
			Survey.surveyStrings.savingDataError = "Error saving your report";
			Survey.surveyStrings.savingDataSuccess = "Thank you for submitting the report!";
			Survey.surveyStrings.saveAgainButton = "Try saving again";
			// TODO: look into other options

			this.setIncidentId(args.incidentId);
			this.setReportType(args.reportType);
			this.setLoadEvt(args.loadEvt);
			this.setSurveyDiv(args.surveyDiv);

			this.surveyListReference = 'surveyList' + this.reportType;
			//console.log("Using surveyListReference: ", this.surveyListReference);
			this.createSurveyReference = 'createButton' + this.reportType;
			this.viewSurveyReference = 'viewButton' + this.reportType;
			this.surveyContainer = 'surveyContainer';

			this.lookupReference(this.createSurveyReference).enable();
			this.lookupReference(this.viewSurveyReference).disable();

			this.fetchReportTemplate(this.reportType, this.onGetReportTemplate);
		},

		bindEvents: function() {
			this._onJoinIncident = this.onJoinIncident.bind(this);
			this._onCloseIncident = this.onCloseIncident.bind(this);
			this._onLoadReports = this.onLoadReports.bind(this);
			//this._updateOrgCapsListener = this.updateOrgCapsListener.bind(this);
			//this._onActivateCollabRoom = this.onActivateCollabRoom.bind(this);
			//this._onReportReady = this.onReportReady.bind(this);
			this._onCancel = this.onCancel.bind(this);

			//Bind UI Elements
			Core.EventManager.addListener("nics.incident.join", this._onJoinIncident);
			Core.EventManager.addListener("nics.incident.close", this._onCloseIncident);
			Core.EventManager.addListener(this.loadEvt, this._onLoadReports);
			//Core.EventManager.addListener("nics.user.profile.loaded", this._updateOrgCapsListener);
			// TODO: are these survey reports tying into collabrooms?
			//Core.EventManager.addListener("nics.collabroom.activate", this._onActivateCollabRoom );

			// TODO: Uncomment if implementing printing using print/cancel for this?
			//Core.EventManager.addListener("PrintSurveyReport", this._onReportReady);
			//Core.EventManager.addListener("CancelSurveyReport", this._onCancel);

			this.mediator.sendRequestMessage(Core.Config.getProperty(UserProfile.REST_ENDPOINT)
				+ "/reports/" + this.incidentId + '/' + this.reportType, this.loadEvt);

			this.newTopic = Ext.String.format(
				"iweb.NICS.incident.{0}.report.{1}.new", this.incidentId,
				this.reportType);
			this.mediator.subscribe(this.newTopic);

			this.newHandler = this.onLiveReport.bind(this);
			Core.EventManager.addListener(this.newTopic, this.newHandler);

			// TODO: only keep if using map layer with these survey style reports
			//Core.EventManager.addListener("map-selection-change", this.onMapSelectionChange.bind(this));
			//MapModule.getMapStyle().addStyleFunction(this.styleReportFeature.bind(this));
		},

		fetchReportTemplate: function(reportType, callback) {

			var url = Ext.String.format('{0}/survey/formtypename/{1}',
				Core.Config.getProperty('endpoint.rest'), reportType);

			Ext.Ajax.request({
				url: url,
				method: 'GET',
				headers: { 'Content-Type': 'application/json' },
				scope: this,
				success: function(resp) {

					var respObj;
					if(resp && resp.status === 200) {
						respObj = this.decode(resp.responseText);
					} else {
						console.error(Core.Translate.i18nJSON("Report Error"),
							this.buildErrorMessage(resp));
						return;
					}

					if(resp.status === 200 && respObj !== null && respObj.success === true) {
						callback.call(this, respObj);
					} else {
						console.error(Core.Translate.i18nJSON("Report Error"), this.buildErrorMessage(resp));
					}

				},
				failure: function(res) {
					if(res && res.timedout && res.timedout === true) {
						console.error(Core.Translate.i18nJSON("Report Error"),
							Core.Translate.i18nJSON("Server timed out fetching report."));
						return; // TODO: fire event for re-querying?
					}

					console.error(Core.Translate.i18nJSON("Report Error"), this.buildErrorMessage(res));
				}
			});
		},

		onGetReportTemplate: function(response) {
			if(response) {
				var surveyTemplate = response.surveys[0];
				this.surveyId = surveyTemplate.surveyid;
				this.surveyTitle = surveyTemplate.title;
				this.reportTemplate = surveyTemplate.survey;
			}

			this.bindEvents();
		},

		/* SurveyReports are not integrated with collabrooms... but could be in future
		onActivateCollabRoom: function(evt, collabRoomId, readOnly, name){
			var store = this.getGrid().store;

			store.clearFilter();

			if(collabRoomId && collabRoomId != "myMap"){
				store.filter("collabroomid", collabRoomId);
			}
		},*/

		/* NOT integrated with orgcaps
		updateOrgCapsListener: function(evt, data){

			if(this.currentOrg){
				this.mediator.unsubscribe("iweb.nics.orgcaps." + this.currentOrg + "." + this.reportType);
				Core.EventManager.removeListener("iweb.nics.orgcaps." + this.currentOrg + "." + this.reportType, this.bindOrgCapUpdate);
			}

			this.currentOrg = UserProfile.getOrgId();

			var orgCapInArray = false;

			for(var i = 0; i < this.orgCaps.length; i++){
				if(this.orgCaps[i].currentOrg == this.currentOrg && this.orgCaps[i].reportType == this.reportType){
					orgCapInArray = true;
				}
			}

			if(!orgCapInArray){
				Core.EventManager.addListener("iweb.nics.orgcaps." + this.currentOrg + "." + this.reportType, this.bindOrgCapUpdate);
				this.orgCaps.push({ 'orgId': this.currentOrg , 'reportType': this.reportType });
			}

			this.mediator.subscribe("iweb.nics.orgcaps." + this.currentOrg + "." + this.reportType);

		},
	
		orgCapUpdate: function(evt, orgcap){

			if(orgcap.activeWeb){
				this.getView().enable();
			}
			else{
				this.getView().disable();
			}
		
			UserProfile.setOrgCap(orgcap.cap.name,orgcap.activeWeb);
		
		},*/

		onJoinIncident : function(e, incident) {
			this.incidentName = incident.name;
			this.incidentId = incident.id;
		},

		onCloseIncident : function(e, incidentId) {
			//console.log("SurveyReportController.OnClose: " + this.reportType);
			this.mediator.unsubscribe(this.newTopic);

			Core.EventManager.removeListener(this.newTopic, this.newHandler);

			this.incidentId = null;
			this.incidentName = null;

			//Bind UI Elements
			Core.EventManager.removeListener("nics.incident.join", this._onJoinIncident);
			Core.EventManager.removeListener("nics.incident.close", this._onCloseIncident);
			Core.EventManager.removeListener(this.loadEvt, this._onLoadReports);

			// TODO: using print/cancel for this?
			//Core.EventManager.removeListener("PrintSurveyReport", this._onReportReady);
			//Core.EventManager.removeListener("CancelSurveyReport", this._onCancel);
		},

		addFeature : function(lon, lat, formId, color) {
			try {
				if (lat && lon) {
					var longitude = Number(lon);
					var latitude = Number(lat);

					var feature = new ol.Feature({
						geometry : new ol.geom.Point(ol.proj
							.transform([ longitude, latitude ],
								'EPSG:4326', 'EPSG:3857'))
					});

					feature.set('type', 'report');
					feature.set('fillColor', (color ? color : this.fillColor));
					feature.set('strokeColor', (color ? color : this.strokeColor));

					if (formId) {
						feature.setId(formId);
						// Replace old feature with new feature
						this.removeExistingFeature(formId);
					}

					this.vectorLayer.getSource().addFeature(feature);

					return feature;
				}
			} catch (e) {}

			return null;
		},

		styleReportFeature: function(feature, resolution, selected) {
			if (feature.get('type') != 'report') {
				return;
			}
			var styles = [ new ol.style.Style({
				image : new ol.style.Circle({
					radius : 8,
					fill : new ol.style.Fill({
						color : feature.get('fillColor')
					}),
					stroke : new ol.style.Stroke({
						color : feature.get('strokeColor')
					})
				})
			})];

			if (selected) {
				styles.unshift(new ol.style.Style({
					image: new ol.style.Circle({
						radius: 16,
						fill: new ol.style.Fill({
							color: 'rgba(0, 255, 255, 0.4)'
						}),
						stroke: new ol.style.Stroke({
							color: 'rgb(0, 255, 255)'
						})
					})
				}));
			}

			return styles;
		},

		removeExistingFeature : function(formId) {
			var layerSrc = this.vectorLayer.getSource();
			var feature = layerSrc.getFeatureById(formId);
			if (feature) {
				layerSrc.removeFeature(feature);

				//unselect the element being removed
				var selectedCollection = Core.Ext.Map.getSelection();
				selectedCollection.remove(feature);
			}
		},

		onPlotButtonClick : function(button, pressed, eOpts) {
			this.vectorLayer.setVisible(pressed);
		},

		onMapSelectionChange: function(e, features) {
			//prevent reentrance
			if (this.syncingSelection) {
				return;
			}
			this.syncingSelection = true;

			var grid = this.getGrid(),
				store = grid.getStore();

			var records = features.map(function(feature){
				return store.getById( feature.getId() );
			}).filter(function(n){ return n !== null; });

			var selectionModel = grid.getSelectionModel();
			if (records.length) {
				//select our records, clearing previous selection
				selectionModel.select(records, /* keepExisting */ false);
			} else {
				selectionModel.deselectAll();
			}

			this.syncingSelection = false;
		},

		// TODO: not implementing, as not using a grid... but could be the combo handler
		//onGridSelectionChange:


		/**
		 Setter for currentSurvey member. Sets the active Survey object, as well as setting the global currentSurveyId
		 variable that holds the id of the active survey. Also handles removing and adding the onComplete event
		 handler for the survey.

		 @function setCurrentSurvey

		 @param {integer} surveyId - The ID of the survey to set as active
		 @param {Object} survey - the Survey instance that's active, i.e., the one the user is giving responses to

		 */
		setCurrentSurvey: function(surveyId, survey) {

			if(this.currentSurvey || this.currentSurvey !== null) {
				this.currentSurveyId = null;
				this.currentSurvey.onComplete.remove();
			}

			survey.onComplete.add(this.onSave.bind(this));
			this.currentSurvey = survey;
			this.currentSurveyId = surveyId;
		},

		onAddReport: function(e) {

			var survey = this.reportTemplate;
			if(!survey) {
				this.fetchReportTemplate(this.reportType, this.onGetReportTemplate);
				Ext.Msg.alert(Core.Translate.i18nJSON("Report"),
					Core.Translate.i18nJSON("Fetching latest report template..."));
				survey = this.reportTemplate;
				if(!survey) {
					Ext.Msg.alert(Core.Translate.i18nJSON("Report"),
						Core.Translate.i18nJSON("There was a problem fetching the report template."));
					return;
				}
			}

			var selectedSurvey = null;
			try {
				var surveyReportContainer = this.view.lookupReference(this.surveyContainer);
				surveyReportContainer.contentEl = this.surveyDiv;
				surveyReportContainer.update('<div id="' + this.surveyDiv + '"></div>');
				selectedSurvey = new Survey.Model(survey, this.surveyDiv);

				var currentFormId  = this.lookupReference(this.surveyListReference).getValue();
				if(currentFormId) {
					var record = this.lookupReference(this.surveyListReference).findRecordByValue(currentFormId);
					if(record) {
						selectedSurvey.data = Ext.JSON.decode(record.data.message);
					}
				}

				this.setCurrentSurvey(this.surveyId, selectedSurvey);

				this.lookupReference(this.createSurveyReference).disable();

			} catch(e) {
				console.error(Core.Translate.i18nJSON("Error loading report") + ": ", e);
			}
		},

		/**
		 * Report received over new report topic
		 *
		 * @param evt
		 * @param report
		 */
		onLiveReport: function(evt, report) {
			// We don't actually update reports, it's just a new one, so add it to the store
			var store = this.lookupReference(this.surveyListReference).getStore();
			var newReport = this.buildReportData(report);
			store.loadRawData([newReport], true);

			this.lookupReference(this.createSurveyReference).setText(this.updateButtonText);
			this.lookupReference(this.viewSurveyReference).enable();

			var latestForm = store.getAt(0).data.formId;
			this.lookupReference(this.surveyListReference).setValue(latestForm);
			this.onReportSelect();
		},

		/**
		 The handler for when the user completes the survey, and is posting the results

		 @function onSave

		 @param {Object} surveyresults - the JSON survey results containing the responses
		 @param {Object} options - an options object passed in by the Survey.js onComplete event, which
		 let's you set states, among other things, on the active survey

		 */
		onSave: function(surveyresults, options) {

			// Set message/state as saving...
			if(options.showDataSaving) {
				options.showDataSaving();
			}

			options.showCompletedPage = false;
			options.completedHtml = '<h1>No report selected</h1>';

			if(options.render) {
				options.render();
			}

			var url = Ext.String.format('{0}/reports/{1}/{2}',
				Core.Config.getProperty('endpoint.rest'),
				this.incidentId,
				this.reportType);

			var surveyid = this.currentSurveyId;

			if(!surveyid) {
				Ext.Msg.alert(Core.Translate.i18nJSON("Report Error"),
					Core.Translate.i18nJSON("Failure retrieving Report Template IDs for persisting"));
				return;
			}

			// Form entity
			var surveyData = {
				incidentid: this.incidentId,
				usersessionid: UserProfile.getUserSessionId(),
				seqtime: new Date().getTime(),
				message: Ext.JSON.encode(surveyresults.data)
			};

			Ext.Ajax.request({
				scope: this,
				url: url,
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				jsonData: surveyData,
				success: function(res) {

					var response;
					if(res.responseText) {
						try {
							response = Ext.JSON.decode(res.responseText);
						} catch(e){
							// TODO:itft handle failure to decode response...
						}
					}

					var status = res.status;
					var msg;

					if(status === 200 || status === 201) {
						Ext.Msg.alert("Report", "Report submitted successfully.");
						// This options call uses hardcoded messages, which I think can be configured, but
						// for this use case, probably want to set our own in the div instead
						options.showDataSavingSuccess();
						// TODO:itft set a submitted message OR just clear it to its nonselected state

						this.lookupReference(this.createSurveyReference).enable();
					} else {
						// Error
						var msg = (response) ? (response.message || response.error) : Ext.String.format("Unknown ({0})",
							status);

						options.showDataSavingError(Core.Translate.i18nJSON("Error submitting Report") + ": " + msg);

						Ext.Msg.alert(Core.Translate.i18nJSON("Report Error"),
							Core.Translate.i18nJSON("Error submitting Report") + ": " + msg);
					}
				},

				failure: function(res) {

					if(res && res.timedout && res.timedout === true) {
						options.showDataSavingError(Core.Translate.i18nJSON("Request timed out"));
						Ext.Msg.Alert(Core.Translate.i18nJSON("Report Error"),
							Core.Translate.i18nJSON("Server request timed out while saving report data"));
						// TODO: handle survey state, might have left survey in oncomplete phase where user can't resubmit
						return;
					}

					/*if(res && res.status === 404) {

					}*/

					options.showDataSavingError();

					var status = res.status;
					var response;
					if(res.responseText) {
						try {
							response = Ext.JSON.decode(res.responseText);
						} catch(e) {
							console.error("error parsing response text: ", res.responseText, e.message);
						}
					}

					var msg = Ext.String.format("There was an error saving your Report: {0}. ({1})",
						(response.message) ? response.message : "Unknown", status);

					Ext.Msg.alert(Core.Translate.i18nJSON("Report Error"), msg);
				}
			});

		},
		
		onReportSelect: function(component, payload) {
			// TODO:itft actually make use of the data provided in payload instead of
			// 	requesting in displayCurrentRecord. Only has component and payload when
			//  fired by the combochange event, but this controller also calls it manually
			// 	with no args

			this.displayCurrentRecord(true, 'select');
		},

		onViewSurvey: function() {
			this.displayCurrentRecord(true, 'select');	
		},

		// TODO:itft could hook up cancel button when they don't want to submit an update, but they can
		// 	also just click View to go discard... not as user friendly, but there is no cancel button currently
		// 	and below code would need caught up to the rest of the code, like proper references, etc
		onCancel: function() {
			var combo  = this.lookupReference(this.surveyListReference);
			var currentFormId=combo.getValue();
			if (currentFormId){
				this.displayCurrentRecord(true, 'select');
			} else {
				var surveyReportContainer = this.view.lookupReference('surveyReport');
				surveyReportContainer.removeAll();
			}
		},

		displayCurrentRecord: function(displayOnly, status) {

			var combo  = this.lookupReference(this.surveyListReference);
			var currentFormId = combo.getValue();

			var record = combo.findRecordByValue(currentFormId);

			if(record) {
				var surveyReportContainer = this.view.lookupReference(this.surveyContainer);

				this.lookupReference(this.createSurveyReference).enable();

				surveyReportContainer.update(this.buildResultsHtml(
					new Date(record.data.requestDate),
					record.data.message));
			}
		},
		
		onReportAdded: function() {	
			this.lookupReference(this.viewSurveyReference).enable();
		},

		/**
		 * Handles payload of all reports to populate dropdown choices with. See this.onLiveReport
		 * for appending a report the the combo list.
		 *
		 * @param evt the event
		 * @param response
		 */
		onLoadReports: function(evt, response) {
			var newReports = [];

			var combo = this.lookupReference(this.surveyListReference);
			if(response) {
				if(response.reports && response.reports.length > 0) {
					this.lookupReference(this.createSurveyReference).setText(this.updateButtonText);
					this.lookupReference(this.viewSurveyReference).enable();
					
					for(var i=0; i < response.reports.length; i++){
						var report = response.reports[i];
					
						var newReport  = this.buildReportData(report);
						newReports.push(newReport);
					}

					combo.getStore().removeAll();
					combo.getStore().loadRawData(newReports, true);

					var latestForm = combo.getStore().getAt(0).data.formId;
					combo.setValue(latestForm);

					this.displayCurrentRecord(true, 'select');

				} else {
					this.lookupReference(this.createSurveyReference).setText(this.newButtonText);
					this.lookupReference(this.viewSurveyReference).disable();
				}
			}
			
		},

		/**
		 	TODO: not really striped... need to set proper styling that works on a table within a table
		 */
		openStripedTable: function(keyHeader, valHeader) {
			var html = "<table style='width:100%'>";
			if(keyHeader && valHeader) {
				html += "<tr><th>" + keyHeader + "</th><th>" + valHeader + "</th></tr>";
			}

			return html;
		},

		buildRow: function(key, value) {
			return "<tr class='result-stripe' ><td class='result-stripe'  style='border: 1px solid black'>" + key + "</td><td class='result-stripe'  style='border: 1px solid black'>" + value + "</td></tr>";
		},

		buildResultsHtml: function(surveydate, surveyresult) {
			var resultJson;
			var opening = Ext.String.format("<h2>{0}</h2><h3>Report submitted on {1}</h3>",
				this.surveyTitle,
				Core.Util.formatDateToString(surveydate));

			// TODO: need to give this a class name, since it can affect other components
			var style = "<style>table.result-stripe{border-collapse: collapse;border-spacing: 0;width: 100%;border: 1px solid #ddd;}th.result-stripe, td.result-stripe {text-align: left;padding: 16px;}tr.result-stripe:nth-child(even) {background-color: #f2f2f2}tr.result-stripe:nth-child(odd) {background-color: white}</style>";
			this.view.lookupReference(this.surveyContainer).cls = 'result-stripe';
			var resultHtml = style + "<table class='result-stripe' id='resultTable' style='border: 2px solid darkblue;width:100%;'><tr class='result-stripe' ><th class='result-stripe' style='border: 2px solid darkblue;background-color:lightblue'>Question</th><th class='result-stripe'  style='border: 2px solid darkblue;background-color:lightblue'>Answer</th></tr>";

			try {
				resultJson = this.decode(surveyresult);
			} catch(e) {
				console.error("Exception parsing survey result into JSON: ", e);
				return "<p style='color:red'>Error. Invalid JSON in Survey Result.</p>";
			}

			var newRow;
			var value;
			var tempValue = '';

			Object.keys(resultJson).forEach(function(key) {

				value = resultJson[key];

				if(Array.isArray(value)) {
					// TODO: arrays may already be just turned into a comma delimited list
					//tempValue = Ext.String.format("", tempValue, );
				} else if(typeof value === 'object') {

					// TODO: build a mini striped table within the answer for these key/value pairs?
					tempValue = this.openStripedTable();
					Object.keys(value).forEach(function(innerKey) {
						//tempValue = Ext.String.format("{0}{1}: {2}", tempValue === '' ? '' : tempValue + ', ', innerKey, value[innerKey]);
						tempValue += this.buildRow(innerKey, value[innerKey]);
					}, this);
					tempValue += "</table>";
					value = tempValue;
				}

				newRow = Ext.String.format("<tr class='result-stripe'><td class='result-stripe'>{0}</td><td class='result-stripe'>{1}</td></tr>", key, value);

				resultHtml = Ext.String.format("{0}{1}", resultHtml, newRow);
			}, this);

			resultHtml = Ext.String.format("{0}{1}{2}", opening, resultHtml, "</table>");

			return resultHtml;

		},

		/* TODO:itft used by anything?
		onSurveyResultSelect: function(comp, payload) {
			// TODO: populate view of the results
			var selection = payload.data;

			//var resultDiv = document.getElementById('resultDiv');
			//resultDiv.innerHTML = Ext.String.format("<p>Got result submitted by {0} for survey {1}</p>",
			//   selection.userid, "TODO fetch survey title?");

			resultDiv.innerHTML = this.buildResultsHtml(selection.userid, selection.surveyresult);
		},*/

		buildReportData: function(report) {
			var message = JSON.parse(report.message);
			
			return {
				formId: report.formId,
				incidentId: this.incidentId,
				incidentName: report.incidentname,
				name: message.title,
				message: report.message,
				status: this.reportType, // TODO:itft why? This is an old holdover, don't need status
				requestDate: Core.Util.formatDateToString(new Date(report.seqtime))
			};
		},
			
		/*
		onPrintSurvey: function() {
			
			this.displayCurrentRecord(true, 'select');
			var printMsg = null;
			var surveyReportForm = this.view.lookupReference('surveyReportForm');
			var data = surveyReportForm.viewModel.data;
			surveyReportForm.controller.buildReport(data, 'print');
		},

		// TODO:itft not using, at least yet... meant to go with printing feature
		onReportReady: function(e, response) {
			
			if (response){
				 var iFrameId = "printerFrame";
				 var printFrame = Ext.get(iFrameId);
				 if (printFrame == null) {
			     printFrame = Ext.getBody().appendChild({
			                id: iFrameId,
			                tag: 'iframe',
			                cls: 'x-hidden',
					 		style: {
								display: "none"
			                }
			            });
			        }
			     var printContent = printFrame.dom.contentWindow;
				  // output to the iframe
			     printContent.document.open();
			     printContent.document.write(response);
			     printContent.document.close();
			     printContent.print();
				}
		},*/

		setReportType: function(reportType) {
			this.reportType = reportType;
		},

		setIncidentId: function(incidentId) {
			this.incidentId = incidentId;
		},

		setLoadEvt: function(loadEvt) {
			this.loadEvt = loadEvt;
		},

		setSurveyDiv: function(surveyDiv) {
			this.surveyDiv = surveyDiv;
		},

		/**
		 Utility method for decoding a jsonString into a json object

		 @function decode

		 @param {string} jsonString - a json string

		 @return {Object} - a JSON object initialized from the jsonString if successful, null otherwise
		 */
		decode: function(jsonString) {
			var json;
			try {
				json = Ext.JSON.decode(jsonString);
			} catch(e) {
				json = null;
			}

			return json;
		},

		/**
		 Utility method for building error messages from AJAX request responses

		 @function buildErrorMessage

		 @param {Object} response - a response object returned by the AJAX call

		 @return {string} - An appropriate message based on error, message, and status code
		 contained in the response object
		 */
		buildErrorMessage: function(response) {
			if(!response || response === null || response === "") {
				return "Undefined response";
			}

			// TODO: handle custom case for when status===0 and timedout===true

			var status = response.status;
			var respObj = this.decode(response.responseText);
			var message = "";

			if(respObj && respObj !== null) {

				if(respObj.message) {
					message = Ext.String.format("{0} {1}", message, respObj.message);
				}

				if(respObj.error) {
					message = Ext.String.format("{0} {1}", message, respObj.error);
				}

				message = Ext.String.format("{0} ({1})", message, status);
			} else {

				try {
					throw new Error("ERROR");
				} catch(e) {
					console.error("Catching exception to debug comm failure below");
				}

				if(response.statusText) {
					message = Ext.String.format("Problem with response from server: {0} (status: {1})",
						response.statusText, status);
				} else {
					message = Ext.String.format("Unknown response from server with status {0}", status);
				}
			}

			return message;
		}

	});
});
