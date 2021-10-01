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
define(['iweb/CoreModule', 'ext', 'ol', "nics/modules/UserProfileModule", 
        "iweb/modules/geocode/AbstractController", "iweb/modules/MapModule",
        "iweb/modules/drawmenu/Interactions"],

	function(Core, Ext, ol, UserProfile, AbstractController, MapModule, Interactions){
	
		var format = new ol.format.WKT();
	
		Ext.define('modules.report-mitam.MitamFormController', {
			extend : 'modules.geocode.AbstractController',
			
			alias: 'controller.mitamformcontroller',
			
			init: function(){
				this.mediator = Core.Mediator.getInstance();
				
				this.destinations = [];
				this.customFields = [];
				this.locCount = 0;
				this.readOnly = false;
				
				var source = new ol.source.Vector();
				this.vectorLayer = new ol.layer.Vector({
                  source: source
                });

                Core.Ext.Map.addLayer(this.vectorLayer);
                this.vectorLayer.setVisible(true); 
				
				this.interaction = this.drawPolygon(source, Core.Ext.Map.getStyle);
		    	   
		    	this.interaction.on("drawend", this.onLocationDrawEnd.bind(this));
		    	
				Core.EventManager.addListener("nics.incident.join", this.onJoinIncident.bind(this));
				
				//Not removing the feature using the eraser atm
				//source.on('removefeature', this.onDeleteFeature.bind(this));
			},
			
			setReadOnly: function(readOnly){
				this.readOnly = readOnly;
			},
			
			onJoinIncident: function(e, incident) {
				this.incidentName = incident.name;
				this.incidentId = incident.id;
			},
			
			onClose: function(){
				this.onWindowClose();
				Core.Ext.Map.removeLayer(this.vectorLayer);
			},
			
			addCustomField: function(){
				var data = this.getViewModel().getData();
				this.setCustomField(data.newLabel, data.newValue);
				
				//clear text fields
				this.getViewModel().set("newLabel", "");
				this.getViewModel().set("newValue", "");
			},
			
			setCustomField: function(label, value){
				var bindField = label.toLowerCase();
				this.customFields.push(label);
				
				//Make sure there are no duplicates
				var field = {
						xtype: 'textfield',
						fieldLabel: label,
						bind: Ext.String.format("{{0}}", bindField)
				};
				
				var textField = this.lookupReference('mitanFields').add(field);
				
				this.getViewModel().set(bindField, value);
			},
			
			addDestination: function(){
				var _this = this;
				Ext.Msg.prompt('Name', 'Please enter your destination: ', 
					function(btn, text){
					    if (btn == 'ok'){
					    	_this.lookupReference("destinations").getStore().loadData([[text]], true);
					    }
				});
			},
			
			deleteDestination: function(){
				var record = this.lookupReference("destinations").getSelectionModel().getSelection()[0];
				if(record && record.data.feature){
					//Set as removed so that when removed the feature isn't broadcasted to all clients
					record.data.feature.removed = true;
				    this.vectorLayer.getSource().removeFeature(record.data.feature);
				}
				this.lookupReference("destinations").getStore().remove(record);
			},
			
			zoomToDestination: function(){
				var record = this.lookupReference("destinations").getSelectionModel().getSelection()[0];
				if(record && record.data.feature){
					 var extent = record.data.feature.getGeometry().getExtent();
			    	 Core.Ext.Map.zoomToExtent(extent);
				}
			},
			
			untoggleLocate: function() {
				if(this.locateBtnRef){
					this.lookupReference(this.locateBtnRef).toggle(false);
				}
			},
			
			locateArea: function(button, pressed){
		    	if(pressed){
		    		this.prevInteractions = Core.Ext.Map.interactions;
		    		Core.Ext.Map.setInteractions([this.interaction]);
			    }else{
			    	Core.Ext.Map.setInteractions(this.prevInteractions);
		    	}
		    },
		    
		    onLocateCallback: function(feature) {
				feature.setProperties({
					type: 'Geocoded Location'
				});
				
				var view = MapModule.getMap().getView();
				var clone = feature.getGeometry().clone()
					.transform(view.getProjection(), ol.proj.get('EPSG:4326'));
				var coord = clone.getCoordinates();
				this.getView().viewModel.set(this.locateBtnRef + "Lat", coord[1]);
				this.getView().viewModel.set( this.locateBtnRef + "Lon", coord[0]);
				
				/*var descr = this.getView().getFormattedLocation();
				feature.set("description", descr);*/
				
				//turn off our drawing interaction
				var controller = MapModule.getMapController();
				controller.setInteractions(controller.getDefaultInteractions());
				
				this.locateBtnRef = null;
			},
			
			onLocateToggle: function(btn, state) {
				if (!state) {
					MapModule.getMapController().setInteractions(this.previousInteractions);
					return;
				}
				
				this.locateBtnRef = btn.reference;
				
				this.previousInteractions = MapModule.getMapController().getInteractions();
				
				var source = this.getLayer().getSource();
				var style = this.getLayer().getStyle();
				var interaction = Interactions.drawPoint(source, style);
				interaction.on("drawend", this.onDrawEnd.bind(this));
				MapModule.getMapController().setInteractions([interaction]);
			},
		    
		    onInteractionChange: function(){
		    	var button = this.lookupReference('locateButton');
		    	if(button.pressed){
		    		button.toggle();
		    	}
		    	this.prevInteractions = Core.Ext.Map.interactions;
		    },
		    
		    onLocationDrawEnd: function(drawEvent){
		    	//Set Id on feature so that it will not be persisted
		    	drawEvent.feature.setId('mitan-' + Core.Util.generateUUID());
		    	this.lookupReference('locateButton').toggle();
		    	this.lookupReference("destinations").getStore()
		    		.loadData([[this.getFeatureLabel(), drawEvent.feature]], true);
		    },
		    
		    drawPolygon: function(source, style){
	    		var draw = new ol.interaction.Draw({
	    		    source: source,
	    		    style: function(feature, resolution){
	    		    	//draw interaction draws a Polygon and LineString placeholder.
	    		    	//purposely don't render LineString during draw
	    		    	if(feature.getGeometry().getType() === "LineString"){
	    		    		return null;
	    		    	}
	    		    	return style(feature, resolution);
	    		    },
	    		    type: /** @type {ol.geom.GeometryType} */ ('Polygon')
	    		});

	    		return draw;
	    	},
	    	
	    	onSelectionChange: function(grid, selected, eOpts) {
	    		if(selected && selected[0]){
	    			if(selected[0].data.feature){
	    				this.lookupReference('zoomButton').enable();
	    			}else{
	    				this.lookupReference('zoomButton').disable();
	    			}
	    		}
	    	},
	    	
	    	loadMessageData: function(message){
				
				//Load Report
				this.view.viewModel.set(message.report);
				
				if(message.report.serviceTypeValue && message.tasks && message.tasks.length>0){
					var grid = this.lookupReference("taskgrid");
					//var grid = this.onServiceTypeChange(null, message.report.serviceTypeValue);
					grid.getStore().loadData(message.tasks);
				}

				if (message.taskDescription)
				{
					//var textArea = this.lookupReference('tasktext');
					var textArea = this.onServiceTypeChange(null, message.report.serviceTypeValue);
					textArea.setValue(message.taskDescription);
				}
				
				//Load Destinations - Convert WKT to feature and plot on the map
				var destinations = [];
				for(var j=0; j<message.destinations.length; j++){
					var location = message.destinations[j];
					if(location.indexOf('(') > -1){
						try{
							location = new ol.Feature({
							  geometry: format.readGeometry(location)
							});
							location.setId('mitan-' + Core.Util.generateUUID());
							//Plot on the map
							this.vectorLayer.getSource().addFeature(location);
						}catch(e){
							location = message.destinations[j];
						}
					}
					if(location.getId){
						destinations.push([this.getFeatureLabel(), location]);
					}else{
						destinations.push([location]);
					}
				}
				if(destinations.length > 0){
					this.view.viewModel.getStore('destination').loadData(destinations);
				}
				
				//Load Custom Fields - Add custom field to the UI and data model
				for(var prop in message.customFields){
					this.setCustomField(prop, message.customFields[prop]);
				}
			},
			
			submitForm: function(){
	    		
	    		/*
	    		 * form:{
	    		 * 	formId: <id>,
	    		 *  incidentid: <incidentid>,
	    		 *  incidentname: <incidentname>,
	    		 *  formtypeid: 12,
	    		 *  usersessionid: <usersessionid>,
	    		 *  distributed: false,
	    		 *  message: {
	    		 *  	report: {}, //textfields,checkboxes,dropdowns
	    		 *  	customFields: {}, //textfieds that need to be added to the UI
	    		 *      destinations: [], //text location or actual features
	    		 *      tasks: [], //added to the task store
	    		 *  	datecreated: <datecreated>,
	    		 *  	dateupdated: <dateupdated>
	    		 *  }
	    		 * }
	    		 */
	    		
	    		var form = {};
	    		var message = {};

	    		var report = {};
	    		message.report = report;
	    		message.report.mission= this.view.viewModel.get('mission');
	    		message.report.single = (this.view.viewModel.get('single'));
	    		message.report.multi = (this.view.viewModel.get('multi'));
	    		message.report.priorityValue = this.view.viewModel.get('priorityValue');
	    		message.report.mitamStatusValue = this.view.viewModel.get('mitamStatusValue');
	    		message.report.objective = this.view.viewModel.get('objective');
	    		message.report.deadlineDate = this.view.viewModel.get('deadlineDate');
	    		message.report.requestDate = this.view.viewModel.get('requestDate');
	    		message.report.requestor= this.view.viewModel.get('requestor');
	    		message.report.dodApprovedValue = this.view.viewModel.get('dodApprovedValue');
	    		message.report.dodStatusValue = this.view.viewModel.get('dodStatusValue');
	    		message.report.ofdaApprovedValue = this.view.viewModel.get('ofdaApprovedValue');
	    		message.report.ofdaStatusValue = this.view.viewModel.get('ofdaStatusValue');
	    		message.report.assignedLeadValue = this.view.viewModel.get('assignedLeadValue');
	    		message.report.leadStatusValue = this.view.viewModel.get('leadStatusValue');
	    		message.report.origin = this.view.viewModel.get('origin');
	    		message.report.origLat = this.view.viewModel.get('origLat');
	    		message.report.origLon = this.view.viewModel.get('origLon');
	    		message.report.destinationLoc = this.view.viewModel.get('destinationLoc');
	    		message.report.destLat = this.view.viewModel.get('destLat');
	    		message.report.destLon = this.view.viewModel.get('destLon');
	    		message.report.serviceTypeValue = this.view.viewModel.get('serviceTypeValue');
	    		message.report.requestorTypeValue = this.view.viewModel.get('requestorTypeValue');
	    		

	    		var deadTime = this.view.viewModel.get('deadTime');
	    		if(deadTime && deadTime.selection && deadTime.selection.data && deadTime.selection.data.disp){
	    			message.report.deadlineTime = deadTime.selection.data.disp;
	    		}
	    		
	    		var reqTime = this.view.viewModel.get('reqTime');
	    		if(reqTime && reqTime.selection && reqTime.selection.data && reqTime.selection.data.disp){
		    		message.report.requestTime = reqTime.selection.data.disp;
	    		}
	    		
	    		//Populate message with destinations
	    		message.destinations = [];
	    		var store = this.lookupReference("destinations").getStore();
	    		for(var i=0; i<store.count(); i++){
	    			if(store.getAt(i).data.feature){
	    				message.destinations.push(format.writeFeature(store.getAt(i).data.feature));
	    			}else{
	    				message.destinations.push(store.getAt(i).data.title);
	    			}
	    		}
	    		
	    		if(this.lookupReference('taskgrid')){
		    		var taskStore = this.lookupReference('taskgrid').getStore();
		    		if(taskStore.count() > 0 ){ message.tasks = []; }
		    		for(var i=0; i<taskStore.count(); i++){
		    			var data = taskStore.getAt(i).data;
		    			//hard coding Materiel Type.....
		    			message.tasks.push([data.task, data.what, data.weight, data.volume, data.hazmat, data.special]);
		    		}
	    		}

				if (this.lookupReference('tasktext')) {
					message.taskDescription = this.lookupReference('tasktext').getValue();
				}
	    		
	    		if(this.view.formId){
	    			form.formId = this.view.formId;
	    			form.seqnum = this.view.seqnum;
	    			message.datecreated = this.view.datecreated;
	    		}else{
	    			message.datecreated = Core.Util.getUTCTimestamp();
	    		}

	    		message.dateupdated = Core.Util.getUTCTimestamp();
	    		
	    		//Populate form properties
	    		form.incidentid = this.view.incidentId;
	    		form.incidentname = this.view.incidentName;
	    		form.formtypeid = this.view.formTypeId;
	    		form.usersessionid = UserProfile.getUserSessionId();
	    		form.distributed = false;
	    		
	    		form.message = JSON.stringify(message,function(key, val){
	    			return val;
	    		});
	    		
	    		var url = Ext.String.format('{0}/reports/{1}/{2}', 
						Core.Config.getProperty(UserProfile.REST_ENDPOINT),
						this.getView().incidentId, 'MITAM');
				
				var topic = Ext.String.format("iweb.NICS.incident.{0}.report.{1}.#", this.getView().incidentId, 'MITAM');
				
				this.mediator.sendPostMessage(url, topic, form);
				
				this.view.findParentByType('panel').removeAll();
	    	},
	    	
	    	cancelForm: function(){
	    		this.view.findParentByType('panel').removeAll();
	    	},
	    	
	    	addTask: function(){
				var grid = this.lookupReference('taskgrid'),
					store = grid.getStore(),
					rowEditPlugin = grid.getPlugin('rowediting');
			
	    		var records = store.insert(0, {});
				rowEditPlugin.startEdit(records[0], 0);
			},
			
			addNewRow: function(text){
				this.view.lookupReference('taskgrid').getStore().loadData([[text, 'Open']], true);
			},
			
			onBeforeTaskEdit: function(){
				return !this.readOnly;
			},
			
			getFeatureLabel: function(){
				this.locCount++;
				return Ext.String.format("Location {0}", this.locCount);
			},
			
			pickDate: function(dp, date){
				this.getDatePicker().hide();
				this.getDatePicker().inputBox.setValue(Ext.Date.format(date, 'Y-m-d'));
		    },
		    
		    showPicker: function(button){
		    	var picker = this.getDatePicker();
		    	picker.inputBox = this.lookupReference(button.reference + 'Date');
		    	this.getDatePicker().show();
		    },
		    
		    getDatePicker: function(){
		    	if(!this.datePicker){
		    		var handler = this.pickDate.bind(this);
					this.datePicker = Ext.create('Ext.Window', {
			 			layout: 'fit',
			 			close: 'hide',
			 			items:[{
		                	xtype: 'datepicker',
		                	reference: 'datePicker',
		                	handler: handler
						}]
			 		});
		    	}
		    	return this.datePicker;
		    },
			
			onServiceTypeChange: function(combobox, newValue, oldValue, eOpts){
				if (newValue == "Transport Materiel" || newValue == "Re-supply")
				{
					// Destroy text area if it exists
					if (this.lookupReference('tasktext'))
						this.lookupReference('tasktext').destroy();

					if(!this.lookupReference('taskgrid')) {
						var gridPanel = {
							xtype: 'gridpanel',
							minHeight: 120,
							header: false,
							border: false,
							viewConfig: {
								emptyText: 'Click on the Add button to create an entry',
								deferEmptyText: false,
								markDirty: false
							},
							plugins: [{
								ptype: 'rowediting',
								pluginId: 'rowediting',
								clicksToEdit: 1
							}],
							listeners: {
								'beforeedit': 'onGridBeforeEdit',
								'canceledit': 'onGridCancelEdit'
							},
							reference: 'taskgrid',
							buttonAlign: 'center',
							buttons: [{ text: 'Add', handler: 'addTask' }]
						};

						gridPanel.columns = [
							{ text: '#', dataIndex: 'task', editor: {}, width: 50},
							{ text: 'What', dataIndex: 'what', editor: {} },
							{ text: 'Weight', dataIndex: 'weight', editor: {} },
							{ text: 'Volume', dataIndex: 'volume', editor: {} },
							{ text: 'HAZMAT', dataIndex: 'hazmat', editor: {} },
							{ text: 'Special', dataIndex: 'special', editor: {} }
						];

						gridPanel.store = {
							model: 'Task'
						};

						return this.lookupReference('whatFields').add(gridPanel);
					}
				}
				else
				{
					// Destroy grid if it exists
					if (this.lookupReference('taskgrid'))
						this.lookupReference('taskgrid').destroy();

					if (!this.lookupReference('tasktext')) {
						var textArea = {
							xtype: 'textareafield',
							grow: true,
							name: 'taskDescription',
							fieldLabel: 'Task Description',
							labelWidth: 160,
							emptyText: 'Enter task description',
							reference: 'tasktext'
						};

						return this.lookupReference('whatFields').add(textArea);
					}
				}
			},
			
			onGridBeforeEdit: function(editor, context, eOpts) {
				var record = context.record;
				//only allow editing phantom records
				return record.phantom;
			},
			
			onGridCancelEdit: function(editor, context, eOpts) {
				var record = context.record;
				//remove phantom on cancel edit
				record.store.remove(record);
			}
			
		});
});
