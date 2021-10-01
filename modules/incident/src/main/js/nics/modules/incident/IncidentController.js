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
define(['ext',
		'iweb/CoreModule', 
		'ol',
         './IncidentModel',
 		'nics/modules/UserProfileModule',
 		'iweb/modules/MapModule',
 		'iweb/modules/geocode/AbstractController',
 		'iweb/modules/drawmenu/Interactions',
 		'./IncidentOrgViewer'], 

	function(Ext, Core, ol, IncidentModel, UserProfile, 
		MapModule, AbstractController, Interactions, IncidentOrgViewer){
	
		Ext.define('modules.incident.IncidentController', {
			extend : 'Ext.app.ViewController',
			
			id: 'incidentcontroller',
			
			alias: 'controller.incidentcontroller',
			
			onCreate: true,
			
			updateIncidentId: null,
			
			mixins: {
		
				geoApp: 'modules.geocode.AbstractController'
			
			},
			
			init: function(){
				this.model = new IncidentModel();

				this.mediator = Core.Mediator.getInstance();
				this.incOrgView = new IncidentOrgViewer();
			    
			    this.bindEvents();
			},
	 
			bindEvents: function(){
				//Bind UI Elements
				this.getView().createIncidentButton.on("click", this.showIncidentMenu, this);
				this.getView().createButton.on("click", this.createIncident, this);
				this.getView().locateButton.on("toggle", this.locateIncident, this);
				this.getView().lookupOrgsButton.on("click", this.lookupOrgsIncident, this);

				Core.EventManager.addListener("iweb.NICS.incident.update", this.onUpdateIncident.bind(this));
		
				//Subscribe to UI Events
				Core.EventManager.addListener("nics.incident.close", this.onCloseIncident.bind(this));
				Core.EventManager.addListener("nics.incident.load", this.onLoadIncidents.bind(this));
				Core.EventManager.addListener("nics.incident.window.update", this.showUpdateWindow.bind(this));
				Core.EventManager.addListener("nics.miv.join", this.onMIVJoinIncident.bind(this));
				Core.EventManager.addListener("nics.incident.create.callback", this.onCreateIncident.bind(this));
				Core.EventManager.addListener(UserProfile.PROFILE_LOADED, this.populateModel.bind(this));
				Core.EventManager.addListener('nics.incident.orgs', this.onLoadOrgs.bind(this));
				Core.EventManager.addListener("nics.incident.search.join", this.joinIncident.bind(this));
				
				//Listen for updates to the incident types for this org
				var updateIncidentTypeTopic = Ext.String.format("iweb.NICS.orgincidenttypes.{0}.update", UserProfile.getOrgId());
				this.mediator.subscribe(updateIncidentTypeTopic);
				Core.EventManager.addListener(updateIncidentTypeTopic, this.updateIncidentTypes.bind(this));
			},

			populateModel: function(e, userProfile){

			
				//Handler for new incidents
				var topic = Ext.String.format("iweb.NICS.ws.{0}.newIncident", UserProfile.getWorkspaceId());
				this.mediator.subscribe(topic);
				Core.EventManager.addListener(topic, this.onNewIncident.bind(this));
				
				//Handler for new incidents
				var removeTopic = Ext.String.format("iweb.NICS.ws.{0}.removeIncident", UserProfile.getWorkspaceId());
				this.mediator.subscribe(removeTopic);
				Core.EventManager.addListener(removeTopic, this.onRemoveIncident.bind(this));
				
				var url = Ext.String.format("{0}/incidents/{1}?accessibleByUserId={2}",
					Core.Config.getProperty(UserProfile.REST_ENDPOINT),
					UserProfile.getWorkspaceId(), UserProfile.getUserId());
				//request incidents
				this.mediator.sendRequestMessage(url, "nics.incident.load");
				//Core.EventManager.fireEvent('nics.incident.orgs.get',UserProfile);
				//Get the list of organizations, so we can create the list of prefixes used for updating incidents
				if(UserProfile.isSuperUser() || UserProfile.isAdminUser()){
					var orgsURL = Ext.String.format('{0}/orgs/{1}/all', 
						Core.Config.getProperty(UserProfile.REST_ENDPOINT), 
						UserProfile.getWorkspaceId());
					this.mediator.sendRequestMessage(orgsURL,"nics.incident.orgs");
				}

				this.loadCountries(userProfile);

				this.onLoadIncOrgTopics();

			},

			loadCountries: function(userProfile){

				var url = Ext.String.format('{0}/country/',
					Core.Config.getProperty(UserProfile.REST_ENDPOINT));

				var topic = Core.Util.generateUUID();
				Core.EventManager.createCallbackHandler(topic, this,
					function(evt, response){
						if(response.countries){
							this.view.countryDropdown
								.getStore().loadRawData(response.countries);

							Core.EventManager.fireEvent('nics.countries.load', response.countries);

							this.loadStates();
						}
					}
				);

				this.mediator.sendRequestMessage(url, topic);
			},

			requestRegions: function(countryId){
				var url = Ext.String.format('{0}/country/region/{1}',
					Core.Config.getProperty(UserProfile.REST_ENDPOINT),
					countryId);

				var topic = Core.Util.generateUUID();
				Core.EventManager.createCallbackHandler(topic, this,
					function(evt, response){
						if(response.regions &&
							response.regions.length > 0){

							//set the regions on the country dropdown so not to requery...
							//not sure I want to do this - might request each time
							/*this.view.countryDropdown.getSelectedRecord()
								.set("regions", response.regions);*/

							this.view.setConfiguredRegions(response.regions);

						}else{
							this.view.showRegionalInput();
						}
						Core.EventManager.fireEvent("regionsLoaded");
					}
				);

				this.mediator.sendRequestMessage(url, topic);
			},

			loadStates: function(){

				//Set defaults from the database
				if (UserProfile.getOrgCountry()) {
					var countryCode = this.view.getCodeFromCountryId(
						UserProfile.getOrgCountry()
					);

					//If we know the Country is US,
					if (countryCode === 'US'){
						var stateStore = this.view.stateDropdown.getStore();
						stateStore.filter("countryCode", 'US');

						this.view.stateDropdown.setVisible(true);
						this.view.regionInput.setVisible(false);

						if (UserProfile.getOrgState()) {
							this.setState(userProfile.getOrgState());
						}
					}else if(countryCode !== 'ZZ'){
						var country = this.view.countryDropdown.getStore()
							.findRecord('countryCode', countryCode);

						if(country){
							//set the country - altho it's optional so not going to force it
							//this.view.countryDropdown.select(country);

							//load the regions
							this.requestRegions(country.data.countryId);
						}
					}else {
						this.view.stateDropdown.setVisible(false);
						this.view.regionInput.setVisible(true);
					}
				}
			},

			onLoadOrgs: function(evt, response){
				var orgData = response.organizations;
				this.model.setAllOrgPrefixes(orgData);

			},

			onLoadIncOrgTopics: function(){

				var userOrgs = UserProfile.getUserOrgs();

				if(!UserProfile.isSuperUser()){

					for(var i = 0; i < userOrgs.length; i++){
						
						var addIncOrgTopic = Ext.String.format('iweb.NICS.ws.{0}.incidentorg.{1}.add',UserProfile.getWorkspaceId(),userOrgs[i].orgid);
						var removeIncOrgTopic = Ext.String.format('iweb.NICS.ws.{0}.incidentorg.{1}.remove',UserProfile.getWorkspaceId(),userOrgs[i].orgid);

						this.mediator.subscribe(addIncOrgTopic);
						Core.EventManager.addListener(addIncOrgTopic,this.onAddIncOrg.bind(this));

						this.mediator.subscribe(removeIncOrgTopic);
						Core.EventManager.addListener(removeIncOrgTopic,this.onRemoveIncOrg.bind(this));

					}
				}
				else{

					var addIncOrgTopic = Ext.String.format('iweb.NICS.ws.{0}.superuser.incident.add', UserProfile.getWorkspaceId());
					
					this.mediator.subscribe(addIncOrgTopic);
					Core.EventManager.addListener(addIncOrgTopic,this.onAddIncOrg.bind(this));
				}

				var removeIncOrgTopic = Ext.String.format('iweb.NICS.ws.{0}.incidentorg.remove',UserProfile.getWorkspaceId());
				this.mediator.subscribe(removeIncOrgTopic);
				Core.EventManager.addListener(removeIncOrgTopic,this.onRemoveIncOrg.bind(this));
			},

			onAddIncOrg: function(e, incident){

				if(incident.incidentid && !this.model.contains(incident.incidentid)){			
					this.onNewIncident(e,incident);
					this.model.addIncident(incident);	
				}				
				
				Core.EventManager.fireEvent("nics.miv.add.mivpanel", incident);
			},

			onRemoveIncOrg: function(e, incOrg) {
				if (incOrg.incidentId && this.model.contains(incOrg.incidentId)
					&& !UserProfile.isSuperUser()){

					//Check to see if the user has permission to see this incident
					if (incOrg.orgIds) {
						var userOrgs = UserProfile.getUserOrgs();
						var found = false;
						for (var i = 0; i < userOrgs.length; i++) {
							if(found === true) {
								break;
							}
							for (var j = 0; j < incOrg.orgIds.length; j++) {
								if (userOrgs[i].orgid === incOrg.orgIds[j]) {
									found = true;
									break;
								}
							}
						}
						if (found === true) {
							Core.EventManager.fireEvent("nics.miv.refresh.mivpanel", incOrg.incidentId);
							return;
						}
					}

					//Otherwise, remove
					this.onRemoveIncident(e, incOrg.incidentId);
					this.model.removeIncident(incOrg.incidentId);

					if (this.model.getCurrentIncidentId() === incOrg.incidentId) {
						Core.EventManager.fireEvent("nics.incident.close");
					}
				}
			},
			
			onLoadIncidents: function(e, incidents){
				var incidentData = this.parseIncidents(incidents);
				this.model.setIncidents(incidentData.incidents);
				this.model.setIncidentCallBack(this.onJoinIncident.bind(this));
				this.model.setIncidentTypes(UserProfile.getIncidentTypes()); //Should probably take this out of UserProfile
		
				this.getView().setData(this.model, UserProfile);

				this.getView().closeCreateWindow();
				this.getView().updateIncidentName(
					this.updateIncidentId,this.getView().getIncidentName());
				this.incOrgView.setIncidentId(null);
			},

			onJoinIncident: function(menuItem){
				//For now leave the incident that you are in to join a new one
				if(this.model.getCurrentIncident().id !== -1){
					Core.EventManager.fireEvent("nics.incident.close");
				}
				
				var topic = Ext.String.format("iweb.NICS.incident.{0}.#", menuItem.incidentId);
				var incident = { name: menuItem.text, id: menuItem.incidentId, topic: topic };
			
				if(!this.model.isOpen(incident)){
					this.mediator.subscribe(topic);
				}
				
				this.model.setCurrentIncident(incident);
				this.getView().setIncidentLabel(menuItem.text, menuItem.incidentId);
				
				var latAndLonValues = [menuItem.lon,menuItem.lat];
    			var center = ol.proj.transform(latAndLonValues,'EPSG:4326','EPSG:3857');
    			MapModule.getMap().getView().setCenter(center);
				
				Core.EventManager.fireEvent("nics.incident.join", incident);
			},

			onUpdateIncident: function(evt, incident){
				var items = this.getView().getMenu().items;
				for(var i=0; i<items.length; i++) {
					var item = items.getAt(i);
					if (item.config && item.config.incidentId === incident.incidentid) {
						if (item.config.text != incident.incidentname) {
							item.setText(incident.incidentname);
							if(incident.incidentid === this.model.getCurrentIncidentId()) {
								this.getView().setIncidentLabel(incident.incidentname, incident.incidentid);
							}
						}
						break;
					}
				}
			},
			
			//Incident is joined from the Search window
			joinIncident: function(evt, incident){
				if(!incident.archived){
					this.onJoinIncident({ text: incident.name, incidentId: incident.id, lat: incident.lat, lon: incident.lon });
				}else{
					this.onJoinArchivedIncident(incident);
				}
			},
			
			onJoinArchivedIncident: function(incident){
				//For now leave the incident that you are in to join a new one
				if(this.model.getCurrentIncident().id !== -1){
					Core.EventManager.fireEvent("nics.incident.close");
				}
				
				this.model.setCurrentIncident(incident);
				
				this.getView().setIncidentLabel(incident.name, incident.id);
				
				Core.EventManager.fireEvent("nics.incident.join", incident);
			},

			onMIVJoinIncident: function(e, incidentName){
				var menuIndex = -1;
				for(var i = 0; i < Core.View.titleBar.items.items.length; i++){
					if(Core.View.titleBar.items.items[i].text === 'Incidents'){
						menuIndex = i; 
					}	
				}
				
				if(menuIndex !== -1){
					for(var i = 0; i < Core.View.titleBar.items.items[menuIndex].menu.items.items.length; i++){
						if(incidentName === Core.View.titleBar.items.items[menuIndex].menu.items.items[i].text){
							this.onJoinIncident(Core.View.titleBar.items.items[menuIndex].menu.items.items[i]);	
						}
					}
				}
				else{
					Ext.MessageBox.alert("Incident Error","Unable to join incident.");
				}
				
			},

			onCloseIncident: function(e){
				this.mediator.unsubscribe(this.model.getCurrentIncident().topic);
				this.model.removeCurrentIncident();
				this.getView().resetIncidentLabel();
				
				var actions = Core.Ext.Map.getDefaultInteractions();
		    	Core.Ext.Map.setInteractions(actions);
				
				this.getView().locateButton.toggle(false);
			},

			onNewIncident: function(e, incident){
				if(!this.model.contains(incident.incidentid)){
					this.getView().addMenuItem(
							incident.incidentname,
							incident.incidentid,
							incident.lat, incident.lon,
							incident.incidenttypes, //need to figure out incidenttypes? -- Not returning from API atm
							2, false, //0 is the Create Incident option & 1 is the menu separator
							this.onJoinIncident.bind(this)); 
							
					this.model.addIncident(incident);

					Core.EventManager.fireEvent("nics.miv.add.mivpanel", incident);
				}	
			},
			
			onRemoveIncident: function(e, incidentId){
				if(this.model.contains(incidentId)){
					var items = this.getView().getMenu().items;
					for(var i=0; i<items.length; i++){
						var item = items.getAt(i);
						if(item.config && item.config.incidentId === incidentId){
							this.getView().getMenu().remove(item);
							this.model.removeIncident(incidentId);
							break;
						}
					}
					Core.EventManager.fireEvent("nics.miv.remove.mivpanel", incidentId);
				}
			},
			
			onCreateIncident: function(evt, response){
				if(response.message !== "OK"){
					Ext.MessageBox.alert("Status", response.message);
				}else{
					//Reset Display
					this.getView().resetCreateWindow();
					this.getView().closeCreateWindow();
					this.incOrgView.resetOrgs();
					
					if(response.incidents && response.incidents[0]){
						var incident = response.incidents[0];
						this.onJoinIncident({
								text: incident.incidentname,
								incidentId: incident.incidentid,
								lat: incident.lat,
								lon: incident.lon
							});
					}

					this.incOrgView.setIncidentId(null);

				}
			},

			showIncidentMenu: function(){
				var view = this.getView();
				
				view.createWindow.setTitle(Core.Translate.i18nJSON('Create Incident'));
				view.createButton.setText(Core.Translate.i18nJSON('Create'));
				view.resetCreateWindow();
				this.incOrgView.resetOrgs();
				
				if(!this.onCreate){	
					view.createButton.removeListener("click", this.updateIncident, this);
					view.createButton.on("click", this.createIncident, this);
					this.onCreate = true;
				}
				
				var center = MapModule.getMap().getView().getCenter();
				var latLonValues = ol.proj.transform(center,'EPSG:3857', 'EPSG:4326');
				
				view.setLat(latLonValues[1]);
				view.setLon(latLonValues[0]);
				
				view.createWindow.show();
			},

			onRegionLoaded: function(){
				var regionIndex =
					this.view.regionDropdown.getStore().find("regionCode", this.region);

				if(regionIndex !== -1){
					this.view.regionDropdown.select(this.view.regionDropdown.getStore().getAt(regionIndex));
				}else{
					this.setRegion(this.region);
				}
				Core.EventManager.removeListener("regionsLoaded", this.setRegionBind);
			},
			
			showUpdateWindow: function(e, selected){
				var view = this.getView();
				var defaultPrefix = UserProfile.getOrgPrefix();
				view.createWindow.setTitle('Update Incident');
				view.createButton.setText('Update');
				
				if(this.onCreate){
					view.createButton.removeListener("click", this.createIncident, this);
					view.createButton.on("click", this.updateIncident, this);
					this.onCreate = false;

				}
				var country;
				var stateRegion = "";
				var name = "";
				var isUSState = false;
				var countryCode = 'ZZ';
				
				var incidentName = selected.get('incidentname');
				
				
				//get state and country info from name - Name is "Country(optional) State/Region Prefix Name"
				
				//Find the position of the prefix
				var prefixes = this.model.getAllOrgPrefixes();
				var nameParts = incidentName.split(" ");
				var prefixPos = -1;
				for (i = 0; i < nameParts.length; i++) {
					if ((prefixes.indexOf(nameParts[i])) !== -1){
						prefixPos = i;
					}
				}

				//There is no state or country.
				// Leave them blank, so user can fix it
				if (prefixPos === 0){
					stateRegion = " ";
					view.countryDropdown.clearValue();
				}else{
					var stateIndex = view.stateDropdown.getStore().find("state", nameParts[0]);

					var countryIndex = view.countryDropdown.getStore().find("countryCode", nameParts[0]);

					//Starts with a state or a country - not sure
					if(stateIndex !== -1){
						stateRegion = this.buildRegion(0, prefixPos, nameParts);
						view.countryDropdown.clearValue();
					}else if(countryIndex !== -1){
						countryCode = nameParts[0];
						//A Region/State was set
						if(prefixPos !== 1){
							if(countryCode === 'US'){
								//Select country first
								view.countryDropdown.select(view.countryDropdown.getStore().getAt(countryIndex));
								var rec = this.view.stateDropdown.getStore().getAt(
									this.view.stateDropdown.getStore().find("state", nameParts[1]));
								if(rec){
									this.view.stateDropdown.select(rec);
								}
							}else {
								this.region = this.buildRegion(1, prefixPos, nameParts);
								if(view.countryDropdown.getSelectedRecord() &&
									view.countryDropdown.getSelectedRecord().data.countryCode === countryCode){
									this.onRegionLoaded();
								} else {
									//wait until the regions have been loaded to update the view
									this.setRegionBind = this.onRegionLoaded.bind(this);
									Core.EventManager.addListener("regionsLoaded", this.setRegionBind);
								}
								//Select the country
								view.countryDropdown.select(view.countryDropdown.getStore().getAt(countryIndex));
							}
						}else{
							//Select the country
							view.countryDropdown.select(view.countryDropdown.getStore().getAt(countryIndex));
						}
					}else{
						//Set Region/State
						//Since we don't know the country will just set the region in the text box for now
						stateRegion = this.buildRegion(1, prefixPos, nameParts);
					}
				}

				//Everything after the prefix is the name
				var name = "";
				for (i = prefixPos+1; i < nameParts.length; i++) {
		    		name += nameParts[i] + " ";
				}
				
				//Set form data
				view.setName(name.trim());
				view.setDescription(selected.get('description'));
				view.setLat(selected.get('lat'));
				view.setLon(selected.get('lon'));
				view.setPrefixValue(defaultPrefix); //just in case there is no prefix in name in imported incidents
				if (nameParts[prefixPos]) view.setPrefixValue( nameParts[prefixPos]);
				
				
				if (countryCode === 'US' || isUSState) {
					view.stateDropdown.setVisible(true);
					view.regionDropdown.setVisible(false);
				    view.regionInput.setVisible(false);
				    view.regionWarning.setVisible(false);
				}
				else if  (countryCode === 'ZZ') {
					this.setRegion(stateRegion.trim());
				}else{
					view.regionDropdown.setVisible(true);
					view.stateDropdown.setVisible(false);
					view.regionInput.setVisible(true);
					view.regionWarning.setVisible(false);
				}
				
				var incidentTypesName = selected.get('incidenttypes').split(', ');
				
				view.resetIncidentTypes();
				
				for(var i = 0; i < incidentTypesName.length; i++){
					view.checkIncidentTypes(incidentTypesName[i]);
				}
				
				this.updateIncidentId = selected.get('incidentid');
				
				view.createWindow.show();
				
				
			},

			buildRegion: function(start, end, nameParts){
				var stateRegion = "";
				for(var i=start; i<end; i++) {
					stateRegion += nameParts[i];
				}
				return stateRegion;
			},

			setRegion: function(stateRegion){
				//We're not sure, so set it in region,
				this.view.setRegion(stateRegion);
				this.view.stateDropdown.setVisible(false);
				this.view.regionInput.setVisible(true);
				this.view.regionDropdown.setVisible(false);
				this.view.regionWarning.setVisible(false);
			},

			hasNoIncidentTypes: function(incidentTypes) {
				if(!incidentTypes || incidentTypes.length === 0) {
					return true;
				}

				return false;
			},

			showNoIncidentTypeMessage: function() {
				Ext.MessageBox.alert("NICS",
					Core.Translate.i18nJSON("You must select at least one Incident Type."));
			},

			updateIncident: function(){
				var view = this.getView();
			
				var incidentTypes = this.getView().getIncidentTypeIds().map(function(id){
					return {incidenttypeid: id};
				});

				if(this.hasNoIncidentTypes(incidentTypes) === true) {
					this.showNoIncidentTypeMessage();
					return;
				}
			
				if(this.updateIncidentId){
				
					var incident = {
						incidentid: this.updateIncidentId,
						workspaceid: UserProfile.getWorkspaceId(), 
						description: view.getDescription(), 
						incidentname: view.getIncidentName(), 
						lat: view.getLat(),
						lon: view.getLon(),
						folder: '',
						active: true,
						incidentIncidenttypes: incidentTypes
					};
					
					var topic = "nics.incident.update.callback";
				
					
					var url = Ext.String.format("{0}/incidents/{1}/update",
							Core.Config.getProperty(UserProfile.REST_ENDPOINT),
							UserProfile.getWorkspaceId());
					
					this.mediator.sendPostMessage(url,topic,incident);
				
				}
				
			},
			
			lookupOrgsIncident: function(){
				
				if(!this.onCreate){
					this.incOrgView.setIncidentId(this.updateIncidentId);
					this.incOrgView.setUserId(UserProfile.getUserId());
				}
				else{
					this.incOrgView.setIncidentId(null);
				}

				this.incOrgView.setOnCreate(this.onCreate);
				this.incOrgView.loadOrgs();
				this.incOrgView.show();

			},
			createIncident: function(){
				var view = this.getView();

				if(!view.isCountryValid()){
					Ext.MessageBox.alert("NICS",
						Core.Translate.i18nJSON("The country value is not valid. Please pick a country or " +
						"clear the field."));
					return;
				}
				
				var incidentTypes = this.getView().getIncidentTypeIds().map(function(id){
					return {incidenttypeid: id};
				});

				if(this.hasNoIncidentTypes(incidentTypes) === true) {
					this.showNoIncidentTypeMessage();
					return;
				}
				
				var incOrgs = [];
				
				this.incOrgView.getIncOrgs().forEach(function(incOrg) {
					incOrgs.push({ orgid:incOrg.data.orgId , userid: UserProfile.getUserId() });
				});

				// If org config specifies to auto-restrict new incidents, add their org if it's not
				// already added
				if ( UserProfile.getRestrictIncidents() === true) {
					if (!incOrgs[UserProfile.getOrgId()]) {
						incOrgs.push({orgid: UserProfile.getOrgId(), userid: UserProfile.getUserId()});
					}
				}

				var incident = {
						usersessionid: UserProfile.getUserSessionId(),
						workspaceid: UserProfile.getWorkspaceId(), 
						description: view.getDescription(), 
						incidentname: view.getIncidentName(), 
						lat: view.getLat(),
						lon: view.getLon(),
						folder: '',
						active: true,
						incidentIncidenttypes: incidentTypes,
						incidentorgs: incOrgs
				};

				var topic = "nics.incident.create.callback";
				
				var url = Ext.String.format("{0}/incidents/{1}?orgId={2}&userId={3}",
						Core.Config.getProperty(UserProfile.REST_ENDPOINT),
						UserProfile.getWorkspaceId(),
						UserProfile.getOrgId(),
						UserProfile.getUserId());
				
				this.mediator.sendPostMessage(url,topic,incident);				
			},
			
			locateIncident: function(button, pressed){
				
				if(pressed){
					
					var source = this.mixins.geoApp.getLayer().getSource();
					var style = this.mixins.geoApp.getLayer().getStyle();
					var interaction = Interactions.drawPoint(source, style);
					interaction.on("drawend", this.onDrawEnd.bind(this));
					MapModule.getMapController().setInteractions([interaction]);
					
				}
				else{
					var actions = Core.Ext.Map.getDefaultInteractions();
					Core.Ext.Map.setInteractions(actions);
				}
			
			},
			
			onDrawEnd: function(drawEvent){
			
				var view = MapModule.getMap().getView();
				var clone = drawEvent.feature.getGeometry().clone().transform(view.getProjection(), ol.proj.get('EPSG:4326'));
				var coord = clone.getCoordinates();
				
				this.getView().latitudeInput.setValue(coord[1]);
				this.getView().longitudeInput.setValue(coord[0]);
				
				this.getView().locateButton.toggle(false);
				
				this.mixins.geoApp.removeLayer();
				
				var actions = Core.Ext.Map.getDefaultInteractions();
		    	Core.Ext.Map.setInteractions(actions);
			},
			
			getIncidentTypes: function(){
				var newIncidentTypes = [];
				var incidentTypes = this.getView().getIncidentTypeIds();
				for(var i=0; i<incidentTypes.length; i++){
					newIncidentTypes.push({
						incidenttypeid: incidentTypes[i]
					});
				}	
				return newIncidentTypes;
			},

			parseIncidents: function(data){
				var incidents = [];
				var collabRooms = {};
		
				for(var i=0; i<data.incidents.length; i++){
					incidents.push({
						incidentName: data.incidents[i].incidentname,
						incidentId: data.incidents[i].incidentid,
						lat: data.incidents[i].lat,
						lon: data.incidents[i].lon
					});
					collabRooms[data.incidents[i].incidentName] = data.incidents[i].collabrooms;
				}
		
				return { incidents: incidents, collabRooms: collabRooms };
			},
			
			updateIncidentTypes: function(evt, response){
				if(response && response.entity && response.entity.activeIncidentTypes){
					var incidentTypes = this.buildTypeList(response.entity.activeIncidentTypes);
					UserProfile.setIncidentTypes(incidentTypes);
					this.view.setIncidentTypes(incidentTypes);
				}
			},

			buildTypeList: function(incidents){
				var list = [];
				incidents.forEach(function(incidentOrg){
					list.push(incidentOrg.incidenttype);
				});
				return list;
			}
	});
});
