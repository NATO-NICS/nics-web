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
define(['ext', 'iweb/CoreModule', 'nics/modules/UserProfileModule'],
	function(Ext, Core, UserProfile){
		return Ext.define('modules.incident.IncidentOrgController', {

			extend : 'Ext.app.ViewController',

			alias: 'controller.incidentorgcontroller',

			orgTopic: 'nics.inc.orgs',

			incOrgTopic: 'nics.inc.org.update',

			internalTopic: 'nics.inc.org.internal',

			onCreate: true,

			init: function(ext){

				this.mediator = Core.Mediator.getInstance();

				Core.EventManager.addListener(this.internalTopic, this.onLoadOrgs.bind(this));

				this.loadOrgs();

				this.getView().getEnabledOrgsGrid().getView().on('drop', this.enableOrgs, this);
				this.getView().getDisabledOrgsGrid().getView().on('drop', this.disableOrgs, this);
			},
			
			setIncidentId: function(incidentId){
				this.incidentId = incidentId;
			},

			setUserId: function(userId){
				this.userId = userId;
			},

			setOnCreate: function(value){
				this.onCreate = value;
			},

			onCancelIncOrg: function(){

				this.getView().hide();
				//this.lookupReference('incOrgGrid').setSelection(null);

			},

			loadOrgs: function(){

				//if(UserProfile.isSuperUser()){
					var url = Ext.String.format('{0}/orgs/{1}/all', 
							Core.Config.getProperty(UserProfile.REST_ENDPOINT), 
							UserProfile.getWorkspaceId());
					
				//}else{
				//	var url = Ext.String.format('{0}/orgs/{1}/admin?userId={2}', 
				//			Core.Config.getProperty(UserProfile.REST_ENDPOINT), 
				//			UserProfile.getWorkspaceId(), UserProfile.getUserId());
				//}

				this.mediator.sendRequestMessage(url, this.internalTopic);
		
			},

			onLoadOrgs: function(evt, response){

				if(response && response.organizations){

					if (!this.incidentId && this.onCreate) {
						this.getView().getDisabledOrgsGrid().store.loadRawData(response.organizations);
						this.getView().getEnabledOrgsGrid().store.removeAll();
					} else {

						var url = Ext.String.format('{0}/incidents/{1}/orgs/{2}',
								Core.Config.getProperty(UserProfile.REST_ENDPOINT),
								UserProfile.getWorkspaceId(),
								this.incidentId);

						var _this = this;
						Ext.Ajax.request({
							url: url,
							method: 'GET',

							success: function(response2) {
								var enabledOrgs = JSON.parse(response2.responseText).incidentOrgs;
								var enabledList = [];
								var disabledList = [];

								for (var i = 0; i < response.organizations.length; ++i) {
									var org = response.organizations[i];
									var found = false;
									for (var j = 0; j < enabledOrgs.length; ++j) {
										if (enabledOrgs[j].orgid === org.orgId) {
											enabledList.push(org);
											found = true;
											break;
										}
									}
									if (!found) {
										disabledList.push(org);
									}
								}
								_this.getView().getEnabledOrgsGrid().store.loadRawData(enabledList);
								_this.getView().getDisabledOrgsGrid().store.loadRawData(disabledList);
							},

							failure: function(fp, o) {
								console.log(fp, o);
							}
						});
					}

					//this.getView().getEnabledOrgsGrid().store.loadRawData(response.organizations);
					//this.lookupReference('incOrgGrid').store.loadRawData(response.organizations);

				}else{
					Ext.MessageBox.alert(Core.Translate.i18nJSON("Status"),
						Core.Translate.i18nJSON("There was an error grabbing the organizations."));
				}

			},

			enableOrgs: function(node, data, dropRec, dropPosition) {
				this.setOrgEnabled(node, data, dropRec, dropPosition, "enable");
			},

			disableOrgs: function(node, data, dropRec, dropPosition) {
				this.setOrgEnabled(node, data, dropRec, dropPosition, "disable");
			},

			setOrgEnabled: function(node, data, dropRec, dropPosition, type) {

				// Don't try to send a message to the server if we're
				// creating a new incident.
				if (this.onCreate)
					return;

				var record = data.records[i];

				var topic = Core.Util.generateUUID();

				var orgIds = Ext.Array.pluck(data.records, 'id');
				var incOrgs = [];
				for(i =0; i < orgIds.length; i++){
					incOrgs.push({orgid:orgIds[i], incidentid:this.incidentId, userid:this.userId});
				}

				var url;
				if (type == "enable") {
					url = Ext.String.format('{0}/incidents/{1}/orgs/{2}', 
							Core.Config.getProperty(UserProfile.REST_ENDPOINT),
							UserProfile.getWorkspaceId(),this.incidentId);
				} else {
					url = Ext.String.format('{0}/incidents/{1}/orgs/remove/{2}', 
							Core.Config.getProperty(UserProfile.REST_ENDPOINT),
							UserProfile.getWorkspaceId(),this.incidentId);
				}

				var _this = this;
				Ext.Ajax.request({
					url: url,
					method: 'POST',
					headers: {
						"X-Remote-User": UserProfile.getUsername()
					},
					jsonData: incOrgs,

					success: function(response) {
						//Ext.MessageBox.alert(Core.Translate.i18nJSON("Status"), Core.Translate.i18nJSON("Incident Organization was successfully updated."));
						// Pull the latest data from the API
						_this.loadOrgs();
					},

					failure: function(fp, o) {
						var msg = 'Unknown error. See console for details';
						try {
						    if(fp && fp.responseText) {
						        var json = JSON.parse(fp.responseText);
						        msg = json.message;
						    }
						} catch(e) {
						    console.error('Response text was invalid: ' + fp.responseText);
						}
						Ext.MessageBox.alert(Core.Translate.i18nJSON("Status"), Core.Translate.i18nJSON(msg));
						// Pull the latest data from the API
						_this.loadOrgs();
					}
				});

			},

			onUpdateIncOrg: function(btn, evt){

				if(!this.onCreate){

					var orgs = this.lookupReference('incOrgGrid').getSelectionModel().getSelection();

					if(orgs.length == 0){
						Ext.MessageBox.alert(Core.Translate.i18nJSON(""), 
							Core.Translate.i18nJSON("No organizations were selected."));
						return;
					}

					var orgIds = Ext.Array.pluck(orgs,'id');
					var incOrgs = [];

					for(i =0; i < orgIds.length; i++){
						incOrgs.push({orgid:orgIds[i], incidentid:this.incidentId, userid:this.userId});
					}

					var url;
					if (btn.text == "Assign") {
						url = Ext.String.format('{0}/incidents/{1}/orgs/{2}', 
								Core.Config.getProperty(UserProfile.REST_ENDPOINT),
								UserProfile.getWorkspaceId(),this.incidentId);
					} else {
						url = Ext.String.format('{0}/incidents/{1}/orgs/remove/{2}', 
								Core.Config.getProperty(UserProfile.REST_ENDPOINT),
								UserProfile.getWorkspaceId(),this.incidentId);
					}

					Ext.Ajax.request({
						url: url,
						method: 'POST',
						headers: {
							"X-Remote-User": UserProfile.getUsername()
						},
						jsonData: incOrgs,

						success: function(response) {
							//Ext.MessageBox.alert(Core.Translate.i18nJSON("Status"),
							// Core.Translate.i18nJSON("Incident Organization was successfully updated."));
						},

						failure: function(fp, o) {
							Ext.MessageBox.alert(Core.Translate.i18nJSON("Status"),
								Core.Translate.i18nJSON("There was an error updating the incident organizations."));
						}
					});

				}else if(btn.text == "Remove"){
					this.lookupReference('incOrgGrid').setSelection(null);
				}

				
				this.getView().hide();

			}
		});
	});
