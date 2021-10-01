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
 define(['iweb/CoreModule', 'nics/modules/UserProfileModule',
	 './IncidentController', 'iweb/core/FormVTypes'], function(Core, UserProfile) {
	Ext.define('modules.incident.IncidentViewer', {

		extend: 'Ext.Button',
		
		controller: 'incidentcontroller',

		requires: [ 'Ext.Panel', 'Ext.Button', 'Ext.form.TextField', 'Ext.Container' ],

		initComponent: function(){
			var createItem = this.createIncidentButton = this.addMenuItem(
			        Core.Translate.i18nJSON("Create New Incident"), -1);

			// TODO: need to fire event maybe to update this, since this init isn't called again
			//	when an edit is made
			if(UserProfile.getCreateIncidentRequiresAdmin() === true) {
				if (!UserProfile.isSuperUser() && !UserProfile.isAdminUser()) {
					createItem.setDisabled(true);
				}
			}
				
			this.menu.add({
				xtype : 'menuseparator'
			});
			
			this.countryDropdown = Core.UIBuilder.buildComboBox(
					"country",
					Ext.String.format("{0} <em>{1}</em>"
						, Core.Translate.i18nJSON("Country")
						, Core.Translate.i18nJSON("optional"))
				, 135
				, {fields: ['countryId', 'name', 'countryCode', 'regions'], sorters: ["name"] }
				, {
						valueField: 'countryId'
						, displayField: 'name'
						,  allowBlank: true
						, typeAhead: true
						, reference:'createIncidentCountry' });

			this.countryDropdown.on("change", this.onCountryChange, this);

			this.stateDropdown = Core.UIBuilder.buildComboBox(
				"state", Ext.String.format("{0} <em>{1}</em> ", Core.Translate.i18nJSON("State"), Core.Translate.i18nJSON("optional")), 135, ['countryCode', 'state'],
				{valueField: 'state', forceSelection: true, typeAhead: true, emptyText: Core.Translate.i18nJSON("Select a State..."), hidden:true, id:'createIncidentState'});
			//this.stateDropdown.on("change", this.onStateChange, this);

			this.regionInput = Ext.create('Ext.form.field.Text', { name: 'region', fieldLabel: Ext.String.format('{0}/{1}<br/><em>{2}</em>',
	                Core.Translate.i18nJSON('State'),  Core.Translate.i18nJSON('Region'), Core.Translate.i18nJSON('optional')),
	                width: 100, maxLength: 40, enforceMaxLength: true , hidden:true});
	        //this.regionInput.on("change", this.onRegionChange, this);

			this.regionDropdown = Core.UIBuilder.buildComboBox(
				"regionName",
				Ext.String.format('{0}<em>{1}</em>',
					Core.Translate.i18nJSON('Region'))
				, 135
				, { fields: ['regionId', 'regionName', 'regionCode'], sorters: ['regionName'] }
				, {
					valueField: 'regionName',
					forceSelection: true,
					typeAhead: true,
					emptyText: 'None',
					hidden:true,
					reference:'regionDropdown'}
			);

			this.regionWarning = Ext.create('Ext.form.field.Display', { name: 'regionWarning', value: Ext.String.format('<em>{0}</em>',
	                Core.Translate.i18nJSON('Please enter either a State (US) or a Region')), flex:1, hidden:true});
	            	
			this.latitudeInput = Ext.create('Ext.form.field.Number', { name: 'lat', fieldLabel: Core.Translate.i18nJSON('Latitude'), width: 100,
				hideTrigger: true, keyNavEnabled: false, mouseWheelEnabled: false, decimalPrecision: 14 });
			this.longitudeInput = Ext.create('Ext.form.field.Number', { name: 'lon', fieldLabel: Core.Translate.i18nJSON('Longitude'), width: 100,
				hideTrigger: true, keyNavEnabled: false, mouseWheelEnabled: false, decimalPrecision: 14 });
				
			this.nameInput = Ext.create('Ext.form.field.Text', { name: 'incidentName', fieldLabel: Core.Translate.i18nJSON('Name'), width: 100, maxLength: 40, enforceMaxLength: true, id:'createIncidentName' });
			this.prefixValue = Ext.create('Ext.form.field.Display',{ name: 'prefix', fieldLabel: Core.Translate.i18nJSON('Prefix')});
			
			this.description = Ext.create('Ext.form.field.TextArea',
					{ name: 'incidentDescription', fieldLabel: Core.Translate.i18nJSON('Description'), width: 100 ,vtype : 'extendedalphanumplus',  maxLength: 500, enforceMaxLength: true, id:'createIncidentDescription'});
	
			this.createButton = Ext.create('Ext.Button', { text: Core.Translate.i18nJSON('Create') });
			this.cancelButton = Ext.create('Ext.Button', { text: Core.Translate.i18nJSON('Cancel'), handler: function(){ this.createWindow.hide(); }, scope: this});
			this.locateButton = Ext.create('Ext.Button', { text: Core.Translate.i18nJSON('Locate'), enableToggle: true });
			this.lookupOrgsButton = Ext.create('Ext.Button', { text: Core.Translate.i18nJSON('Update Orgs') });

			this.incidentTypeSet = Ext.create('Ext.form.FieldSet',{
				autoScroll: true,
	        	title: Core.Translate.i18nJSON('Incident Types'),
	        	height: 200
			});
	
			this.incidentLabel =  Ext.create('Ext.form.Label',{
				id:'incident-label',
				html: Ext.String.format('<div id="nicsIncidentLabel"><strong>{0}</strong></div>', Core.Translate.i18nJSON('No Incident Selected')),
                incidentId: 0,
				incidentName: ''
			});
			
			this.incidentCloser = Ext.create('Ext.form.Label',{
				html:"<span style='cursor: pointer;color:blue;margin-left:5px'><u>[x]</u></span>",
				hidden: true,
				listeners: {
					render: function(label){
						var callback = function(){ Core.EventManager.fireEvent('nics.incident.close'); };
						var element = label.getEl().dom.firstChild;
						if (element.addEventListener) {  // all browsers except IE before version 9
						  element.addEventListener("click", callback, false);
						}
					}
				}
			});
			
			this.createWindow = Ext.create('Ext.window.Window',{
				title: Core.Translate.i18nJSON('Create Incident'),
				cls: 'incidents-window',
				bodyBorder : false,
				layout : 'form',
				minimizable : false,
				closable : true,
				maximizable : false,
				resizable : false,
				draggable : true,
				constrainHeader: true,
				padding : 10,
				width: 400,
				closeAction: 'hide',
				buttonAlign: 'center',
				fieldDefaults: {
			        labelAlign: 'right',
			        labelWidth: 100
			    },
			    items: [
			    	{
						xtype: 'fieldset',
						title: '',
				        defaultType: 'textfield',
				        defaults: {
				            anchor: '-10',
				            vtype:'simplealphanum'
				        },
				        items:[
				        	this.countryDropdown,
				        	this.stateDropdown,
							this.regionDropdown,
				        	this.regionInput,
				        	this.regionWarning,
				        	this.latitudeInput,
				        	this.longitudeInput,
				        	this.prefixValue,
				        	this.nameInput,
				        	this.description
				        ]
		    		},
			    	this.incidentTypeSet
			    ],
			    buttons: [
			    	this.createButton,
			    	this.cancelButton,
			    	this.locateButton,
			    	this.lookupOrgsButton
			    ]
			});
			
		
			this.callParent();
		},
	
		config: {
			text : Core.Translate.i18nJSON('Incidents'),
			cls: 'incidents-btn',
			
			menu : {
				xtype : 'menu',
				cls: 'incidents-menu',
				forceLayout : true,
				autoWidth: true
			},
			baseCls: 'nontb_style'
		},
		
		getIncidentLabel: function(){
			return this.incidentLabel;
		},
		
		getIncidentCloser: function(){
			return this.incidentCloser;
		},

		setIncidentLabel: function(incidentName, incidentId){
			if(incidentId && incidentName){
				this.incidentLabel.incidentId = incidentId;
				this.incidentLabel.incidentName = incidentName;
				this.incidentLabel.update(Ext.String.format("<div><strong>{0}: {1}</strong></div>", Core.Translate.i18nJSON('Incident'), Ext.String.htmlEncode(incidentName)));
                this.incidentCloser.setVisible(true);
			}
		},

		resetIncidentLabel: function(){
			this.incidentLabel.incidentId = 0;
			this.incidentLabel.incidentName = '';
			this.incidentLabel.update(Ext.String.format("<strong>{0}</strong>", Core.Translate.i18nJSON("No Incident Selected")));
            this.incidentCloser.setVisible(false);
		},

		resetCreateWindow: function(){
			this.setDescription("");
			this.setName("");
			this.setRegion("");
			this.setCountry("");
			this.resetIncidentTypes();
		},

		closeCreateWindow: function(){
			this.createWindow.hide();
		},

		setData: function(model, userProfile){
			//Add new data
			this.clearMenuItems();

			this.setStates(model.getStates());
			
			this.setPrefixValue(userProfile.getOrgPrefix());
			this.setIncidentTypes(model.getIncidentTypes());//Getting and setting ids atm
			
			/** Add Incidents **/
			var incidents = model.getIncidents();
			var menuItems = [];
			for(var i=0; i<incidents.length; i++){
				var p = [];
				p.push(incidents[i].incidentName);
				p.push(incidents[i].incidentId);
				
				this.addMenuItem(incidents[i].incidentName,incidents[i].incidentId,
					incidents[i].lat, incidents[i].lon, null, -1, false, model.getIncidentCallBack());
			}
		},

		addMenuItem: function(
			text, incidentid, lat, lon, incidentTypes, index, child, onclick){
			
			var config = {
				text: Ext.String.htmlEncode(text),
				folder : false,
				lat: lat,
				lon: lon,
				incidentTypes: [],
				incidentId: incidentid
			};
		
			if(child){
				config.html = "<div style='padding-left: 10px'>	&rarr;  " + text + "</div>";
			}
		
			var newItem = Ext.create('Ext.menu.Item',config);
			
			if(onclick){
				newItem.on("click", onclick);
			}
		
			if(index != null && index > -1){
				return this.menu.insert(index, newItem);
			}
			
			return this.menu.add(newItem);
		},

		onCountryChange: function( combo, newValue, oldValue, eOpts) {
			//Check to see if it's a real country

			if(combo.getSelectedRecord()) {
				var countryCode =
					combo.getSelectedRecord().data.countryCode;

				if (countryCode == 'US') {
					//Show the US States Dropdown
					this.stateDropdown.setVisible(true);
					var stateStore = this.stateDropdown.getStore();
					stateStore.filter("countryCode", countryCode);

					this.regionInput.setVisible(false);
					this.regionWarning.setVisible(false);
					this.regionDropdown.setVisible(false);

					this.regionInput.setValue('');
					this.regionDropdown.getStore().clearData();
				} else if (countryCode == 'ZZ') {
					this.showRegionalInput();
				} else {
					/*if (combo.getSelectedRecord().data.regions) {
						this.setConfiguredRegions(combo.getSelectedRecord().data.regions)
					} else {*/
					//Request the regions everytime
						this.controller.requestRegions(newValue);
					//}
				}
			}
		},

		showRegionalInput: function(){
			//Show both
			this.regionInput.setVisible(true);

			this.regionDropdown.setVisible(false);
			this.stateDropdown.setVisible(false);
			this.regionWarning.setVisible(false);

			this.stateDropdown.clearValue();
			this.regionInput.setValue('');
			this.regionDropdown.getStore().clearData();
		},

		setConfiguredRegions: function(regions){
			this.regionDropdown.getStore().loadRawData(regions);

			//Show the region dropdown for configured country
			this.regionDropdown.setVisible(true);

			this.regionInput.setVisible(false);
			this.stateDropdown.setVisible(false);
			this.regionWarning.setVisible(false);

			this.stateDropdown.clearValue();
		},

		onStateChange: function( ) {
			//Verify that the state dropdown was set
			if(this.stateDropdown.getValue() != null){
				//clear out the region
				this.regionInput.setValue('');
			}
		},

		onRegionChange: function( ) {
			//Verify that the region input was set
			if(!Ext.isEmpty(this.regionInput.getValue())){
				//clear out the state
				this.stateDropdown.clearValue();
			}
		},
		
		setCountries: function(countries){
			var store = this.countryDropdown.getStore();
			store.loadData(countries);
			this.countryDropdown.select(store.getAt(0));
		},

		setCountry: function(country){
			this.countryDropdown.setValue(country);
		},
		
		
		getCodeFromCountryId: function(countryId){
			var countryCode ='ZZ';
			if (countryId && countryId > 0) {
				if (this.countryDropdown.getStore().findRecord('countryId',countryId)){
					countryCode = this.countryDropdown.getStore()
						.findRecord('countryId',countryId).getData().countryCode;
				}
			}

			return countryCode;
		},

		isCountryValid: function(){
			if(this.countryDropdown.getSelectedRecord()){
				return true;
			}else if(!Ext.isEmpty(this.countryDropdown.getValue())){
				return false;
			}
			return true;
		},
		
		getCountry: function(){
			if(this.countryDropdown.getSelectedRecord()){
				return this.countryDropdown.getSelectedRecord().data.countryCode;
			}
		},
		
		setStates: function(states){
			var store = this.stateDropdown.getStore();
			store.loadData(states);
		},

		setState: function(location){
			this.stateDropdown.setValue(location);
		},
		
		getState: function(){
			return this.stateDropdown.getValue();
		},

		setRegion: function(location){
			this.regionInput.setValue(location);
		},

		getRegion: function(){
			if(!this.regionDropdown.hidden &&
				this.regionDropdown.getSelectedRecord()){
				return this.regionDropdown.getSelectedRecord().data.regionCode;
			}else if(!Ext.isEmpty(this.regionInput.getValue())){
				return this.regionInput.getValue();
			}
			return "";
		},

		setPrefixValue: function(prefix){
			this.prefixValue.setValue(prefix);
		},

		getPrefixValue: function(){
			return this.prefixValue.getValue();
		},

		setIncidentTypes: function(incidentTypes){
			var displayIncidentTypes = [];
			if(incidentTypes && incidentTypes.length > 0){
				for(var i=0; i<incidentTypes.length; i++){
					displayIncidentTypes.push(
					    Ext.create('Ext.form.Checkbox',{
						boxLabel:Core.Translate.i18nJSON(incidentTypes[i].incidentTypeName),
						name: incidentTypes[i].incidentTypeId,
						hideLabel: true
					     })
					);
				}
				this.incidentTypeSet.removeAll();
				this.incidentTypeSet.add(displayIncidentTypes);
			}
		},
		
		checkIncidentTypes: function(incidentName){
			if(this.incidentTypeSet.items.length > 0){
				for(var i=0; i < this.incidentTypeSet.items.length; i++){
					if(incidentName == this.incidentTypeSet.items.get(i).boxLabel){
						this.incidentTypeSet.items.get(i).setValue(true);
					}
				}
			}
		},

		getIncidentTypeIds: function(){
			var incidentTypeIds = [];
			for(var i=0; i<this.incidentTypeSet.items.length; i++){
				if(this.incidentTypeSet.items.get(i).checked){
					incidentTypeIds.push(
						this.incidentTypeSet.items.get(i).name);
				}
			}
			return incidentTypeIds;
		},

		resetIncidentTypes: function(){
			var incidentTypeIds = [];
			for(var i=0; i<this.incidentTypeSet.items.length; i++){
				this.incidentTypeSet.items.get(i).setValue(false);
			}
			return incidentTypeIds;
		},

		clearMenuItems: function(){
			//Start at 2 to avoid removing the Create Room Button and menu separator
			while(this.menu.items.length > 2){
				this.menu.remove(this.menu.items.get(this.menu.items.length-1));
			}
		},

		getDescription: function(){
			return this.description.getValue();
		},

		getName: function(){
			return this.nameInput.getValue();
		},
		
		getLat: function(){
			return this.latitudeInput.getValue();
		},
		
		getLon: function(){
			return this.longitudeInput.getValue();
		},

		setDescription: function(description){
			this.description.setValue(description);
		},

		setName: function(name){
			this.nameInput.setValue(name); 
		},
		
		setLat: function(name){
			this.latitudeInput.setValue(name); 
		},
		
		setLon: function(name){
			this.longitudeInput.setValue(name); 
		},

		getIncidentName: function(){
			if (this.getCountry() == 'ZZ'){
				return this.buildName([
				    this.getStateRegion(),
				    this.getPrefixValue(),
				    this.getName()
			]);
			}
			
			else {
				return this.buildName([
				this.getCountry(),
			    this.getStateRegion(),
				this.getPrefixValue(),
				this.getName()
			]);
			}
		},
		getStateRegion: function(){
			var stateRegion = (this.getState() === null ? this.getRegion() : this.getState());
			return stateRegion;
		},
		
		buildName: function(parts) {
			var name = [];
			for (var i = 0; i < parts.length; i++) {
				if (!Ext.isEmpty(parts[i])) {
					name.push( parts[i] );
				}
			}
			return name.join(" ");
		},
		
		updateIncidentName: function(incidentId, name){
			this.menu.items.each( function( item ) {
				if(item.incidentId === incidentId){
					item.setText(name);
				}
			
			});
		}
	});
});
