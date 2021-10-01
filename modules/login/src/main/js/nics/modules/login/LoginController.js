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
define([
         "iweb/CoreModule", "./LoginModel",
         "nics/modules/UserProfileModule"], 
	function(Core, LoginModel, UserProfile){
	
		var LOGOUT = false;
	
		Ext.define('modules.login.LoginPresenter', {
			extend : 'Ext.app.ViewController',
			
			alias: 'controller.logincontroller',
			
			init: function() {
				this.mediator = Core.Mediator.getInstance();
				
				this.bindEvents();
				
				this.requestWorkspaces();
			},
			
			bindEvents: function(){
				Core.EventManager.addListener('nics.userorg.load', this.loadUserOrg.bind(this));
				Core.EventManager.addListener('nics.workspaces.load', this.loadWorkspaces.bind(this));
				Core.EventManager.addListener('onLogout', this.logout.bind(this));
				Core.EventManager.addListener('nics.userorg.change', this.updateTitle.bind(this));
			},
			
			logout: function(){
				LOGOUT = true;
				
				Core.EventManager.fireEvent('logout'); //Give everyone a chance to clean up
				
				//Remove the session from the database
				var _mediator = this.mediator;
				var endpoint = Core.Config.getProperty(UserProfile.REST_ENDPOINT);
				
				var topic = "nics.logout.usersession.callback";
				Core.EventManager.createCallbackHandler(topic, this, function(){
					_mediator.close();
					location.href = Ext.String.format(
							"https://{0}/sso/redirect_uri?logout=https://{0}", Core.Config.getProperty("nics.domain"));
				});
				
				if(UserProfile.getCurrentUserSessionId()){
					var url = Ext.String.format("{0}/users/{1}/removesession?userSessionId={2}",
							endpoint,
							UserProfile.getWorkspaceId(), 
							UserProfile.getUserSessionId());
					
					this.mediator.sendPostMessage(url,topic, {});
				}else{
					_mediator.close();
					location.href = Ext.String.format(
							"https://{0}/sso/redirect_uri?logout=https://{0}", Core.Config.getProperty("nics.domain"));
				}
				
			},
			
			//Remove session because the user logged in with another session
			logoutFromMessage: function(evt, sessionId){
				if(!LOGOUT && sessionId === UserProfile.getSessionId()){
					Core.EventManager.fireEvent('iweb.logger.log.debug', ["Received logout event message, so logging out"]);
					LOGOUT = true;
					
					Core.EventManager.fireEvent('logout'); //Give everyone a chance to clean up
					
					var _mediator = this.mediator;
					
					//remove from openam
					var topic = "nics.logout.usersession.callback";
					Core.EventManager.createCallbackHandler(topic, this, function(){
						_mediator.close();
						location.href = Ext.String.format(
								"https://{0}/sso/redirect_uri?logout=https://{0}", Core.Config.getProperty("nics.domain"));
					});

					var url = Ext.String.format("{0}/users/{1}/removesession?userSessionId={2}",
						Core.Config.getProperty(UserProfile.REST_ENDPOINT),
						UserProfile.getWorkspaceId(),
						UserProfile.getUserSessionId());
					this.mediator.sendDeleteMessage(url, topic);
				}
			},
			
			requestWorkspaces: function(){
				var endpoint = Core.Config.getProperty(UserProfile.REST_ENDPOINT);

				var url = Ext.String.format("{0}/workspace", endpoint, document.domain);
				
				this.mediator.sendRequestMessage(url, "nics.workspaces.load");
			},
			
			requestUserOrgs: function(){
				var endpoint = Core.Config.getProperty(UserProfile.REST_ENDPOINT);
				var url = Ext.String.format("{0}/users/{1}/userOrgs?userName={2}",
						endpoint, UserProfile.getWorkspaceId(), UserProfile.getUsername());
				
				this.mediator.sendRequestMessage(url, "nics.userorg.load");
			},
			
			loadWorkspaces: function(e, data){
				var workspaces = data.workspaces;
				if (workspaces.length === 0) {
					this.showEmptyErrorMsg();
				} else if (workspaces.length === 1) {
					this.setWorkspace(workspaces[0].workspaceid, workspaces[0].workspacename);
				} else {
					this.showWorkspaceDropdown(workspaces);
				}
			},
			
			loadUserOrg: function(e, info){
				this.userId = info.userId;
				var userOrgs = info.userOrgs;
				UserProfile.setUserOrgs(userOrgs);
				if (userOrgs.length === 0) {
					this.showEmptyErrorMsg();
				} else if (userOrgs.length === 1) {
					this.setUserOrg(userOrgs[0]);
				} else {
					this.showOrgsDropdown(userOrgs);
				}
			},
			
			showOrgsDropdown: function(userOrgs) {
			 	var label = this.lookupReference('userOrgLabel'); //translate
			 	label.setHidden(false);
			 	
				var dropdown = this.lookupReference('orgDropdown');
				dropdown.setHidden(false);
				var store = dropdown.getStore();
				store.loadData(userOrgs);
				
				//select the first default org, or the first record
				var defaultOrg = store.findRecord('defaultorg', true);
				if (defaultOrg) {
					dropdown.select(defaultOrg);
				} else {
					dropdown.select(store.getAt(0));
				}
				
				this.getView().show();
			},
			
			showWorkspaceDropdown: function(workspaces) {
			 	var dropdown = this.lookupReference('workspaceDropdown');
				var store = dropdown.getStore();
				store.loadData(workspaces);
				dropdown.select(store.getAt(0));
				this.getView().show();
			},

			updateTitle: function(evt, userOrg){
				if(this.titleBar.length &&
					this.titleBar.length === 2){
					var label = this.titleBar[1];
					if(label && label.setHtml){
						label.setHtml("<b>" +
							((Core.Config.getProperty("main.site.label") || '') ? Core.Config.getProperty("main.site.label") :
								"Next-Generation Incident Command System - " +
								UserProfile.getWorkspaceName() + " - " + userOrg.name) + "</b>");
					}
				}
			},
			
			setUserOrg: function(userOrg){
				//Add Title
				this.titleBar = Core.View.addToTitleBar([{xtype: 'tbspacer', width: 5},{xtype: "label", html: "<b>" +
						((Core.Config.getProperty("main.site.label") || '') ? Core.Config.getProperty("main.site.label") :
							"Next-Generation Incident Command System - " +
							UserProfile.getWorkspaceName() + " - " + userOrg.name) + "</b>"}]);

				//Create a new User Session
				var topic = "nics.login.usersession.callback";
				
				Core.EventManager.createCallbackHandler(topic, this, this.setUserSessionId, [userOrg]);
				
				var url = Ext.String.format("{0}/users/{1}/createsession?userId={2}&displayName={3}&userOrgId={4}&systemRoleId={5}&sessionId={6}",
						Core.Config.getProperty(UserProfile.REST_ENDPOINT),
						UserProfile.getWorkspaceId(), 
						this.userId, 
						UserProfile.getUsername(),
						userOrg.userorgid, 
						userOrg.systemroleid, 
						UserProfile.getSessionId());
				
				this.mediator.sendPostMessage(url,topic,{});
			},
			
			
			setWorkspace: function(workspaceId, workspaceName){
				var dropdown = this.lookupReference('workspaceDropdown');
				if(!workspaceId){
					try{
						var workspace = dropdown.findRecordByValue(dropdown.getValue()).getData();
						workspaceId = workspace.workspaceid;
						workspaceName = workspace.workspacename;
					}catch(e){
						Ext.MessageBox.alert("Error", "Could not set workspace id");
						this.logout();
					}
				}
				UserProfile.setWorkspaceId(workspaceId);
				UserProfile.setWorkspaceName(workspaceName);
				this.hideWorkspace(dropdown);
				this.requestUserOrgs();
			},
			
			hideWorkspace: function(dropdown){
				var label = this.lookupReference('workspaceLabel');
				dropdown.setHidden(true);
				label.setHidden(true);
			},
			
			showEmptyErrorMsg: function() {
				var view = this.getView();
				view.show();
				this.logout();
			},
			
			onOkButtonClick: function(button) {
				if(!this.lookupReference('workspaceDropdown').hidden){
					this.setWorkspace();
					this.getView().hide();
				}else{
					var dropdown = this.lookupReference('orgDropdown');
					var value = dropdown.getValue();
					var userOrg = dropdown.findRecordByValue(value);
					
					if (userOrg) {
						this.setUserOrg(userOrg.getData());
					}
					this.getView().close();
				}
			},
			
			setUserSessionId: function(userOrg, event, response){
				//Should probably send "onReady" event here for other modules...
				if(response && response.userSession){
					userOrg.usersessionId = response.userSession.usersessionid;
					userOrg.currentUsersessionId = response.userSession.currentusersessionid;
					userOrg.userId = response.userSession.userid;
					
					//Listening for an existing session to logout from
					var logoutListener = Ext.String.format("iweb.NICS.{0}.logout", UserProfile.getSessionId());
					this.mediator.subscribe(logoutListener);
					
					//NOTE: Tries to remove the current usersession but it has already been removed in the endpoint
					Core.EventManager.addListener(logoutListener, this.logoutFromMessage.bind(this));
				}else{
					this.logout();
				}
				//log out otherwise...no session id!
				
				var _mediator = this.mediator;
				var _userProfile = UserProfile;
				var config = Core.Config;
				
				var onUnload = function(){
					if(!LOGOUT){
						var url = Ext.String.format("{0}/users/{1}/removesession?userSessionId={2}",
								config.getProperty(UserProfile.REST_ENDPOINT),
								_userProfile.getWorkspaceId(), 
								_userProfile.getUserSessionId());
						_mediator.sendPostMessage(url,"",{});
						//NOTE: Token is not getting removed
					}
				};

				window.addEventListener("beforeunload", onUnload);
				
				Core.EventManager.fireEvent("nics.userorg.change", userOrg);
			}
		});
});
