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
define(['ext', 'iweb/CoreModule','nics/modules/UserProfileModule','nics/modules/datalayer/DatalayerBuilder',
        './CollabRoomDatalayerModel'],
		function(Ext, Core, UserProfile, DatalayerBuilder){
	
	return Ext.define('modules.collabroom.CollabRoomDatalayerController', {
		extend : 'Ext.app.ViewController',

		alias: 'controller.collabroomdatalayercontroller',

		activeRooms : [],

		collabRoomListenerIds: [],

		init: function(){
			this.mediator = Core.Mediator.getInstance();

			this.tokenHandlerTopic = "nics.datalayer.token.collabroomlayer";

			this.datalayerBuilder = Ext.create('modules.datalayer.builder');

			Core.EventManager.addListener("nics.collabroom.close", this.onCloseCollabRoom.bind(this));
			Core.EventManager.addListener("nics.collabroom.activate", this.onActivateCollabRoom.bind(this));
			Core.EventManager.addListener("nics.incident.join", this.onJoinIncident.bind(this));
			Core.EventManager.addListener("nics.collabroom.data.select", this.selectRoomForLayer.bind(this));
			Core.EventManager.addListener("nics.collabroom.data.add", this.onAddLayerToRoom.bind(this));
			Core.EventManager.addListener(this.tokenHandlerTopic, this.addSecureLayer.bind(this));

			this.getView().getStore().on('update', 'onModelUpdate', this);
		},

		selectRoomForLayer: function(evt, layer){
			if(this.activeRooms.length == 0){
				Ext.MessageBox.alert( Core.Translate.i18nJSON("Room Error"),  Core.Translate.i18nJSON("Please join a collaboration room."));
				return;
			}

			if(this.activeRooms.length > 1){

				var store = Ext.create('Ext.data.Store', {
				    fields: ['collabRoomId', 'collabRoomName'],
				    data : this.activeRooms
				});


				var window = new Ext.Window({
					title:  Core.Translate.i18nJSON('Collabroom Datalayer'),
					referenceHolder: true,
					closeAction: 'hide',
					reference: 'collabRoomWindow',
					resizable: false,
					items: {
						xtype: 'combo',
						reference: 'collabRoomCombo',
						queryModel: 'local',
						valueField: 'collabRoomId',
						displayField: 'collabRoomName'
					},
					buttons: [{
						text:  Core.Translate.i18nJSON('Add'),
						handler: function() {
							var record = window.lookupReference('collabRoomCombo').getSelection();
							this.addLayerToRoom(record.get('collabRoomId'), layer.datalayerid);
							window.close();
						},
						scope: this
					}]
				});

				var combo = window.lookupReference('collabRoomCombo');
				combo.getStore().removeAll();
				combo.bindStore(store);
				combo.select(combo.getStore().getAt(0));

				window.show();
			}
			else {
				this.addLayerToRoom(this.activeRooms[0].collabRoomId,layer.datalayerid);
			}
		},

		addLayerToRoom: function(collabRoomId, dataLayerId) {

			var url = Ext.String.format("{0}/datalayer/{1}/collabroom/{2}/{3}",
					Core.Config.getProperty(UserProfile.REST_ENDPOINT),
					UserProfile.getWorkspaceId(), collabRoomId, dataLayerId);
			var event = 'nics.collabroom.data.add';

			this.mediator.sendPostMessage(url, event);

		},

		onAddLayerToRoom: function(evt, response){
			if(response && response.message != "OK"){
				Ext.MessageBox.alert( Core.Translate.i18nJSON("Status"), Core.Translate.i18nJSON("Failed: ") + response.message);
			}
		},

		/**
		 * On model opacity update, either made locally or remotely, we update the layer opacity
		 */
		onModelUpdate: function(store, record, operation, modifiedFieldNames, details, eOpts) {
			if (record && record.get("layer") && modifiedFieldNames.includes('opacity')) {
				record.get("layer").setOpacity(record.data.opacity);
			}
		},

		onCellClick: function(grid, td, cellIndex, record, tr, rowIndex, e, eOpts){
			if(cellIndex == 1){ //View
	 			if(record.get('view') == true){
	 				record.set("view", false);
	 				record.get("layer").setVisible(false);
	 			}else{
		 			record.set("view", true);
	 				record.get("layer").setVisible(true);
	 			}
	 		}else if(cellIndex == 2){ //Hazard
				if(record.get("layerType") == "wfs") {
					this.onManageHazardClick(record);
				}
			}else if(cellIndex == 5){ //Enable Mobile
	 			var enable;
				if(record.get('enablemobile') == true){
					enable = false;
				}else{
					enable = true;
				}
				record.set("enablemobile", enable);

				this.updateCollabroomDatalayer(this.getLayer(record));
			}
	 	},

		getLayer: function(record){
			return {
				collabroomDatalayerId: record.data.collabroomDatalayerId,
				collabroomid: record.data.collabroomId,
				datalayerid:record.data.datalayerId,
				enablemobile: record.data.enablemobile,
				collabroomOpacity: record.data.opacity,
				hazard: JSON.stringify(record.data.hazard)
			};
		},

		onCellEdit: function(editor, context){
			var record = context.record;

			if(record.data.opacity) {
				record.set("opacity", record.data.opacity);
			}

			this.updateCollabroomDatalayer(this.getLayer(record));
		},

		updateCollabroomDatalayer: function(layer){
			//request layers
			var url = Ext.String.format("{0}/datalayer/{1}/collabroom/update",
				Core.Config.getProperty(UserProfile.REST_ENDPOINT),
				UserProfile.getWorkspaceId());

			var topic = Core.Util.generateUUID();

			Core.EventManager.createCallbackHandler(topic, this,
				function(evt, response){
					if(!response.message == "OK"){
						Ext.MessageBox.alert("NICS", "There was an error updating the datalayer.");
					}
				}
			);

			this.mediator.sendPostMessage(url,topic,layer);
		},

		onUpdateLayer: function(evt, layer){
			var rowIndex = this.view.store.find("collabroomDatalayerId",
				layer.collabroomDatalayerId);
			if(rowIndex != -1){
				var record = this.view.store.getAt(rowIndex);
				record.set("opacity", layer.collabroomOpacity);
				record.set("enablemobile", layer.enablemobile);
			}
		},

		onNewLayer: function(evt, layer){
	 		
	 		var store = this.getView().getStore();
	 		var layerProps = this.buildDataLayer(layer.datalayer);
			var newLayer = this.datalayerBuilder.buildLayer(
					layerProps.layerType, layerProps);
					
			if(newLayer){
				if(layer.collabroomid != this.currentCollabRoomId){
					newLayer.setVisible(false);
				}
				
				this.addNewLayer(newLayer, 
						layerProps.datasourceid, layerProps.datalayerid, 
						layerProps.refreshrate, layerProps.secure);
			}

			var props = {
				datalayerId: layer.datalayerid,
				collabroomId: layer.collabroomid,
				displayname: layer.datalayer.displayname,
				view: true,
				layer: newLayer,
				layerType: layerProps.layerType
			};

			if(layer.collabroomDatalayerId &&
				layer.collabroomDatalayerId != -1){
				props.collabroomDatalayerId = layer.collabroomDatalayerId;
				props.enablemobile = layer.enablemobile;
				props.opacity = layer.collabroomOpacity;

				if(props.opacity && props.opacity!=0) {
					newLayer.setOpacity(props.opacity);
				}else{
					newLayer.setOpacity(1);
				}
			}

			store.add(props);
	 	},
	 	
	 	onRemoveLayer: function(evt, layers){
	 	
	 		var store = this.getView().getStore();
	 		var datasource = store.getDataSource();

	 		for(var i = 0; i < layers.length; i++){
		 		for(var j = 0; j < datasource.getCount(); j++){
		 			if(layers[i].datalayerid == datasource.getAt(j).get('datalayerId') && layers[i].collabroomid == datasource.getAt(j).get('collabroomId')){
		 				Core.Ext.Map.removeLayer(datasource.getAt(j).get('layer'));
						datasource.removeAt(j);
		 			}
	 			}
	 		}
	 	},	
	 	
	 	onActivateCollabRoom: function(e, collabRoomId, readOnly, collabRoomName) {
	 		//Turn off current layers
	 		this.updateLayers(false);
	 		var contained = false;
	 		
	 		for(var i = 0; i < this.activeRooms.length; i ++){
	 			if(this.activeRooms[i].collabRoomName == collabRoomName){
	 				contained = true;
	 			}
	 		}
	 		
	 		if(collabRoomId != "myMap" && !contained){
				
				//request layers
				var url = Ext.String.format("{0}/datalayer/{1}/collabroom/{2}",
					Core.Config.getProperty(UserProfile.REST_ENDPOINT),
					UserProfile.getWorkspaceId(), collabRoomId);
				var eventName = Core.Util.generateUUID();
				
				Core.EventManager.createCallbackHandler(eventName, this, this.onLoadLayers, [collabRoomId]);
				this.mediator.sendRequestMessage(url, eventName);
				
				this.activeRooms.push({'collabRoomId': collabRoomId, 'collabRoomName': collabRoomName});

				var topicAdd = Ext.String.format('iweb.NICS.collabroom.{0}.datalayer.new',collabRoomId);
				var topicRemove = Ext.String.format('iweb.NICS.collabroom.{0}.datalayer.delete',collabRoomId);
				var topicUpdate = Ext.String.format('iweb.NICS.collabroom.{0}.datalayer.update',collabRoomId);
				
				if(this.collabRoomListenerIds.indexOf(collabRoomId) == -1){
					
					Core.EventManager.addListener(topicAdd, this.onNewLayer.bind(this));
					Core.EventManager.addListener(topicRemove, this.onRemoveLayer.bind(this));
					Core.EventManager.addListener(topicUpdate, this.onUpdateLayer.bind(this));
				
					this.collabRoomListenerIds.push(collabRoomId);	
				}
				
				this.mediator.subscribe(topicAdd);
				this.mediator.subscribe(topicRemove);
				this.mediator.subscribe(topicUpdate);
				
			}else{
				var store = this.getView().getStore();
				store.filter('collabroomId', collabRoomId);
				//Turn collabroom layers back on
				this.updateLayers(true);
			}
			
			this.currentCollabRoomId = collabRoomId;
		},
		
		updateLayers: function(view){
			var records = this.getView().getStore().getData();
			for(var i=0; i<records.count(); i++){
				var record = records.getAt(i);
				if(record.data.layer){
					if(record.data.layer){
						if(!view || (view && record.data.view)){
							record.data.layer.setVisible(view);
						}
					}
				}
			}
		},
	
		onLoadLayers : function(collabRoomId, e, response){
			var store = this.getView().getStore();
			var dataLayerArray = [];
			
			Ext.Array.forEach(response.datalayers, function(layer){
				var layerProps = this.buildDataLayer(layer);
				var newLayer = this.datalayerBuilder.buildLayer(
						layerProps.layerType, layerProps);
				if(newLayer){
					this.addNewLayer(newLayer, 
							layerProps.datasourceid, layerProps.datalayerid, 
							layerProps.refreshrate, layerProps.secure);
				}

				var props = {
					datalayerId: layer.datalayerid,
					collabroomId: collabRoomId,
					displayname: layer.displayname,
					view: true,
					layer: newLayer,
					layerType: layerProps.layerType
				};

				if(layer.collabroomDatalayers[0] &&
					layer.collabroomDatalayers[0].collabroomDatalayerId){
					var collabroomDatalayer = layer.collabroomDatalayers[0];

					props.collabroomDatalayerId =
						collabroomDatalayer.collabroomDatalayerId;
					props.enablemobile =
						collabroomDatalayer.enablemobile;
					props.opacity =
						collabroomDatalayer.collabroomOpacity;

					if(collabroomDatalayer.hazard){
						//Parse the attributes
						if (collabroomDatalayer.hazard &&
							typeof collabroomDatalayer.hazard === "string") {
							collabroomDatalayer.hazard =
								JSON.parse(collabroomDatalayer.hazard);
						}

						//assign the hazard
						if(collabroomDatalayer.hazard) {
							props.hazard = collabroomDatalayer.hazard;
						}
					}

					if(props.opacity && props.opacity!=0) {
						newLayer.setOpacity(props.opacity);
					}else{
						newLayer.setOpacity(1);
					}
				}

				dataLayerArray.push(props);
			
			}, this);
			
			store.loadRawData(dataLayerArray,true);
			store.filter('collabroomId', collabRoomId);
		},
		
		onCloseCollabRoom: function(e, menuItem) {
			
			for(var i = 0; i < this.activeRooms.length; i++){
				if(this.activeRooms[i].collabRoomId == menuItem.collabRoomId){
					Ext.Array.erase(this.activeRooms,i,1);
				}
			}
			
			var store = this.getView().getStore();
			var records = store.getData();
			records.each(function(record){
				if(record.data.collabroomId == menuItem.collabRoomId){
					Core.Ext.Map.removeLayer(record.data.layer);
					store.remove(record);
				}
			});
		},
		
		onJoinIncident: function(e, incident){
			//reset the activeRooms
			this.activeRooms = [];

			//clear the grid
			this.getView().getStore().removeAll();
		},
		
		addSecureLayer: function(event, layerObj){
			this.addNewLayer(layerObj.layer, layerObj.datasourceid,
					layerObj.datalayerid, layerObj.refreshRate, true);
		},
		
		addNewLayer: function(layer, datasourceid, datalayerid, refreshrate, secure){
			if(secure){
				//Add the layer once we have a token
				var token = TokenManager.getToken(datasourceid, {
					topic: tokenHandlerTopic,
					params: {
						layer: layer,
						datasourceid: datasourceid,
						datalayerid: datalayerid,
						refreshrate: refreshrate
					}
				});
				
				if(!token){ return; }
			}
			
			if(layer.refreshrate){
				RefreshLayerManager.addLayer(
						refreshrate, datalayerid, 
						layer, datasourceid);
			}
			Core.Ext.Map.addLayer(layer);
		},
		
		buildDataLayer: function(layer) {

			var props = {
				id: layer.datalayerid,
				text: layer.displayname,
				layerType: layer.datalayersource.datasource.datasourcetype.typename,
				url: layer.datalayersource.datasource.internalurl,
				layername: layer.datalayersource.layername,
				attributes: layer.datalayersource.attributes,
				opacity: layer.datalayersource.opacity,
				refreshrate: layer.datalayersource.refreshrate,
				stylepath: layer.datalayersource.stylepath,
				styleicon: layer.datalayersource.styleicon
			};
			
			//Need to add this to API endpoint
			if(layer.secure){
				props.secure = true;
				props.datasourceid = layer.datalayersource.datasource.datasourceid;
			}
			
			return props;
		},
		
		onRemoveButtonClick: function(){
			var records = this.view.getSelection();
			
			if(records.length > 0) {
			
				var collabDataLayers = [];
				
				for(var i = 0; i < records.length; i ++){
					collabDataLayers.push( { 'collabroomid':records[i].get('collabroomId'), 'datalayerid':records[i].get('datalayerId') });
				}
				
				var url  = Ext.String.format("{0}/datalayer/{1}/collabroom/",
						Core.Config.getProperty(UserProfile.REST_ENDPOINT),
						UserProfile.getWorkspaceId());
				
				var topic = 'nics.collabroom.data.remove';
				
				this.mediator.sendPostMessage(url,topic,collabDataLayers);
				
			}
		},

		onManageHazardClick: function(record) {
			var selected = record;
			var _getLayer = this.getLayer;
			var _updateCollabroomDatalayer = this.updateCollabroomDatalayer;
			var hazard = record.data.hazard;

			var window = (new Ext.Window({
				title: Core.Translate.i18nJSON('Manage Hazards'),
				closeAction: 'destroy',
				width: 475,
				height: 250,
				items: [{
					xtype: 'panel',
					items: [{
						xtype: 'form',
						defaultType: 'textfield',
						bodyPadding: 5,
						reference: 'hazardForm',
						layout: {
							type: 'vbox',
							align: 'left'
						},
						defaults: {
							xtype: 'textfield',
							padding: '5 5 5 5'
						},
						items: [
							{
								fieldLabel: Core.Translate.i18nJSON('Hazard Label'),
								name: 'hazardLabel',
								reference: 'hazardLabel',
								vtype: 'extendedalphanum',
								value: hazard ? hazard.hazardLabel : ""
							},
							{
								fieldLabel: Core.Translate.i18nJSON('Hazard Type'),
								name: 'hazardType',
								reference: 'hazardType',
								vtype: 'extendedalphanum',
								value: hazard ? hazard.hazardType : ""
							},
							{
								xtype: 'fieldcontainer',
								fieldLabel: Core.Translate.i18nJSON('Radius'),
								reference: 'radiusContainer',
								layout: 'hbox',
								items: [{
									name: 'radius',
									reference: 'radius',
									xtype: 'textfield',
									vtype: 'extendedalphanum',
									allowBlank: false,
									value: hazard ? hazard.radius : ""
								}, {
									xtype: 'combobox',
									name: 'metric',
									reference: 'metric',
									displayField: 'label',
									valueField: 'metric',
									allowBlank: false,
									value: hazard ? hazard.metric : "",
									store: {
										fields: ['metric', 'label'],
										data: [
											{"metric": "meter", "label": "Meters"},
											{"metric": "kilometer", "label": "Kilometers"}
										]
									}
								}]
							}],
						buttons: [{
							text: Core.Translate.i18nJSON('Save'),
							reference: 'hazardSaveButton',
							formBind: true,
							handler: function () {
								var fields = this.up('form').getForm().getFields().items;

								var hazard = {};

								for (var i = 0; i < fields.length; i++) {
									hazard[fields[i].getReference()] = fields[i].getValue();
								}

								selected.set('hazard', hazard);

								_updateCollabroomDatalayer(_getLayer(selected));

								window.close();
							}
						}, {
							text: Core.Translate.i18nJSON('Remove'),
							reference: 'hazardRemoveButton',
							handler: function () {
								selected.set('hazard', {});

								_updateCollabroomDatalayer(_getLayer(selected));

								window.close();
							}
						}]
					}]
				}]
			})).show();
		}
	});
});
