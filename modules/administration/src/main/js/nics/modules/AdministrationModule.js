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
define(["iweb/CoreModule", "./administration/AdminView",
		"./administration/RoomManagementView", "nics/modules/UserProfileModule", 
		"./administration/ArchivedIncidentLookup", "./administration/OrganizationCapabilitiesView" ],
	
	function(Core, AdminView, RoomManagementView, UserProfile, 
				ArchivedIncidentLookup, OrganizationCapabilitiesView) {
	
		var AdminModule = function(){};
		
		var view;
		AdminModule.prototype.load = function(){
			new AdminView();//Create Tool Dropdown
			
			view = new RoomManagementView();
			//Add Item to Tools Menu
			Core.Ext.ToolsMenu.add({
				text: Core.Translate.i18nJSON('Room Management'),
				menu: {
					items:[
					//Remove for now - people with read-only permissions were able to copy
					/*{
						text: Core.Translate.i18nJSON("Copy drawings from 'Workspace' to current collaboration room"),
						handler: this.copyWorkspaceFeatures,
						scope: this
					},*/ {
						text: Core.Translate.i18nJSON('Modify Room Permissions'),
						handler: function(){
							view.controller.load();
						}
					},{
						text: Core.Translate.i18nJSON('Change Room Name'),
						handler: function() {
							if (Ext.isEmpty(view.controller.collabRoomName)) {
								Ext.MessageBox.alert("Status",
									Core.Translate.i18nJSON("Please join a collaboration room"));
							} else {
								Ext.MessageBox.prompt("Room Management", "Please enter new room name:",
									function (response, name) {
										if (response != 'cancel') {
											var url = Ext.String.format('{0}/collabroom/{1}/collabroomname',
												Core.Config.getProperty(UserProfile.REST_ENDPOINT),
												view.controller.incidentId);

											var topic = "nics.collabroom.name.update" + Core.Util.generateUUID();
											Core.EventManager.createCallbackHandler(topic, this, function (evt, response) {
												if (response.message != 'OK') {
													Ext.MessageBox.alert("Status",
														Core.Translate.i18nJSON(response.message));
												} else {
													Ext.MessageBox.alert("Status",
														Core.Translate.i18nJSON("The collaboration room was successfully updated."))
												}
											});

											//post to API
											mediator.sendPostMessage(url, topic,
												{
													name: name,
													collabRoomId: view.controller.collabRoomId,
													incidentid: view.controller.incidentId
												});
										}
									}, {mediator: mediator, view: view}, false, view.controller.collabRoomName);
							}
						}
					}]
				}
			});
			
			var lookupArchive = new ArchivedIncidentLookup();
			//Add Item to Tools Menu
			Core.Ext.ToolsMenu.add({
					text: Core.Translate.i18nJSON('Search Incidents'),
					handler: function(){
						lookupArchive.show();
					}
				}
			);
			
		};
		
		AdminModule.prototype.copyWorkspaceFeatures = function(){
			var restEndpoint = Core.Config.getProperty(UserProfile.REST_ENDPOINT),
					collabRoomId = view.controller.collabRoomId,
					userId = UserProfile.getUserId(),
					topic = "nics.collabroom.feature.copy." + userId;
			
			if (collabRoomId == "myMap") {
				Ext.MessageBox.alert(Core.Translate.i18nJSON("Warning"),
						Core.Translate.i18nJSON("There is no current collab room. Please choose one from the list or join a new room."));
				return;
			}
			
			var	url = Ext.String.format('{0}/features/user/{1}/copy?collabRoomId={2}',
							restEndpoint, userId, collabRoomId);
							
			Core.EventManager.createCallbackHandler(topic, this, function(evt, response){
				if (!response || response.message !== "OK") {
					Ext.MessageBox.alert(Core.Translate.i18nJSON("No Workspace Features Copied"),
							Core.Translate.i18nJSON("Unexpected error attempting to copy features"));
				} else if (response.count) {
					Ext.MessageBox.alert(Core.Translate.i18nJSON("Workspace Features Copied"),
							Ext.String.format("{0} {1}", response.count, Core.Translate.i18nJSON('features were copied to the current workspace')));
				} else {
					Ext.MessageBox.alert(Core.Translate.i18nJSON("No Workspace Features Copied"),
							Core.Translate.i18nJSON("No workspace features were found to copy"));
				}
			});
			
			Core.Mediator.getInstance().sendPostMessage( url, topic, {});
		};
		
		return new AdminModule();
	}
);
	
