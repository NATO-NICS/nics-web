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
define(['ol',
        'iweb/CoreModule',
 		'nics/modules/UserProfileModule',
 		'iweb/modules/MapModule',
 		'./MitamForm',
        './MitamGraphs',
 		'nics/modules/report/common/ReportTableController'],

	function(ol, Core, UserProfile, MapModule){
	
		return Ext.define('modules.report-mitam.MitamReportController', {
			extend : 'modules.report.ReportTableController',
			
			alias: 'controller.mitamreportcontroller',
			
			hasSentView: false,
			
			imageUploadUrl: null,
			
			selectedGridIndex: 0,
			
			bindEvents: function(){
				// Bind UI Elements
				Core.EventManager.addListener("nics.incident.join", this.onJoinIncident.bind(this));
				Core.EventManager.addListener("nics.incident.close", this.onCloseIncident.bind(this));
				Core.EventManager.addListener("nics.incident.close", this.onCloseMitamReport.bind(this));
				Core.EventManager.addListener(this.loadEvt, this.onLoadReports.bind(this));
				
				Core.EventManager.fireEvent("nics.report.add", {
					title : this.reportTitle,
					orgCap: 'MITAM',
					component : this.getView()
				});

				Core.EventManager.addListener("map-selection-change", this.onMapSelectionChange.bind(this));

				this.getGrid().on("selectionchange", this.onGridSelectionChange.bind(this));

				MapModule.getMapStyle().addStyleFunction(this.styleReportFeature.bind(this));
				
				Core.EventManager.addListener("nics.user.profile.loaded", this.loadReportTypes.bind(this));
			},
			
			loadReportTypes: function(){
				var topic = "nics.report.reportType";
				Core.EventManager.createCallbackHandler(
						topic, this, function(evt, response){
							Ext.Array.each(response.types, function(type){
								if(type.formTypeName === 'MITAM'){
									this.formTypeId = type.formTypeId;
									return;
								}
							}, this);
				});
				this.mediator.sendRequestMessage(Core.Config.getProperty(UserProfile.REST_ENDPOINT) +
						"/reports/types", topic);
			},
			
			onSelectionChange: function(grid, selected, eOpts) {
				var updateButton = this.lookupReference('updateButton');
				var closeButton = this.lookupReference('closeButton');
				
				var record = selected[0];
				if(record && record.data.status != "Closed"){
					updateButton.enable();
					closeButton.enable();
				}else{
					updateButton.disable();
					closeButton.disable();
				}
				
				this.onGridSelectionChange();
			},
			
			onCloseMitamReport: function(){
				var form = this.lookupReference('formPanel');
				form.removeAll();
			},
			
			onEditReport: function(){
				var form = this.lookupReference('formPanel');
				form.removeAll();
				
				var record = this.lookupReference('mitamGrid').getSelectionModel().getSelection()[0];
				if(record){
					var handler = function(panel, expanded){
						var editForm = Ext.create('modules.report-mitam.MitamForm',{
							incidentId: this.incidentId,
							incidentName: this.incidentName,
							formId: record.data.id,
							datecreated: record.data.datecreated,
							formTypeId: this.formTypeId,
							seqnum: record.data.seqnum,
							height: panel.getHeight()
						});
						
						panel.add(editForm);
						panel.doLayout();
						
						if(!expanded){
							panel.removeListener('expand', callback, this);
						}

						editForm.controller.loadMessageData(JSON.parse(record.data.message));
					};
					
					var callback = handler.bind(this);
					if(form.collapsed){
						form.on('expand', callback, this);
						form.expand();
					}else{
						callback(form, true);
					}
				}
			},
			
			addNewForm: function(panel, expanded){
				var mitamForm = Ext.create('modules.report-mitam.MitamForm',{
					incidentId: this.incidentId,
					incidentName: this.incidentName,
					formTypeId: this.formTypeId,
					height: panel.getHeight()
				});
				
				panel.add(mitamForm);
				panel.doLayout();
				
				if(!expanded){
					panel.removeListener('expand', this.addNewForm, this);
				}
			},
			
			onNewButtonClick: function(e) {
				var form = this.lookupReference('formPanel');
				form.removeAll();
				
				if(form.collapsed){
					form.on('expand', this.addNewForm, this);
					form.expand();
				}else{
					this.addNewForm(form, true);
				}
			},
			
			viewReport: function(grid, record, tr, rowIndex, e, eOpts){
				var panel = this.lookupReference('formPanel');
				panel.removeAll();
				
				var viewForm = Ext.create('modules.report-mitam.MitamForm',{
					incidentId: this.incidentId,
					incidentName: this.incidentName,
					formId: record.data.id,
					datecreated: record.data.datecreated,
					height: panel.getHeight(),
					listeners: {
						afterrender: function(form){
							form.setReadOnly();
						}
					}
				});
				
				panel.add(viewForm);
				panel.doLayout();
				
				viewForm.controller.loadMessageData(JSON.parse(record.data.message));
			},
			
			onCloseReport: function(){
				var record = this.lookupReference('mitamGrid').getSelectionModel().getSelection()[0];
				
				if(record){
					var editForm = Ext.create('modules.report-mitam.MitamForm',{
						incidentId: this.incidentId,
						incidentName: this.incidentName,
						formId: record.data.id,
						datecreated: record.data.datecreated,
						formTypeId: this.formTypeId
					});
					
					this.showFormWindow(editForm, 'Close MITAM', 600);
					
					var message = JSON.parse(record.data.message);
					message.report.mitamStatusValue = "Completed";
					
					editForm.controller.loadMessageData(message);
				}
			},

			onShowGraphs: function() {
				var form = this.lookupReference('formPanel');
				form.removeAll();

				var handler = function(panel, expanded) {
					var graphs = Ext.create('modules.report-mitam.MitamGraphs', {
						height: panel.getHeight() - 25 // panel.getHeight() is slightly greater than actual usable area
					});
					graphs.controller.setIncident(this.incidentId);


					panel.add(graphs);
					panel.doLayout();

					if (!expanded) {
						panel.removeListener('expand', callback, this);
					}
				};

				var callback = handler.bind(this);
				if(form.collapsed){
					form.on('expand', callback, this);
					form.expand();
				}else{
					callback(form, true);
				}
			},
			
			gridReportEdit: function(editor, record, eOpts){
			
				if(record.originalValue != record.value){
 		//'iweb/modules/MapModule',
					
					var selected = this.lookupReference('mitamGrid').getSelectionModel().getSelection()[0];
					
					var json = JSON.parse(selected.data.message);
					json.dateupdated = Core.Util.getUTCTimestamp();
					
					if(selected.data.id){
						selected.data.formId = selected.data.id;
						selected.data.incidentid = this.incidentId;
						selected.data.usersessionid = UserProfile.getUserSessionId();
					}			
			
					delete selected.data.id;
					delete selected.data.mitam;
					delete selected.data.objective;
					delete selected.data.status;
					delete selected.data.deadline;
					delete selected.data.priority;	
					
					if(record.field == 'priority'){
						delete json.priorityValue;
						delete json.report.priorityValue;
						json.report.priorityValue = record.value;
						
					}
					else if(record.field == 'status'){
						delete json.mitamStatusValue;
						delete json.report.mitamStatusValue;
						json.report.mitamStatusValue = record.value;
					}
					
					selected.data.message = JSON.stringify(json);
					
					var url = Ext.String.format('{0}/reports/{1}/{2}', 
						Core.Config.getProperty(UserProfile.REST_ENDPOINT),
						this.incidentId, 'MITAM');
				
					var topic = Ext.String.format("iweb.NICS.incident.{0}.report.{1}.#", this.incidentId, 'MITAM');

					this.mediator.sendPostMessage(url, topic, selected.data);
					

				}
				
			},
			
			
			showFormWindow: function(form, title, height){
				var mitamWindow = new Ext.Window({
		            closable: true,
		            closeAction: 'destroy',
		            scrollable: true,
		            title: title,
		            layout: 'fit',
		            width: 900,
		            height: 600,
		            items:[ form ]
				});
				
				mitamWindow.show();
			},
			
			onLoadReports: function(e, response) {
				var newReports = [];
				if(response) {
					if(response.formId){
						newReports.push(this.buildReportData(response));
					}else if(response.reports && 
						response.reports.length > 0){
						//Add each report
						for(var i=0; i<response.reports.length; i++){
							var report = response.reports[i];
							newReports.push(this.buildReportData(report));
						}
					}
					this.lookupReference('mitamGrid').store.loadRawData(newReports, true);
				}
			},
			
			getFeatureColor: function(status){
				//'Submitted', 'Complete', 'Ongoing', 'Canceled', 'Anticipated'
				if(status == 'Submitted' || status == 'Ongoing' || status == "Anticipated"){
					return "yellow";
				}
				if(status == 'Complete'){
					return "green";
				}
				if(status == "Canceled"){
					return "gray";
				}
			},
			
			buildReportData: function(report){
				var message = JSON.parse(report.message);
				var color = this.getFeatureColor(message.report.mitamStatusValue);
				
				if(message.report.origLat && message.report.origLon){
					this.addFeature(message.report.origLon,  message.report.origLat, 
							report.formId, color);
				}
				
				if(message.report.destLat && message.report.destLon){
					this.addFeature(message.report.destLon,  message.report.destLat, 
							report.formId + "-dest", color);
				}
				
				return {
					id: report.formId,
					mitam: message.report.mission,
					priority: message.report.priorityValue,
					status: message.report.mitamStatusValue,
					objective: message.report.objective,
					deadline: message.report.deadlineDate,
					message: report.message,
					seqnum: report.seqnum,
					destLat: message.report.destLat,
					destLon: message.report.destLon,
					origLat: message.report.origLat,
					origLon: message.report.origLon
				};
			},
			
			getCategories: function(report){
				var categories = "";
				for(var prop in report){
					if(report[prop] == true){
						if(categories != ""){
							categories += ",";
						}
						if(prop == 'Other'){
							categories += report.otherValue;
						}else{
							categories += prop;
						}
					}
				}
				return categories;
			}
	});
});
