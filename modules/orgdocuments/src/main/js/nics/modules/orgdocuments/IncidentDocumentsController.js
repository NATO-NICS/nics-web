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
define(['ext', 'iweb/CoreModule', "./IncidentDocumentsModel", 'nics/modules/UserProfileModule'],
		function(Ext, Core, IncidentDocumentsModel, UserProfile){
	
	return Ext.define('modules.orgdocuments.IncidentDocumentsController', {
		extend : 'Ext.app.ViewController',

		alias: 'controller.incidentdocumentscontroller',

		topic_string: "iweb.nics.incident.{0}.documents",

		delete_topic_string: "iweb.nics.incident.{0}.delete.documents",

		init: function(){
			this.mediator = Core.Mediator.getInstance();
			this.loadDocs = this.onLoadIncidentDocuments.bind(this);
			this.onDeleteDocs = this.onDeleteDocument.bind(this)

			Core.EventManager.addListener("nics.incident.join", this.onJoinIncident.bind(this));
			Core.EventManager.addListener("nics.incident.close", this.onCloseIncident.bind(this));

			if(!UserProfile.isSuperUser()){
				this.hideDeleteButton();
			}
		},

		hideDeleteButton: function(){
			this.view.lookupReference('deleteButton').hide();
		},

		onCloseIncident: function(e, incident){
			this.view.getStore().removeAll();
			this.view.view.refresh();

			Core.EventManager.removeListener(this.topic, this.loadDocs);
			this.mediator.unsubscribe(this.topic);

			Core.EventManager.removeListener(this.delete_topic, this.loadDocs);
			this.mediator.unsubscribe(this.delete_topic);

			this.view.setDisabled(true);
		},

		onJoinIncident: function(e, incident) {
			this.view.setDisabled(false);
			this.incidentId = incident.id;
			this.topic = Ext.String.format(this.topic_string, this.incidentId);
			this.delete_topic = Ext.String.format(this.delete_topic_string, this.incidentId);

			Core.EventManager.addListener(this.topic, this.loadDocs);
			this.mediator.subscribe(this.topic);


			Core.EventManager.addListener(this.delete_topic, this.onDeleteDocs);
			this.mediator.subscribe(this.delete_topic);

			//Load Incident Documents
			var url = Ext.String.format("{0}/folder/{1}/document?incidentId={2}",
					Core.Config.getProperty(UserProfile.REST_ENDPOINT),
					UserProfile.getWorkspaceId(),
					incident.id);
			this.mediator.sendRequestMessage(url, this.topic);
		},
		
		onLoadIncidentDocuments: function(e, response) {
			if(Ext.isArray(response)){
				var _this = this;
				Ext.Array.forEach(response, function(folder){
					_this.loadDocument(folder);
				});
			}else if(response.documents){
				this.loadDocument(response);
			}
		},

		onDeleteDocument: function (e, response){
			if(response && response.folderId){
				var row = this.view.getStore().find("folderId", response.folderId);
				if(row != -1){
					this.view.getStore().removeAt(row);
				}
			}
		},

		loadDocument: function(folder){
			if(folder.documents.length != 0) {
				var created = [];
				var latest;
				var displayname;
				var description;
				for (var i = 0; i < folder.documents.length; i++) {
					var date = new Date(folder.documents[i].created);
					if(!latest || date > latest.date){
						latest = { date: date, index: i};
					}

					displayname = folder.documents[i].displayname;
					description = folder.documents[i].description;

					created.push({
						created: Ext.Date.format(date, 'Y-m-d H:i:s'),
						filename: folder.documents[i].filename});
				}

				var index = this.view.getStore().find("folderId", folder.folderId);
				if(index != -1){
					var row = this.view.getStore().getAt(index);
					var data = row.data;
					row.set('created',
						created[latest.index].created);
					if(data && data.versions) {
						data.versions = Ext.Array.merge(
							data.versions, created);
					}
					//Update displayname
					if(displayname){
						row.set("displayname", displayname);
					}
					//Update description
					if(description){
						row.set("description", description);
					}
				}else{
					var doc = {};
					doc.folderId = folder.documents[0].folderid;
					doc.displayname = folder.documents[0].displayname;
					doc.description = folder.documents[0].description;
					doc.filetype = folder.documents[0].filetype;
					doc.versions = created;
					doc.created = created[latest.index].created;
					doc.latest = created[latest.index].filename;
					this.view.getStore().loadData([doc], true);
				}
			}
		},
		
		onAddButtonClick: function() {
			//Add new document
			this.uploadForm();
		},

		onUploadButtonClick: function(){
			var selected = this.view.getSelectionModel().getSelection();
			if(selected && selected[0] && selected[0].data){
				this.uploadForm(selected[0].data.folderId);
			}else{
				Ext.MessageBox.alert("NICS", "Please select a document to update.");
			}
		},

		onDeleteButtonClick: function(){
			var selected = this.view.getSelectionModel().getSelection();
			if(selected && selected[0] && selected[0].data){
				Ext.MessageBox.confirm(
					Core.Translate.i18nJSON('Delete Datalayer?'),
					Core.Translate.i18nJSON('Are you sure you want delete this datalayer?'),
					function(btn){
						if (btn !== 'yes') {
							return;
						}
						var folderId = selected[0].data.folderId;
						var topic = 'iweb.nics.incident.delete.documents.callback';

						var url = Ext.String.format("{0}/folder/{1}/document/incident/{2}/folder/{3}",
							Core.Config.getProperty(UserProfile.REST_ENDPOINT),
							UserProfile.getWorkspaceId(),
							this.incidentId, folderId
						);

						Core.EventManager.createCallbackHandler(topic, this,
							function(evt, response){
								if(response && response.message){
									Ext.MessageBox.alert("NICS", response.message);
								}
							}
						);

						this.mediator.sendDeleteMessage(url, topic);
					}, this);

			}else{
				Ext.MessageBox.alert("NICS", "Please select a document to delete.");
			}
		},

		onDownloadButtonClick: function(){
			var selected = this.view.getSelectionModel().getSelection();
			var downloadDir = Core.Config.getProperty("document.incident.directory");
			if(selected && selected[0] && selected[0].data){
				var editor = this.view.columns[2].getEditor(selected[0]);
				var filename;
				if(editor && editor.getSelectedRecord()){
					filename = editor.getSelectedRecord().data.filename;
				}else{
					filename = selected[0].data.latest;
				}
				if(filename){
					window.open(downloadDir + filename);
				}
			}else{
				Ext.MessageBox.alert("NICS", "Please select a document to download.");
			}
		},

		uploadForm: function(folderid){
			var url;
			var displayname = "";
			var description = "";
			if(folderid) {
				url = Ext.String.format("{0}/folder/{1}/document/folder/{2}/usersession/{3}?incidentId={4}",
					Core.Config.getProperty(UserProfile.REST_ENDPOINT),
					UserProfile.getWorkspaceId(),
					folderid,
					UserProfile.getUserSessionId(),
					this.incidentId);
				var row = this.view.getStore().find("folderId", folderid);
				if(row != -1){
					var data = this.view.getStore().getAt(row).data;
					displayname = data.displayname;
					description = data.description;
				}
			}else{
				url = Ext.String.format("{0}/folder/{1}/document/usersession/{2}?incidentId={3}",
					Core.Config.getProperty(UserProfile.REST_ENDPOINT),
					UserProfile.getWorkspaceId(),
					UserProfile.getUserSessionId(),
					this.incidentId);
			}

			var window = new Ext.Window({
				title:  Core.Translate.i18nJSON('Upload Document'),
				closeAction: 'destroy',
				width: 600,
				height: 300,
				referenceHolder: true,
				items:[{
					xtype: 'panel',
					items: [{
						xtype: 'form',
						title: Core.Translate.i18nJSON('Document Import'),
						reference: 'formPanel',
						buttonAlign: 'center',
						layout: {
							type: 'vbox',
							align: 'center'
						},
						defaults: {
							width: '100%',
							xtype: 'textfield',
							padding: '5 20'
						},
						items: [{
							xtype: 'filefield',
							name: 'fileName',
							buttonText: Core.Translate.i18nJSON('Browse')
						}, {
							fieldLabel: Core.Translate.i18nJSON('Create Display Name in NICS'),
							name: 'displayName'
						},{
							fieldLabel: Core.Translate.i18nJSON('Description'),
							name: 'description'
						}],
						buttons:[{
							text: Core.Translate.i18nJSON('Upload'),
							handler : function(){
								var form = this.up('form').getForm();

								if (url.indexOf('create') != -1 &&
									Ext.isEmpty(form.getFields().getAt(1).getValue())) {
									Ext.Msg.show({
										title: Core.Translate.i18nJSON('Document Import'),
										message: Core.Translate.i18nJSON('Please provide a display name.'),
										buttons: Ext.Msg.OK
									});
								} else {
									var filepath = form.getFields().getAt(0).getValue();
									var exts = [".doc", ".docx", ".xls", ".xlsx", ".pdf"];
									var valid = false;
									Ext.Array.forEach(exts, function(ext) {
										if (Ext.String.endsWith(filepath, ext)) {
											valid = true;
										}
									});

									if (valid) {

										form.submit({
											url: url,
											waitMsg: Core.Translate.i18nJSON('Uploading file...'),
											success: function(fp, o) {
												Ext.Msg.show({
													title: Core.Translate.i18nJSON('Document Import'),
													message: Core.Translate.i18nJSON('Success!'),
													buttons: Ext.Msg.OK
												});
												fp.owner.up('window').close();
											},
											failure: function(fp, o) {
												Ext.Msg.show({
													title: Core.Translate.i18nJSON('Document Import'),
													message: Core.Translate.i18nJSON('Failed to upload your file.'),
													buttons: Ext.Msg.OK,
													icon: Ext.Msg.ERROR
												});
												fp.owner.up('window').close();
											}
										});
									} else {
										Ext.Msg.show({
											title: Core.Translate.i18nJSON('Document Import'),
											message: Core.Translate.i18nJSON('Please upload a Word, Excel, or PDF document.'),
											buttons: Ext.Msg.OK
										});
									}
								}
							}
						}]
					}]
				}]
			});

			var panel = window.lookupReference("formPanel");
			var form;
			if(panel){
				form = panel.getForm();
			}
			if(form && displayname) {
				form.getFields().getAt(1).setValue(displayname);
			}
			if(form && description){
				form.getFields().getAt(2).setValue(description);
			}
			window.show();
		},

		onBeforeCellEdit: function(editor, field) {
			if (field.column.dataIndex != "created") {
				return false;
			}else{
				var combo = editor.grid.columns[2].getEditor(editor.record);
				combo.getStore().loadData(field.record.data.versions);
			}
			return true;
		}
	});
});
