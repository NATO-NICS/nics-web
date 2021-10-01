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
define(['ext', 'ol', 'iweb/CoreModule', 'nics/modules/UserProfileModule', 
        "iweb/modules/geocode/AbstractController",
        "iweb/modules/MapModule", "iweb/modules/drawmenu/Interactions",
        "./UserLookupView"],
         function(Ext, ol, Core, UserProfile, 
        		 AbstractController, MapModule, 
        		 Interactions, UserLookupView){
	
	return Ext.define('modules.administration.OrganizationFormController', {
		extend : 'modules.geocode.AbstractController',

		alias: 'controller.orgformcontroller',

		init: function(){
			this.mediator = Core.Mediator.getInstance();
			
			Core.EventManager.addListener('nics.admin.close', this.removeLayer.bind(this));
			
			var source = new ol.source.Vector();
			this.vectorLayer = new ol.layer.Vector({
              source: source
            });
            
            this.translationCallback = this.setLanguages.bind(this);
            this.onLoadOrgsCallback = this.onLoadOrgs.bind(this);
            this.onLoadCountriesCallback = this.onLoadCountries.bind(this);
			Core.EventManager.addListener('iweb.translations.loaded', this.translationCallback);
			Core.EventManager.addListener('nics.admin.orgs', this.onLoadOrgsCallback);
			Core.EventManager.addListener('nics.countries.load', this.onLoadCountriesCallback);
			
			//Set up localization of alert boxes
			Ext.MessageBox.buttonText.ok = Core.Translate.i18nJSON("OK");
			Ext.MessageBox.buttonText.yes = Core.Translate.i18nJSON("Yes");
			Ext.MessageBox.buttonText.no = Core.Translate.i18nJSON("No");
			Ext.MessageBox.buttonText.cancel = Core.Translate.i18nJSON("Cancel");

            Core.Ext.Map.addLayer(this.vectorLayer);
            this.vectorLayer.setVisible(true); 
            
            this.lookupWindow = new UserLookupView({
            	callback: { fnc: this.addUserOrgs, scope: this}
            });
            
            this.setLanguages();
            
            this.getOrgTypes();
		},

		onLoadCountries: function(evt, countries){
			this.lookupReference('country').getStore().loadRawData(countries);
		},

		onLoadOrgs: function(evt, data){
			this.parentOrgDropdown = this.lookupReference('parentorganization');
			this.parentOrgDropdown.store.loadRawData(data.organizations);
		},
		
		setLanguages: function(){
	    	var vm = this.lookupReference('orgForm').getViewModel();
	    	//var defaultLanguage = vm.get('defaultlanguage');
	    	
			this.userLanguageComboBox = this.lookupReference('languageList');
			
			var store = this.userLanguageComboBox.getStore();
			
			store.loadRawData(Core.Translate.getSystemLanguages());
			
			//this.userLanguageComboBox.setValue(defaultLanguage);
			
			Core.EventManager.removeListener("iweb.translations.loaded", this.translationCallback);
		},
		
		getOrgTypes: function(){
			var topic = "nics.admin.orgtypes";
			Core.EventManager.createCallbackHandler(topic, this, function(evt,response){
				var orgTypes = response.orgTypes;
				var orgTypeForm = this.lookupReference('orgTypeForm');
				if(orgTypes){
					for(var i=0; i<orgTypes.length; i++){
						var type = orgTypes[i]; 
						orgTypeForm.add({
		                    boxLabel  : Core.Translate.i18nJSON(type.orgTypeName),
		                    inputValue: type.orgTypeId,
		                    reference: 'orgtype-' + type.orgTypeId
		                });
					}
				}
			});
			
			var url = Ext.String.format('{0}/orgs/{1}/types', 
					Core.Config.getProperty(UserProfile.REST_ENDPOINT),
					UserProfile.getWorkspaceId());
			
			this.mediator.sendRequestMessage(url, topic);
		},

		getOrganizationName: function(orgId){
			var topic = "nics.org.name";
			Core.EventManager.createCallbackHandler(topic, this, function(evt,response){
				var label = this.lookupReference("parentName");
				label.setVisible(true);
				label.setValue(response.message);
			});

			var url = Ext.String.format('{0}/orgs/{1}/org/name/{2}',
				Core.Config.getProperty(UserProfile.REST_ENDPOINT),
				UserProfile.getWorkspaceId(), orgId);

			this.mediator.sendRequestMessage(url, topic);

		},
		
		getSelectedOrgTypes: function(){
			//Collection of original orgtypes
			var orgTypes = this.lookupReference('orgForm').getViewModel().get('orgTypes');
			//Array of orgtypes found in both the new and original collection
			var validated = new Array();
			
			var addedTypes = [];
			var removedTypes = [];
			
			//Loop thru edited checkboxes
			var items = this.lookupReference('orgTypeForm').getRefItems();
			for(var i=0; i<items.length; i++){
				if(items[i].checked){
					var found = false;
					if(orgTypes){
						for(var j=0; j<orgTypes.length; j++){
							if(orgTypes[j].orgtypeid == items[i].inputValue){
								validated.push(orgTypes[j].orgtypeid);
								found = true;
								break;
							}
						}
					}
					if(!found){
						addedTypes.push(items[i].inputValue);
					}
				}
			}
			
			//Find Removed Checkboxes
			if(orgTypes){
				for(var j=0; j<orgTypes.length; j++){
					var type = orgTypes[j];
					if(validated.indexOf(type.orgtypeid) == -1){
						removedTypes.push(type.orgtypeid);
					}
				}
			}
			
			return { added: addedTypes, removed: removedTypes };
		},

		noOrgtypeSelected: function() {

			var items = this.lookupReference('orgTypeForm').getRefItems();
			var noneSelected = true;
			for(var i = 0; i < items.length; i++) {
				if(items[i].checked === true) {
					noneSelected = false;
					break;
				}
			}

			return noneSelected;
		},
		
		submitForm : function() {
			var vm = this.lookupReference('orgForm').getViewModel();

			if(this.noOrgtypeSelected()) {
				Ext.MessageBox.alert(Core.Translate.i18nJSON("Organization"),
					Core.Translate.i18nJSON("You must select at least one Organization Type."));
				return;
			}

			var updatedOrgTypes = this.getSelectedOrgTypes();

			var org = {
				name: vm.get("name"),
				county: vm.get("county"),
				state: vm.get("state"),
				prefix: vm.get("prefix"),
				distribution: vm.get("distribution"),
				defaultlatitude: vm.get("defaultlatitude"),
				defaultlongitude: vm.get("defaultlongitude"),
				countryId: vm.get("countryId"),
				defaultlanguage: vm.get("defaultlanguage"),

				restrictincidents: this.lookupReference('restrictincidents').checked,
				createincidentrequiresadmin: this.lookupReference('createincidentrequiresadmin').checked,
				parentorgid: vm.get("parentorgid")

			};
			
			if(!Ext.isEmpty(vm.get('orgId'))){
				org.orgId = vm.get("orgId");
			}

			var isUpdate = false;
			if(org.orgId !== null && org.orgId && org.orgId > 0) {
				isUpdate = true;
			}
			
			var topic = "nics.org.new";
			Core.EventManager.createCallbackHandler(topic, this, 
					function(updatedOrgTypes, evt, response){
						if(response.message != "OK"){
							if(isUpdate) {
								Ext.MessageBox.alert(Core.Translate.i18nJSON("Status"),
									Core.Translate.i18nJSON("There was an error updating the organization."));
							} else {
								Ext.MessageBox.alert(Core.Translate.i18nJSON("Status"),
									Core.Translate.i18nJSON("There was an error creating the organization."));
							}

						}else{
							if(isUpdate) {
								Ext.MessageBox.alert(Core.Translate.i18nJSON("Status"),
									Core.Translate.i18nJSON("Organization was successfully updated."));
							} else {
								Ext.MessageBox.alert(Core.Translate.i18nJSON("Status"),
									Core.Translate.i18nJSON("Organization was successfully created."));
							}

							Core.EventManager.fireEvent("nics.admin.org.new", response.organizations);
							this.updateOrgTypes(updatedOrgTypes, response.organizations[0].orgId);

							// Update restrict org setting on UseProfile if it's the org the user is signed in as
							if(response.organizations[0].orgId === UserProfile.getOrgId()) {
								UserProfile.setRestrictIncidents(response.organizations[0].restrictincidents);
							}

							// createincidentrequiresadmin
							if(response.organizations[0].orgId === UserProfile.getOrgId()) {
								UserProfile.setCreateIncidentRequiresAdmin(response.organizations[0].createincidentrequiresadmin);
							}
						}
					},
					[updatedOrgTypes]
			);
			
			var url = Ext.String.format('{0}/orgs/{1}', 
					Core.Config.getProperty(UserProfile.REST_ENDPOINT),
					UserProfile.getWorkspaceId());
			
			this.mediator.sendPostMessage(url, topic, org);
		},
		
		updateOrgTypes: function(updatedOrgTypes, orgId){
			//Add New Org Types
			if(updatedOrgTypes.added.length > 0){
				var topic = "nics.org.orgtype.new";
				for(var i=0; i<updatedOrgTypes.added.length; i++){
					var url = Ext.String.format('{0}/orgs/{1}/orgtype/add/{2}/{3}', 
							Core.Config.getProperty(UserProfile.REST_ENDPOINT),
							UserProfile.getWorkspaceId(),
							orgId,
							updatedOrgTypes.added[i]);
					
					this.mediator.sendPostMessage(url, topic);
				}
			}
			//Remove Old Org Types
			if(updatedOrgTypes.removed.length > 0){
				var topic = "nics.org.orgtype.remove";
				for(var i=0; i<updatedOrgTypes.removed.length; i++){
					var url = Ext.String.format('{0}/orgs/{1}/orgtype/remove/{2}/{3}', 
							Core.Config.getProperty(UserProfile.REST_ENDPOINT),
							UserProfile.getWorkspaceId(),
							orgId,
							updatedOrgTypes.removed[i]);
					
					this.mediator.sendPostMessage(url, topic);
				}
			}
		},
		
		cancelForm: function() {
			this.lookupReference('orgForm').getForm().reset();
			// Clear checkbox group of orgtypes
			this.lookupReference('orgTypeForm').setValue(false);
			try {
				// TODO: bad workaround, should be a way to reset/clear the model data
				this.lookupReference('orgForm').getViewModel().data.orgTypes = [];
			} catch(e) {
				console.error("Got exception trying to clear org types in form model", e.message, e);
			}

			// Default to restrict incidents
			this.lookupReference('restrictincidents').setValue(true);

			// Default to not require admin
			this.lookupReference('createincidentrequiresadmin').setValue(false);
		},
		
		clearForms: function() {
			this.lookupReference('orgForm').getForm().reset();
			// Clear checkbox group of orgtypes
			this.lookupReference('orgTypeForm').setValue(false);
			Core.EventManager.fireEvent("nics.admin.org.clear");
			// TODO: bad workaround, should be a way to reset/clear the model data
			//	this data comes from a checkbox group of checkboxes, which is NOT bound
			//	to a property in the model like all the other fields, so appears to
			//	require custom handling to clear
			try {
				this.lookupReference('orgForm').getViewModel().data.orgTypes = [];
			} catch(e) {
				console.error("Got exception trying to clear org types in form model", e.message, e);
			}

			// Default to restrict incidents
			this.lookupReference('restrictincidents').setValue(true);

			// Default to not require admin
			this.lookupReference('createincidentrequiresadmin').setValue(false);
		},
		
		onLocateCallback: function(feature) {
			feature.setProperties({
				type: Core.Translate.i18nJSON('Geocoded Location')
			});
			
			var view = MapModule.getMap().getView();
			var clone = feature.getGeometry().clone()
				.transform(view.getProjection(), ol.proj.get('EPSG:4326'));
			var coord = clone.getCoordinates();
			this.lookupReference('orgForm').getViewModel().set("defaultlatitude", coord[1]);
			this.lookupReference('orgForm').getViewModel().set("defaultlongitude", coord[0]);
			
			//turn off our drawing interaction
			var controller = MapModule.getMapController();
			controller.setInteractions(controller.getDefaultInteractions());
		},
		
		 onInteractionChange: function(){
	    	var button = this.lookupReference('locateButton');
	    	if(button.pressed){
	    		button.toggle();
	    	}
	    	this.prevInteractions = Core.Ext.Map.interactions;
	    },
	    
	    onAddUsers: function(){
	    	var vm = this.lookupReference('orgForm').getViewModel();
	    	if(!Ext.isEmpty(vm.get('orgId'))){
	    		this.lookupWindow.controller.clearGrid();
	    		this.lookupWindow.show();
	    	}
	    },
	    
	    addUserOrgs: function(selected){
	    	var vm = this.lookupReference('orgForm').getViewModel();
	    	var orgId = vm.get('orgId');
			if(orgId != -1){
				var userIds = [];
				for(var i=0; i<selected.length; i++){
					userIds.push(selected[i].data.userId);
				}
				
				var topic = Core.Util.generateUUID();
				Core.EventManager.createCallbackHandler(topic, this, 
						function(orgId, evt, response){
							if(response.failedUsers.length > 0){
								Ext.MessageBox.alert(Core.Translate.i18nJSON("Status"),  Ext.String.format("{0} {1} {2}",  response.failedUsers.length,
										 Core.Translate.i18nJSON("users were not successfully added to the organization."),
										 Core.Translate.i18nJSON("Please confirm that they are not already members.") ));
							}
							if(response.users.length > 0){
								Core.EventManager.fireEvent("nics.admin.org.users.load", orgId);
							}
						}, [orgId]
				);
				
				var url = Ext.String.format('{0}/users/{1}/userorg?orgId={2}', 
						Core.Config.getProperty(UserProfile.REST_ENDPOINT), 
						UserProfile.getWorkspaceId(), orgId);
				
				this.mediator.sendPostMessage(url, topic, userIds);
			}
		},
	    
	    updateView: function(){
	    	//reset the checkboxes
	    	var checkboxes = this.view.query("checkbox");
	    	for(var j=0; j<checkboxes.length; j++){
	    		// Don't reset the restrictincidents checkbox
				if(checkboxes[j].hasOwnProperty('reference') && checkboxes[j].reference === 'restrictincidents') {
					continue;
				}

				if(checkboxes[j].hasOwnProperty('reference') && checkboxes[j].reference === 'createincidentrequiresadmin') {
					continue;
				}


	    		checkboxes[j].setValue(false);
	    	}
	    	
	    	var vm = this.lookupReference('orgForm').getViewModel();
	    	this.lookupReference('addUsersButton')
				.setDisabled(Ext.isEmpty(vm.get('orgId')));
	    	var orgTypes = vm.get('orgTypes');
	    	for(var i=0; i<orgTypes.length; i++){
				var type = orgTypes[i]; 
				var checkbox = this.lookupReference('orgtype-' + type.orgtypeid);
				if(checkbox){
					checkbox.setValue(true);
				}
			}

	    	var parentOrgDropdown = this.lookupReference("parentorganization");
	    	var parentOrgId = vm.get("parentorgid");
			var index = parentOrgDropdown.getStore().find("orgId",parentOrgId);

	    	if(index == -1 && parentOrgId > 0){
	    		parentOrgDropdown.disable();
	    		this.getOrganizationName(parentOrgId);
			}else{
	    		parentOrgDropdown.enable();
				this.lookupReference("parentName").setVisible(false);
			}

			if(vm.get('restrictincidents') === true) {
				this.lookupReference('restrictincidents').setValue(true);
			} else {
				this.lookupReference('restrictincidents').setValue(false);
			}

			if(vm.get('createincidentrequiresadmin') === true) {
				this.lookupReference('createincidentrequiresadmin').setValue(true);
			} else {
				this.lookupReference('createincidentrequiresadmin').setValue(false);
			}
	    	
	    	this.lookupReference('submitButton').setDisabled(false);
	    }
	});
});
