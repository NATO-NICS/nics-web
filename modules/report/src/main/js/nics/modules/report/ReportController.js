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
define(['iweb/CoreModule', 
 		"nics/modules/UserProfileModule", "./common/SurveyReportView"],

	function(Core, UserProfile, SurveyReportView){
	
		Ext.define('modules.report.ReportController', {
			extend : 'Ext.app.ViewController',
			
			alias: 'controller.reportcontroller',
			
			coreConfig: null,
			
			reportTypes: null,

			customReports: [],
			
			init: function(){
				this.mediator = Core.Mediator.getInstance();
			    
			    this.bindEvents();
			},
	 
			bindEvents: function(){
				this.getView().on("afterrender", this.onViewRendered, this);
				
				//Subscribe to UI Events
				Core.EventManager.addListener("nics.report.add", this.onAddReport.bind(this));
				Core.EventManager.addListener("nics.report.remove", this.onRemoveReport.bind(this));
				Core.EventManager.addListener("nics.incident.join", this.onJoinIncident.bind(this));
				Core.EventManager.addListener("nics.incident.close", this.onCloseIncident.bind(this));
				Core.EventManager.addListener(UserProfile.PROFILE_LOADED, this.populateModel.bind(this));
				Core.EventManager.addListener("iweb.config.loaded", this.onLoadConfig.bind(this));
				Core.EventManager.addListener("configRequest", this.onConfigRequest.bind(this));
				Core.EventManager.addListener("nics.report.loadTypes", this.onLoadTypes.bind(this));
				Core.EventManager.addListener("nics.report.getTypes", this.onGetTypes.bind(this));
			},

			populateModel: function(e, userProfile) {
				
				this.mediator.sendRequestMessage(Core.Config.getProperty(UserProfile.REST_ENDPOINT) +
						"/reports/types", "nics.report.loadTypes");
			},

			onLoadTypes: function(e, types) {
				if(types.types) {
					this.reportTypes = types.types;
					Core.EventManager.fireEvent("nics.report.sendTypes", types.types);
				}
			},
			
			getReportTypes: function() {
				return this.reportTypes;
			},
			
			onGetTypes: function(event, who) {
				Core.EventManager.fireEvent("nics.report.sendTypes", this.reportTypes);
			},
			
			onViewRendered: function(component, opt) {
				Core.EventManager.fireEvent("ReportViewRendered", "rendered");
			},
			
			onLoadConfig: function(e, config) {
				// ... store config object for when individual report modules request it
				this.coreConfig = config;
			},
			
			/**
			 * Upon request from a report module, send the coreConfig map to the requestor's specified
			 * topic
			 */
			onConfigRequest: function(e, requestTopic) {
				if(requestTopic) {
					Core.EventManager.fireEvent(requestTopic, this.coreConfig);
				}
			},
			
			onAddReport: function(e, report) {
				if(report && report.title && report.component) {
					//Check to see if this report is turned on for the web, but let
					// custom reports through, as they're already associated/enabled
					if (e === 'customReportAdd' || UserProfile.isOrgCapEnabled(report.orgCap) == true) {
						// Check to see if the component has a set title, and if not, set it to the
						// one specified
						if(!report.component.title) {
							report.component.title = report.title;
						}

						this.getView().add(report.component);

						// TODO: add report to summary list
						this.getView().setActiveTab(0);
					}
				}
			},
			
			onRemoveReport: function(e, report) {
				if(report && report.component) {
					this.getView().remove(report.component, true);
				}
			},

			onJoinIncident: function(e, menuItem){
				// Enables individual tabs
				var dmg = this.getView().down();
				for(var i = 0; i < dmg.items.items.length; i++){
					dmg.items.items[i].enable();
				}

				//Add iframe for printing
				this.addPrintFrame(); // TODO:itft shouldn't add for custom reports until it's implemented

				// Load any custom reports associated with the incidenttypes of this incident,
				// since these are specific for this incident, they're already enabled
				this.updateCustomReports(menuItem.id, this.handleCustomReports);

				// Finally, enable the Reports tab itself
				this.getView().enable();
			},

			onCloseIncident: function(e, incidentId) {

				for (var i=0; i<this.customReports.length; i++) {
					this.onRemoveReport(e, this.customReports[i]);
				}
				this.customReports = [];

				// Disables individual tabs
				var dmg = this.getView().down();
				for(var i = 0; i < dmg.items.items.length; i++) {
					dmg.items.items[i].disable();
				}

				//remove print frame
				this.destroyPrintFrame();
			},

			//Add hidden iframe used to print reports
			addPrintFrame: function() {
				var iFrameId = "printerFrame";
				var printFrame = Ext.get(iFrameId);
				if (printFrame == null) {
					printFrame = Ext.getBody().appendChild({
						id: iFrameId,
						tag: 'iframe',
						cls: 'x-hidden',  style: {
							display: "none"
						}
					});
				}
			},

			//destroy print iframe
			destroyPrintFrame: function() {
				var iFrameId = "printerFrame";
				var printFrame = Ext.get(iFrameId);
				if (printFrame != null) {
					// destroy the iframe
					Ext.fly(iFrameId).destroy();
				 
				}
			},

			/**
			 * Callback handler for fetching custom reports associated with the given incident's incidenttype
			 * mappings.
			 *
			 * @param {Object} response - The Form response message, with the formtypes collection populated
			 * @param {integer} incidentId - The ID of the Incident that was joined
			 */
			handleCustomReports: function(response, incidentId) {

				// Array of JSON objects, e.g.:
				// [{formTypeId: 1, formTypeName: 'MKEARTHQUAKE'}, ...]
				var formTypes = response.formTypes;

				if(formTypes && formTypes.length && formTypes.length > 0) {
					for(var i = 0; i < formTypes.length; i++) {
						// Add each report tab for the formtype

						var formComponent = Ext.create('modules.report.common.SurveyReportView', {
							title: formTypes[i].formTypeName, // TODO:itft get the/a "nice" title for tabs
							reportType: formTypes[i].formTypeName,
							formTypeId: formTypes[i].formTypeId,
							reference: formTypes[i].formTypeName + '-' + formTypes[i].formTypeId,
							incidentId: incidentId,
							loadEvt: 'Load' + formTypes[i].formTypeName,
							surveyDiv: 'surveyDiv' + formTypes[i].formTypeName
						});

						var report = {title: formTypes[i].formTypeName, // TODO:itft get the/a "nice" title for tabs
							component: formComponent};

						this.customReports.push(report);

						this.onAddReport("customReportAdd", report);
					}
				}

			},

			/**
			 * Fetch any custom reports associated with the recently joined incident's type, and
			 * add the proper report tabs
			 */
			updateCustomReports: function(incidentId, callback) {
				if(!incidentId) {
					return;
				}

				var url = Ext.String.format('{0}/incidents/{1}/formtype/incident/{2}',
					Core.Config.getProperty('endpoint.rest'),
					UserProfile.getWorkspaceId(), incidentId, UserProfile.getOrgId());

				Ext.Ajax.request({
					url: url,
					method: 'GET',
					headers: { 'Content-Type': 'application/json' },
					scope: this,
					success: function(resp) {

						if(!resp) {
							//
						}

						var errorMsg = this.buildErrorMessage(resp);
						var respObj;
						if(resp && resp.status === 200) {
							respObj = this.decode(resp.responseText);
						} else {
							Ext.Msg.alert("Report Error", errorMsg);
							console.error(errorMsg);
							return;
						}

						if(resp.status === 200 && respObj !== null && respObj.message === "Success") {
							callback.call(this, respObj, incidentId);
						} else {
							Ext.Msg.alert("Report Error", errorMsg);
							console.error(errorMsg);
						}

					},
					failure: function(res) {
						if(res && res.timedout && res.timedout === true) {
							Ext.Msg.alert("Error",
								"Server timed out fetching reports");
							return; // TODO: fire event for re-querying?
						} else if(res && res.status === 404) {
							// no mappings found
							return;
						}

						Ext.Msg.alert("Report Error", this.buildErrorMessage(res));
					}
				});

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