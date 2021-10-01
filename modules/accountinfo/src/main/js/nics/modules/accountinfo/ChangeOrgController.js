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
         "iweb/CoreModule", "nics/modules/UserProfileModule", "./ChangeOrgModel"], 
	function(Core, UserProfile, ChangeOrgModel){
		Ext.define('modules.accountinfo.ChangeOrgController', {
			extend : 'Ext.app.ViewController',
			
			alias: 'controller.changeorgcontroller',
			
			 init: function() {
				this.mediator = Core.Mediator.getInstance();
				this.model = new ChangeOrgModel();
			    this.bindEvents();
			    
			    
			},
			
			bindEvents: function(){
				Core.EventManager.addListener('nics.userorg.loads', this.loadUserOrgs.bind(this));
				Core.EventManager.addListener('nics.changeorgs.load', this.loadUserOrgs.bind(this));
				Core.EventManager.addListener("nics.user.profile.loaded", this.onProfileLoaded.bind(this));
				
			},

			load: function(){
				this.mediator.sendRequestMessage(this.url, 'nics.changeorgs.load');
			},
			onProfileLoaded: function(){
				var url = Ext.String.format("{0}/users/{1}/userOrgs?userName={2}",
						Core.Config.getProperty(UserProfile.REST_ENDPOINT), UserProfile.getWorkspaceId(), UserProfile.getUsername());
				
				this.mediator.sendRequestMessage(url, "nics.userorg.loads");

				var userorgUpdateTopic = Ext.String.format("iweb.NICS.{0}.user.{1}.userorgupdate",
					UserProfile.getWorkspaceId(),
					UserProfile.getUserId());
				Core.EventManager.addListener(userorgUpdateTopic, this.onUserorgsUpdated.bind(this));
				this.mediator.subscribe(userorgUpdateTopic);

			},

			loadUserOrgs: function(e, info){
				this.userId = info.userId;
				var userOrgs = info.userOrgs;
				if (userOrgs.length === 0) {
					this.showEmptyErrorMsg();
				}
				this.showOrgsDropdown(userOrgs);
			},

			onUserorgsUpdated: function(e, payload) {
				// Got notification of getting enabled in an org, so requery userorgs

				var url = Ext.String.format("{0}/users/{1}/userOrgs?userName={2}",
					Core.Config.getProperty(UserProfile.REST_ENDPOINT),
					UserProfile.getWorkspaceId(), UserProfile.getUsername());

				this.mediator.sendRequestMessage(url, "nics.userorg.loads");

			},

			onOkButtonClick: function(button) {
				//Functionality for changing organizations has been removed
				//var dropdown = this.getView().lookupReference('changeOrgDropdown');
			},
			
			showOrgsDropdown: function(userOrgs) {
				var dropdown = this.getView().lookupReference('changeOrgDropdown');
				
				var store = dropdown.getStore();
				store.loadData(userOrgs);
				var currentOrg = UserProfile.getUserOrgId();
				if (currentOrg) {
					dropdown.select(currentOrg);
				} else {
					dropdown.select(store.getAt(0));
				}
				
			},
			
			showEmptyErrorMsg: function() {
				var view = this.getView();
				view.show();
				view.mask(view.NoOrgsError);
			},
			
			setUserSessionId: function(userOrg, event, response){
				//Should probably send "onReady" event here for other modules...
				if(response && response.userSession){
					userOrg.usersessionId = response.userSession.usersessionid;
					userOrg.currentUsersessionId = response.userSession.currentusersessionid;
					userOrg.userId = response.userSession.userid;
					

				}else{
					this.logout();
				}
				//log out otherwise...no session id!
				
				var _mediator = this.mediator;
				var _userProfile = UserProfile;
				var config = Core.Config;
				Core.EventManager.fireEvent("nics.userorg.change", userOrg);
			},
			
			showChangeOrg: function(profile){
				if(profile === "Forbidden"){
					Ext.MessageBox.alert(Core.Translate.i18nJSON("Permissions Error"),
						Core.Translate.i18nJSON("You do not have permission to view this profile"));
					return;
				}
				
				
			},
			
		
		
		});
});
