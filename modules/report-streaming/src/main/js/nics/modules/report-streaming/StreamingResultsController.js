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
define(['ext', 'iweb/CoreModule', 'iweb/modules/MapModule',
			"./StreamingResultsModel", 'nics/modules/UserProfileModule', 'ol'],
		function(Ext, Core, MapModule, StreamingResultsModel, UserProfile, ol){
	
	return Ext.define('modules.report-streaming.StreamingResultsController', {
		extend : 'Ext.app.ViewController',

		alias: 'controller.streamingresultscontroller',

		topic: 'iweb.media.streams',
		topicAdded: 'iweb.media.streams.added',
		topicUpdated: 'iweb.media.streams.updated',
		topicDeleted: 'iweb.media.streams.deleted',

		isUpdate: false,

		init: function(){
			this.mediator = Core.Mediator.getInstance();

			// TODO: may want to keep vector layer for if the stream has an initial location we can roughly
			// 	associate it with. Even if it's a drone that's moving, can having a starting point. Then for
			// 	other feeds, like from phones, same thing..?

			/*var source = new ol.source.Vector();
			this.vectorLayer = new ol.layer.Vector({
				source : source,
				style : Core.Ext.Map.getStyle
			});
			this.vectorLayer.setVisible(true);

			Core.Ext.Map.addLayer(this.vectorLayer);
			 */


			// TODO: could be used to style markers for where the drone is streaming from?
			//MapModule.getMapStyle().addStyleFunction(this.styleTaskingFeature.bind(this));
			this.initWindow();

			this.bindEvents();

		},

		bindEvents: function() {
			this.mediator.subscribe(this.topic);
			Core.EventManager.addListener(this.topic, this.onProcessResults.bind(this));
			Core.EventManager.addListener(UserProfile.PROFILE_LOADED, this.populateStreams.bind(this));

			Core.EventManager.addListener(this.topicAdded, this.onAdded.bind(this));
			this.mediator.subscribe(this.topicAdded);
			Core.EventManager.addListener(this.topicUpdated, this.onUpdated.bind(this));
			this.mediator.subscribe(this.topicUpdated);
			Core.EventManager.addListener(this.topicDeleted, this.onDeleted.bind(this));
			this.mediator.subscribe(this.topicDeleted);
		},

		initWindow: function() {

			this.streamIdInput = Ext.create('Ext.form.field.Number', { name: 'streamId',
				fieldLabel: Core.Translate.i18nJSON('ID'), width: 100, maxLength: 40, enforceMaxLength: true,
				id:'addStreamId', hidden: true });
			this.streamNameInput = Ext.create('Ext.form.field.Text', { name: 'streamName',
				fieldLabel: Core.Translate.i18nJSON('Name'), width: 100, maxLength: 40, enforceMaxLength: true,
				allowBlank: false, id:'addStreamName' });
			this.streamUrlInput = Ext.create('Ext.form.field.Text', { name: 'streamUrl',
				fieldLabel: Core.Translate.i18nJSON('URL'), width: 100, maxLength: 120, enforceMaxLength: true,
				id:'addStreamUrl', vtype: 'url' });

			this.addButton = Ext.create('Ext.Button', { text: Core.Translate.i18nJSON('Add') });
			this.addButton.on("click", this.addStream, this);
			this.cancelButton = Ext.create('Ext.Button', { text: Core.Translate.i18nJSON('Cancel'),
				handler: function(){ this.closeAddWindow(); }, scope: this});

			this.streamWindow = Ext.create('Ext.window.Window',{
				title: Core.Translate.i18nJSON('Add Stream'),
				cls: 'stream-window',
				bodyBorder : false,
				layout : 'form',
				minimizable : false,
				closable : true,
				maximizable : false,
				resizable : false,
				draggable : true,
				padding : 10,
				width: 400,
				closeAction: 'hide',
				buttonAlign: 'center',
				fieldDefaults: {
					labelAlign: 'right',
					labelWidth: 100
				},
				items: [
					{
						xtype: 'fieldset',
						title: '',
						defaultType: 'textfield',
						defaults: {
							anchor: '-10',
							vtype:'simplealphanum'
						},
						items:[
							this.streamIdInput,
							this.streamNameInput,
							this.streamUrlInput
						]
					}
				],
				buttons: [
					this.addButton,
					this.cancelButton
				]
			});
		},

		resetAddWindow: function(){
			this.streamIdInput.setValue("");
			this.streamNameInput.setValue("");
			this.streamUrlInput.setValue("");
			this.addButton.setText(Core.Translate.i18nJSON('Add'));
		},

		closeAddWindow: function() {
			this.resetAddWindow();
			this.streamWindow.hide();
		},

		populateStreams: function(evt, userProfile) {
			var url = Ext.String.format("{0}/ws/{1}/mediastreams",
				Core.Config.getProperty(UserProfile.REST_ENDPOINT),
				UserProfile.getWorkspaceId());

			// Request streams
			this.mediator.sendRequestMessage(url, this.topic);
		},

		onDoubleClick: function(grid, record, item, index, e, eOpts) {
  			this.showUpdate(e, record);
  			// Return to not make it not actively select the item?
		},

		onSelectionChange: function(grid, selected, eOpts){

			if(!selected[0]) {
				// Deselected
				this.view.lookupReference("detailsPanel").update("<h1>Select a stream</h1>");
				return;
			}

			var row = selected[0].data;

			var streamIframe = Ext.String.format('<iframe width="560" height="315" src="{0}" frameborder="0" allowfullscreen></iframe>',
				row.url);

			var streamHtml = Ext.String.format("<h1>{0}</h1>{1}", row.title, streamIframe);
			this.view.lookupReference("detailsPanel").update(streamHtml);
		},

		onProcessResults: function(event, response, append) {

			if(append !== true) {
				append = false;
			}

			if(response && response.streams) {

				this.view.lookupReference("streamGrid").getStore().loadData(response.streams, append);

				if(append === false) {
					this.doDeselect();
				}
			}
		},

		doDeselect: function() {
			this.view.lookupReference("streamGrid").getSelectionModel().deselectAll();
		},

		/**
		 * Show the Add dialog
		 */
		showAdd: function() {

			if(this.isUpdate) {
				this.addButton.removeListener("click", this.updateStream, this);
				this.addButton.on("click", this.addStream, this);
				this.isUpdate = false;
			}

			this.streamWindow.setTitle(Core.Translate.i18nJSON('Add Stream'));
			this.streamWindow.show();
		},

		isInvalidAddUpdate: function() {
			var validName = this.streamNameInput.validate();
			if(validName === false) {
				Ext.Msg.alert(Core.Translate.i18nJSON("Add Stream", "Please enter a name"));
				return true;
			}

			var validUrl = this.streamUrlInput.validate();
			if(validUrl === false) {
				Ext.Msg.alert(Core.Translate.i18nJSON("Add Stream"),
					Core.Translate.i18nJSON("Please enter a valid URL"));
				return true;
			}

			return false;
		},

		addStream: function() {

			if(this.isInvalidAddUpdate()) {
				return;
			}

			// add stream, and have callback close window
			var stream = {
				msid: -1,
				title: this.streamNameInput.getValue(),
				url: this.streamUrlInput.getValue()
			};

			var url = Ext.String.format("{0}/ws/{1}/mediastreams",
				Core.Config.getProperty(UserProfile.REST_ENDPOINT),
				UserProfile.getWorkspaceId());

			Ext.Ajax.request({
				scope: this,
				url: url,
				method: 'POST',
				headers: {
					"X-Remote-User": UserProfile.getUsername()
				},
				jsonData: stream,

				success: function(response) {
					var payload = JSON.parse(response.responseText);

					this.onAdded(this.topicAdded, payload);
					// TODO: show success confirmation
					this.closeAddWindow();

					Ext.Msg.alert(Core.Translate.i18nJSON("Add Stream"),
						Core.Translate.i18nJSON("Successfully added Stream"));
				},

				failure: function(response, request) {
					// TODO: wrap on try/catch and still show an error alert dialog
					var payload, reason;
					if(response.responseText && response.responseText.length > 0) {
						payload = JSON.parse(response.responseText);
					}

					if(payload) {
						reason = payload.message ? payload.message : "Unknown failure";
					} else {
						reason = "Unknown failure"; // can check statusText
					}

					var message = Ext.String.format("Error adding stream ({0}): {1}",
						response.status, reason);

					Ext.Msg.alert(Core.Translate.i18nJSON("Add Stream Error"), message);
				}
			});

		},

		onAdded: function(evt, response) {
			this.onProcessResults(evt, response, true);
		},

		updateStream: function() {

			if(this.isInvalidAddUpdate()) {
				return;
			}

			var stream = {
				msid: this.streamIdInput.getValue(),
				title: this.streamNameInput.getValue(),
				url: this.streamUrlInput.getValue()
			};

			var url = Ext.String.format("{0}/ws/{1}/mediastreams/{2}",
				Core.Config.getProperty(UserProfile.REST_ENDPOINT),
				UserProfile.getWorkspaceId(), stream.msid);

			Ext.Ajax.request({
				scope: this,
				url: url,
				method: 'PUT',
				headers: {
					"X-Remote-User": UserProfile.getUsername()
				},
				jsonData: stream,

				success: function(response) {
					var payload = JSON.parse(response.responseText);

					this.onUpdated(this.topicAdded, payload);
				},

				failure: function(response, request) {
					var payload = null;
					var reason = null;
					if(response.responseText) {
						payload = JSON.parse(response.responseText);
						reason = payload.message ? payload.message : "Unknown failure";
					} else {
						reason = response.statusText ? response.statusText : "Unknown failure";
					}

					var message = Ext.String.format("Error updating stream ({0}): {1}",
						response.status, reason);

					Ext.Msg.alert(Core.Translate.i18nJSON("Update Stream Error"), message);
				}
			});

		},

		onUpdated: function(evt, response) {
			this.doUpdateStream(response.streams);
		},

		doUpdateStream: function(streams) {
			var stream = streams[0];
			var store = this.view.lookupReference("streamGrid").getStore();

			var record = store.getAt(store.find("msid", stream.msid));
			if(record) {
				record.set('title', stream.title);
				record.set('url', stream.url);
				record.commit();

				this.closeAddWindow();
				this.doDeselect();
				Ext.Msg.alert(Core.Translate.i18nJSON("Update Stream"),
					Core.Translate.i18nJSON("Successfully updated Stream"));
			} else {
				Ext.Msg.alert(Core.Translate.i18nJSON('Stream'), Core.Translate.i18nJSON('Error updating stream'));
			}
		},

		deleteStream: function() {

			Ext.MessageBox.confirm('Delete Stream', 'Delete stream?', function(btn){
				if(btn === 'yes') {
					this.doDeleteStream();
				}
			}, this);

		},

		doDeleteStream: function() {
			var selModel = this.view.lookupReference("streamGrid").getSelectionModel();
			if(!selModel.hasSelection()) {
				Ext.Msg.alert("Delete Stream", "You must select a stream to delete");
				return;
			}

			var record = selModel.getSelection()[0];

			var streamId = record.get("msid");

			var url = Ext.String.format("{0}/ws/{1}/mediastreams/{2}",
				Core.Config.getProperty(UserProfile.REST_ENDPOINT),
				UserProfile.getWorkspaceId(), streamId);

			Ext.Ajax.request({
				scope: this,
				url: url,
				method: 'DELETE',
				headers: {
					"X-Remote-User": UserProfile.getUsername()
				},
				success: function(response) {
					var payload = JSON.parse(response.responseText);
					this.onDeleted(this.topicDeleted, payload, streamId);
				},

				failure: function(response, request) {
					var payload, reason;

					if(response.responseText && response.responseText.length > 0) {
						payload = JSON.parse(response.responseText);
						reason = payload.message ? payload.message : "Unknown failure";
					} else {
						reason = response.statusText ? response.statusText : "Unknown failure";
					}

					var message = Ext.String.format("Error deleting stream ({0}): {1}", response.status,
						reason);

					Ext.Msg.alert(Core.Translate.i18nJSON("Delete Stream Error"), message);
				}

			});
		},

		onDeleted: function(evt, response, streamId) {

			var store = this.view.lookupReference("streamGrid").getStore();
			try {
				var recordToDelete = this.view.lookupReference('streamGrid').getStore().find("msid", streamId);
				store.removeAt(recordToDelete);
				Ext.Msg.alert(Core.Translate.i18nJSON("Delete Stream"),
					Core.Translate.i18nJSON("Successfully deleted Stream"));
			} catch(e) {
				console.error("Exception removing stream with id " + streamId, e);
			}
		},

		/**
		 * Show create/update window with update
		 *
		 * @param e
		 * @param selected
		 */
		showUpdate: function(e, selected) {

			this.streamWindow.setTitle(Core.Translate.i18nJSON('Update Stream'));
			this.addButton.setText(Core.Translate.i18nJSON('Update'));

			if(!this.isUpdate) {
				this.addButton.removeListener("click", this.addStream, this);
				this.addButton.on("click", this.updateStream, this);
				this.isUpdate = true;
			}

			this.streamIdInput.setValue(selected.data.msid);
			this.streamNameInput.setValue(selected.data.title);
			this.streamUrlInput.setValue(selected.data.url);

			this.streamWindow.show();
		}

		/*,

		addFeature : function(lon, lat) {
			try {
				this.vectorLayer.getSource().clear();
				if (lat && lon) {
					var longitude = Number(lon);
					var latitude = Number(lat);

					var feature = new ol.Feature({
						geometry : new ol.geom.Point(ol.proj
							.transform([ longitude, latitude ],
								'EPSG:4326', 'EPSG:3857'))
					});

					feature.set('fillColor', 'green');
					feature.set('strokeColor', 'black');
					feature.set('type', 'uas');

					this.vectorLayer.getSource().addFeature(feature);

					return feature;
				}
			} catch (e) {}

			return null;
		}*//*,

		styleTaskingFeature: function(feature, resolution, selected) {
			if (feature.get('type') != 'uas') {
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

			return styles;
		}*/
	});
});
