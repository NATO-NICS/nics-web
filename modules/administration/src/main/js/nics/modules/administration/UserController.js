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
define(['ext', 'iweb/CoreModule','nics/modules/UserProfileModule', 'nics/modules/AccountInfoModule'],
         function(Ext, Core, UserProfile, AccountInfoModule){
	
	return Ext.define('modules.administration.UserController', {
		extend : 'Ext.app.ViewController',

		alias: 'controller.usercontroller',

		currentNewUserTopic: null,

		init: function(){
			this.showUserProfileTopic = "nics.user.profile.show";
			
			this.mediator = Core.Mediator.getInstance();

			Core.EventManager.addListener("nics.admin.org.clear", this.clearGrids.bind(this));
			Core.EventManager.addListener("nics.admin.org.users.load", this.loadUsers.bind(this));
			Core.EventManager.addListener(this.showUserProfileTopic, this.showUserProfile.bind(this));
			Core.EventManager.addListener("nics.user.profile.loaded", this.loadUserProfile.bind(this));
			
			this.getView().getFirstGrid().getView().on('drop', this.enableUsers, this);
			this.getView().getSecondGrid().getView().on('drop', this.disableUsers, this);
		},
		
		clearGrids: function(){
			this.getView().clearGrids();
		},
		
		loadWorkspaces: function(){
			var topic = Core.Util.generateUUID();
			Core.EventManager.createCallbackHandler(topic, this, 
					function(evt, response){
						if(response.workspaces){
							var data = [];
							for(var i=0; i<response.workspaces.length;i++){
								data.push(response.workspaces[i]);
							}
							this.getView().getWorkspaceDropdown().getStore().loadData(data);
						}
						this.getView().setWorkspaceDropdown(
								UserProfile.getWorkspaceId());
					}
			);
			
			var url = Ext.String.format('{0}/workspace/system/{1}',
					Core.Config.getProperty(UserProfile.REST_ENDPOINT),
					location.hostname);
			this.mediator.sendRequestMessage(url, topic);
		},
		
		onUserClick: function(grid, record, tr, rowIndex, e, eOpts ){
			var url = Ext.String.format(
					"{0}/users/{1}/username/{2}/userOrgId/{3}/orgId/{4}?requestingUserOrgId={5}",
					Core.Config.getProperty(UserProfile.REST_ENDPOINT),
					UserProfile.getWorkspaceId(),
					record.data.username,
					record.data.userorgid,
					this.currentOrgId,
					UserProfile.getUserOrgId());
				
			Core.Mediator.getInstance().sendRequestMessage(url, this.showUserProfileTopic);
		},

		onDeleteUsers: function()
		{
			var grid = this.getView().getFirstGrid();
			var selection = grid.getSelectionModel().getSelection();

			for (var i = 0; i < selection.length; i++)
			{
				var topic = Core.Util.generateUUID();
				var userorgworkspaceid = selection[i].data.userorg_workspace_id;
				var userid = selection[i].data.userid;

				Ext.String.format('{0}/users/{1}/setActive/{2}/userid/{3}?active={4}',
					Core.Config.getProperty(UserProfile.REST_ENDPOINT),
					UserProfile.getWorkspaceId(), userorgworkspaceid, userid, false);

				this.mediator.sendPostMessage(url, topic, {});
			}
		},

		onUserRegister: function(evt, user){
            // Assuming disabled since they JUST registered. To be thorough, this controller should also
            // listen to enable/disable user topics to move users around accordingly
            this.addUser(this.getView().getSecondGrid(), 'disabled', user);
		},

        /**
           Adds a single user to the specified store. Used for adding users that come in over
           a live event to a store

           @param grid the grid associated with the specified type
           @param type the state of the user, 'enabled' or 'disabled'
           @param user the payload, a subset of user and userorg related fields
                    keys: {username, userid, userorgid, orgid, userorg_workspace_id}
        */
		addUser: function(grid, type, user){
		    if(!grid || !type || !user) {
		        return;
		    }

            var userOrgId = user.orgid;

		    // Assuming orgId on user, or could break it out into the topic
		    // If the user's orgId is the active org, then add it, otherwise ignore
		    if(this.currentOrgId && userOrgId && this.currentOrgId === userOrgId) {
                var data = [user];
                grid.getStore().loadData(data, /* append */ true);
		    } else {
		        // if an org isn't selected, then we don't really care, because
		        // once they select one, they do a new user load for that org anyway
		    }
		},

		updateNewUserSub: function(orgId) {
		    // If undefined or 0, don't want to process
		    if(!orgId) {
		        return;
		    }

            // If the currentNewUserTopic has been previously set, unsubscribe
		    if(this.currentNewUserTopic !== null) {
		        this.mediator.unsubscribe(this.currentNewUserTopic);
		        Core.EventManager.removeListener(this.currentNewUserTopic, this.onUserRegister);
		    }

		    // Listen/Subscribe for new user registrations for this org
            var newUserRegTopic = Ext.String.format("iweb.NICS.{0}.admin.org.{1}.users.new",
                UserProfile.getWorkspaceId(), orgId);

            this.currentNewUserTopic = newUserRegTopic;
            this.mediator.subscribe(this.currentNewUserTopic);
            Core.EventManager.addListener(this.currentNewUserTopic, this.onUserRegister.bind(this));
		},

		loadUsers: function(evt, orgId){
			this.currentOrgId = orgId;
			this.getView().clearGrids();
			
			this.loadUserData(this.getView().getFirstGrid(), 'enabled', orgId);
			this.loadUserData(this.getView().getSecondGrid(), 'disabled', orgId);

			this.updateNewUserSub(orgId);
		},
		
		loadUserData: function(grid, type, orgId){
			var topic = Core.Util.generateUUID();
			
			//populate the user grids
			Core.EventManager.createCallbackHandler(topic, this, 
					function(evt, response){
						if(response.data){
							var data = [];
							for(var i=0; i<response.data.length;i++){
								data.push(response.data[i]);
							}
							grid.getStore().loadData(data);
						}
					}
			);
			
			var url = Ext.String.format('{0}/users/{1}/{2}/{3}', 
					Core.Config.getProperty(UserProfile.REST_ENDPOINT), 
					UserProfile.getWorkspaceId(), type, orgId);
			
			this.mediator.sendRequestMessage(url, topic);
		},
		
		setWorkspaceId: function(combo, record, eOpts){
			this.workspaceId = record.data.workspaceid;
			this.loadUsers();
		},
		
		enableUsers: function(node, data, dropRec, dropPosition){
			this.setUserEnabled(node, data, dropRec, dropPosition, "enable");
		},
		
		disableUsers: function(node, data, dropRec, dropPosition){
			this.setUserEnabled(node, data, dropRec, dropPosition, "disable");
		},
		
		setUserEnabled: function(node, data, dropRec, dropPosition, type){
			for(var i=0;i<data.records.length;i++){
				var record = data.records[i];
				
				var topic = Core.Util.generateUUID();
				
				var userorgworkspaceid = record.data.userorg_workspace_id;
				var userid = record.data.userid;
				
				var _this = this;
				///populate the user grids
				Core.EventManager.createCallbackHandler(topic, this, 
						function(username, evt, response){
							if(!response.users || response.users.length != 1){ //we are enabling one at a time atm..
								Ext.MessageBox.alert(Core.Translate.i18nJSON("Status"), Core.Translate.i18nJSON("There was an issue enabling the user."));
							}
						},
						[record.data.username]
				);
				
				var enabled = (type == "enable" ? "true" : "false");
				var url = Ext.String.format('{0}/users/{1}/enable/{2}/userid/{3}?enabled={4}', 
						Core.Config.getProperty(UserProfile.REST_ENDPOINT),
						UserProfile.getWorkspaceId(), userorgworkspaceid, userid,  enabled);
				
				this.mediator.sendPostMessage(url, topic, {});
			}
		},
		
		showUserProfile: function(evt, userProfile){
			AccountInfoModule.showViewer(userProfile);
		},

		loadUserProfile: function(evt, profile)
		{
			var view = this.getView(),
					deleteButton = view.lookupReference('deleteUsersButton');
			if (profile.isSuperUser && !deleteButton)
			{
				view.add({
					xtype: 'button',
					text:  Core.Translate.i18nJSON('Delete selected users'),
					reference: 'deleteUsersButton',
					handler: 'onDeleteUsers'
				});
			}
		}
	});
});
