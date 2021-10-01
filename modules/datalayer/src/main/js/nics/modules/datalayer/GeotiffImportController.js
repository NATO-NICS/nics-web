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
	
		return Ext.define('modules.datalayer.GeotiffImportController', {
			extend : 'Ext.app.ViewController',
			
			alias: 'controller.datalayer.geotiffimportcontroller',
			
			init: function() {
				this.dataSourceType = this.getView().dataSourceType;
				this.workspaceId = this.getView().workspaceId;
				this.allowUrl = this.getView().allowUrl;
				this.url = this.getView().url;
				
				this.mediator = Core.Mediator.getInstance();
				
				this.bindEvents();
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

            /**
                If invalid input found, displays a messagebox detailing errors regarding file related
                form fields. They must either upload a valid file, or specify a valid file local to the
                server. The specified file must be a file with extension tif, tiff, or zip.

                @param form the form to be checked for validation before being submitted

                @return true if valid, false otherwise
            */
			validateFiles: function(form) {
			    var valid = true;
			    var upload = form.findField('tifFile').getValue();
			    var local = form.findField('filename').getValue();

                var message = "Fix the following problem(s):<br/>";

                // At least one needs a value
                if(upload === "" && local === "") {
                    valid = false;
                    message += "<br/>- You must either specify a file local to the server, or choose a file to upload";
                }

                // Both can't have a value
                if(upload !== "" && local !== "") {
                    valid = false;
                    message += "<br/>- You must either specify a file local to the server, or choose a file " +
                        "to upload. Not both.";
                }

                // Must be a valid filename path, and have extension zip, tif, or tiff
                var fileRegex = RegExp(/[^\\/]+\.[zip|tif|tiff]+$/i);
                if(upload !== "" && !fileRegex.test(upload)) {
                    valid = false;
                    message += "<br/>- Uploaded file must have one of the following extensions: tif, tiff, zip";
                }

                if(!valid) {
                    Ext.Msg.show({
                        title: Core.Translate.i18nJSON('File Import'),
                        message: message, //Core.Translate.i18nJSON('Files uploaded successfully.'),
                        buttons: Ext.Msg.OK
                    });
                }

			    return valid;
			},
			
			submitForm: function(b, e){

				var form = this.getView().getFormPanel().getForm();

				var isMosaic = form.findField('mosaic').checked;
				var includeMosaic = "";
				if(isMosaic) {
				    includeMosaic = "?isMosaic=true";
				}

				var url = Ext.String.format("{0}/datalayer/{1}/geotiff{2}",
						Core.Config.getProperty(UserProfile.REST_ENDPOINT),
						UserProfile.getWorkspaceId(), includeMosaic);

				var params = {};

				var folderCombo = this.getView().lookupReference('folderCombo');
				if(folderCombo && !Ext.isEmpty(folderCombo.getValue())){
					params.folderId = folderCombo.getValue();
				}

				if(!this.validateFiles(form)) {
				    return;
				}

				form.submit({
					url: url,
					waitMsg: Core.Translate.i18nJSON('Uploading files...'),
					scope: this,
					params: params,
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
