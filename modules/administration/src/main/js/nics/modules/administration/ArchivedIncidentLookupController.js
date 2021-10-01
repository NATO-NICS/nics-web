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
	
	return Ext.define('modules.administration.ArchivedIncidentLookupController', {
		extend : 'Ext.app.ViewController',

		alias: 'controller.archivedincidentlookupcontroller',
		
		lookupTopic: 'nics.admin.incident.lookup',

		init: function(){
			this.mediator = Core.Mediator.getInstance();
			this.lookupReference('lookupGrid').store.removeAll();
			Core.EventManager.addListener(this.lookupTopic, this.loadIncidents.bind(this));
			
			//Request all incidenttypes to load the dropdown
			var topic = Core.Util.generateUUID();
			Core.EventManager.createCallbackHandler(topic, this, 
				function(evt, response){
					var combobox = this.view.lookupReference("incidentTypeCombo");
					if(combobox && response && response.incidentTypes){
						combobox.store.loadData(response.incidentTypes);
					}
			});
			
			var url = Ext.String.format('{0}/incidents/{1}/incidenttype', 
					Core.Config.getProperty(UserProfile.REST_ENDPOINT), 
					UserProfile.getWorkspaceId());
					
			this.mediator.sendRequestMessage(url, topic);
		},
		
		onIncidentTypeCheck: function(checkbox, newValue, oldValue, eOpts){
			var combobox = this.view.lookupReference("incidentTypeCombo");
			combobox.setVisible(checkbox.getValue());
		},
		
		onTimeRangeCheck: function(checkbox, newValue, oldValue, eOpts){
			var timeRange = this.view.lookupReference('timeRangeFields');
			timeRange.setVisible(checkbox.getValue());
		},
		
		addAmp: function(url){
			if(!url.endsWith("?")){
				return url + "&";
			}
			return url;
		},
		
		findArchivedIncidents: function(evt){
			/** Add input validation **/
			var searchValue = this.lookupReference('searchInput').getValue();
			var orgPrefix = this.lookupReference('orgPrefix').getValue();
			
			var url = Ext.String.format('{0}/incidents/{1}/find?', 
					Core.Config.getProperty(UserProfile.REST_ENDPOINT), 
					UserProfile.getWorkspaceId());
			
			if(this.lookupReference('archived').checked){
				url = url.concat('archived=true');
			}
			
			if(!Ext.isEmpty(orgPrefix)){
				url =  Ext.String.format("{0}orgPrefix={1}",  this.addAmp(url), orgPrefix);
			}
			
			if(!Ext.isEmpty(searchValue)){
				url = Ext.String.format("{0}name={1}",  this.addAmp(url), searchValue);
			}
			
			var checkbox = this.view.lookupReference('incidentType');
			if(checkbox.getValue()){
				var data = this.view.lookupReference('incidentTypeCombo')
					.getSelection().getData();
				
				if(data && data.incidentTypeId){
					url = Ext.String.format("{0}incidentTypeId={1}",  this.addAmp(url), data.incidentTypeId);
				}
			}
			
			var timeRange = this.view.lookupReference('timeRange');
			if(timeRange.getValue()){
				var startDate = this.view.lookupReference('startDate');
				var endDate = this.view.lookupReference('endDate');
				
				if(!Ext.isEmpty(startDate.getValue())){
					url = Ext.String.format("{0}fromDate={1}",  this.addAmp(url), startDate.time);
				}
				
				if(!Ext.isEmpty(endDate.getValue())){
					url = Ext.String.format("{0}&toDate={1}",  this.addAmp(url), endDate.time);
				}
			}
			
			this.mediator.sendRequestMessage(url, this.lookupTopic);
		},
		
		loadIncidents: function(evt, response){
			var grid = this.lookupReference('lookupGrid');
			grid.getStore().removeAll();
			
			if(!response.data || response.data.length == 0){
				Ext.MessageBox.alert(Core.Translate.i18nJSON("Incident Lookup"), 
						Core.Translate.i18nJSON("No incidents were found that match the given criteria."));
				return;
			}
			
			grid.getStore().loadData(response.data, true);
		},
		
		joinIncident: function(){
			var grid = this.lookupReference('lookupGrid');
			var selected = grid.getSelectionModel().getSelection();
			Core.EventManager.fireEvent("nics.incident.search.join", { 
					name: selected[0].data.incidentname, 
					id: selected[0].data.incidentid, 
					archived: !selected[0].data.active,
					lon: selected[0].data.lon,
					lat: selected[0].data.lat
			});
		    this.view.close();
		},
		
		clearGrid: function(){
			this.lookupReference('lookupGrid').store.removeAll();
			this.lookupReference('lookupGrid').view.refresh();
		},
		
		pickDate: function(dp, date){
			this.getDatePicker().hide();
			this.getDatePicker().inputBox.time = date.getTime();
			this.getDatePicker().inputBox.setValue(Ext.Date.format(date, 'Y-m-d'));
	    },
	    
	    showPicker: function(button){
	    	var picker = this.getDatePicker();
	    	picker.inputBox = this.lookupReference(button.reference + 'Date');
	    	this.getDatePicker().show();
	    },
		
		getDatePicker: function(){
	    	if(!this.datePicker){
	    		var handler = this.pickDate.bind(this);
				this.datePicker = Ext.create('Ext.Window', {
		 			layout: 'fit',
		 			close: 'hide',
		 			items:[{
	                	xtype: 'datepicker',
	                	reference: 'datePicker',
	                	handler: handler
					}]
		 		});
	    	}
	    	return this.datePicker;
	    },
	    
	    clearDates: function(){
	    	var startDate = this.view.lookupReference('startDate');
			var endDate = this.view.lookupReference('endDate');
			
			startDate.setValue("");
			startDate.time = "";
			
			endDate.setValue("");
			endDate.time = "";
	    }
	});
});
