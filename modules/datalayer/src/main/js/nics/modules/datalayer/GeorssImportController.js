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
define(['ext', 'ol', "iweb/CoreModule", "nics/modules/UserProfileModule"],
	function(Ext, ol, Core, UserProfile){
	
		return Ext.define('modules.datalayer.GeorssImportController', {
			extend : 'Ext.app.ViewController',
			
			alias: 'controller.datalayer.georssimportcontroller',
			
			init: function() {
				this.dataSourceType = this.getView().dataSourceType;
				this.workspaceId = this.getView().workspaceId;
				this.allowUrl = this.getView().allowUrl;
				this.url = this.getView().url;
				
				this.mediator = Core.Mediator.getInstance();
				
				this.bindEvents();

				var form = this.getView().getFormPanel().getForm();
				if(form){
					var refreshrate = form.findField('refreshrate');
					if(refreshrate){
						refreshrate.setValue(0);
					}
				}
			},
			
			bindEvents: function(){
				Core.EventManager.addListener("nics.folders.load", this.onLoadFolders.bind(this));
				Core.EventManager.addListener("nics.folders.remove", this.onRemoveFolder.bind(this));
				Core.EventManager.addListener("nics.folders.update", this.onUpdateFolder.bind(this));

				this.control({
					'filefield':{
						change: this.fileChange
					}
				});
			},

			onRemoveFolder: function(e, folderids){
				var folderCombo = this.getView().lookupReference('folderCombo');
				Ext.Array.forEach(folderids, function(folderId) {
					var index = folderCombo.store.find("folderid", folderId);
					if (index != -1) {
						folderCombo.store.removeAt(index);
					}
				});
			},

			onLoadFolders: function(e, folders){
				var folderCombo = this.getView().lookupReference('folderCombo');
				if(folderCombo.store.getCount() == 0) {
					folderCombo.store.insert(0, {folderid: 'none', name: '&nbsp;'});
				}
				folderCombo.store.loadData(folders, true);
				folderCombo.store.autoSync = false;
			},

			onUpdateFolder: function(e, folderId, foldername){
				var folderCombo = this.getView().lookupReference('folderCombo');
				var record = folderCombo.getStore().findRecord("folderid",folderId);
				if(record){
					if(record.get("foldername") != foldername) {
						record.set("foldername", foldername);
					}
				}
			},
			
			afterRender: function(component) {
				var panel = component.getFormPanel(),
						form = panel.getForm();
				
				//limit each file input to its type (if supported)
				panel.query('filefield').forEach(function(fileField){
					if (fileField.extension) {
						fileField.fileInputEl.set({
							accept: '.' + fileField.extension
						});
					}
				});
				
				//validate immediately to give user direction
				form.isValid();
			},
			
			fileChange: function(fileInput, value, eOpts){
				var fileInputDom = fileInput.fileInputEl.dom;
				
				//if this browser supports files attribute,
				//set the input to the selected filename
				if (fileInputDom.files) {
					var files = fileInputDom.files;
					if (files.length) {
						fileInput.setRawValue(files[0].name);
					}
				}
			},

			submitForm: function(b, e){

				var form = this.getView().getFormPanel().getForm();
        var fileType = this.dataSourceType;
        var feedUrl = form.findField('feedUrl').getValue();
        var displayName = form.findField('displayname').getValue();
        var refreshRate = form.findField('refreshrate').getValue();
		var folderId = this.lookupReference('folderCombo').getValue();
        var url = this.url;

        var params = {
			'usersessionid': UserProfile.getUserSessionId(),
			'baselayer': true,
			'fileType': fileType
		};

        if(folderId){
		 	params.folderid = folderId;
		}

        // TODO make request and validate endpoint before persisting to DB
        //

				form.submit({
					url: url,
					params: params,
					waitMsg: Core.Translate.i18nJSON('Adding GeoRSS feed...'),
					scope: this,
					success: function(fp, o) {
					    var result = o.result;
					    var msg = result.message;
					    // TODO: want to parse the message for the case where the upload worked, but
					    // TODO: creating the layer failed. OR, we can never let that happen, and delete
					    // TODO: the layer on geoserver if the nics layer failed....
						Ext.Msg.show({
							title: Core.Translate.i18nJSON('File Import'),
							message: Core.Translate.i18nJSON('Files uploaded successfully.') + "<br/><br/>" + msg,
							buttons: Ext.Msg.OK
						});
						
						form.reset();
						
						//reset all the field attributes
						this.afterRender(this.getView());
					},
					failure: function(fp, o) {
						var failureType = o.failureType;
						var result = o.result;
						var msg = result.message;

						Ext.Msg.show({
							title: Core.Translate.i18nJSON('File Import'),
							message: Core.Translate.i18nJSON('Failed to upload your files.') +
							    '<br/><br/>' + msg, // TODO: double check, but could be very long w/o a line break
							buttons: Ext.Msg.OK,
							icon: Ext.Msg.ERROR
						});
						
						//reset all the field attributes
						this.afterRender(this.getView());
					}
				});
			}
			
		});
});
