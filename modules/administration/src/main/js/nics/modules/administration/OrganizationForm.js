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
 define(['iweb/CoreModule','./OrganizationViewModel', './OrganizationFormController', 'iweb/modules/geocode/AbstractPanel'], function(Core, OrgModel) {
	return Ext.define('modules.administraton.OrganizationForm', {
	    
		extend: 'modules.geocode.AbstractPanel',
		    	    
	    controller: 'orgformcontroller',
	    
	    buttonAlign: 'center',
	    
	    collapsible: true,
	    
	    title: Core.Translate.i18nJSON('Details'),
	    
	    autoHeight: true,
	    
	    autoWidth: true,
	    
	    reference: 'orgFormPanel',
	    
	    defaults: {
    	    scrollable: true,
            bodyPadding: 5,
            border: false
	    },
	    
	    dockedItems: [{
            xtype: 'toolbar',
            dock: 'top',
            layout: {
            	pack: 'start'
            },
            items: [{
            	xtype: 'button',
            	text: Core.Translate.i18nJSON('New'),
            	hidden: false, //Allow admins to create orgs
            	reference: 'newButton',
    			handler: 'clearForms'
            },{
            	xtype: 'button',
            	text: Core.Translate.i18nJSON('Locate'),
            	reference: 'locateButton',
    			toggleHandler: 'onLocateToggle',
    			enableToggle: true
            },{
            	xtype: 'button',
            	text: Core.Translate.i18nJSON('Add Users'),
            	disabled: true,
            	reference: 'addUsersButton',
    			handler: 'onAddUsers'
            }]
        }],
	    
	    referenceHolder: true,
	    
	    layout: 'hbox',
	    
	    items:[{
	    	xtype: 'form',
	    	viewModel: {
		       type: 'organizationview'
		    },
		    reference: 'orgForm',
	    	layout: 'form',
		    defaultType: 'textfield',
		    width: '60%',
	    	items: [{
		    	hidden: true,
		    	bind: '{orgId}'
		    },{
		    	fieldLabel: Core.Translate.i18nJSON('Name'),
		    	bind: '{name}'
		    },{
		    	fieldLabel: Core.Translate.i18nJSON('County'),
		    	bind: '{county}'
		    },{
		    	fieldLabel : Core.Translate.i18nJSON('State'),
		        bind: '{state}'
		    },{
		    	fieldLabel: Core.Translate.i18nJSON('Prefix'),
		    	bind: '{prefix}'
		    },{
		    	fieldLabel: Core.Translate.i18nJSON('Distribution List'),
		    	bind: '{distribution}'
		    },{
				xtype: 'combobox',
				fieldLabel: Core.Translate.i18nJSON('Country'),
				reference:'country',
				displayField: 'name',
				valueField:'countryId',
				bind:'{countryId}',
				forceSelection:true,
				editable:true,
				queryMode: 'local',
				emptyText: Core.Translate.i18nJSON('Select a country...'),
				trackRemoved:false,
				store: {fields:['countryCode', 'countryId', 'name'],
					sorters:[{property:'name', direction:'ASC'}]}
			},{
	    		xtype: 'textfield',
	    		fieldLabel: Core.Translate.i18nJSON('Default Latitude'),
	    		bind: '{defaultlatitude}'
	    	},{
	    		xtype: 'textfield',
	    		fieldLabel: Core.Translate.i18nJSON('Default Longitude'),
	    		bind: '{defaultlongitude}'
	    	},{
	    		xtype: 'combobox',
	    		 fieldLabel: Core.Translate.i18nJSON('Preferred Language'),
		    	 reference:'languageList',
            	 displayField: 'language',
            	 valueField:'code',
            	 bind:'{defaultlanguage}',
				 forceSelection:true,
				 editable:true,
            	 queryMode: 'local',
            	 emptyText: Core.Translate.i18nJSON('Select a language...'),
            	 trackRemoved:false,
            	 store: {fields:['code', 'language'], sorters:[{property:'language', direction:'ASC'}]}
			},{
				xtype: 'displayfield',
				fieldLabel: Core.Translate.i18nJSON('Parent Organization'),
				hidden: 'true',
				reference: 'parentName'
			},{
				xtype: 'combobox',
				fieldLabel: Core.Translate.i18nJSON('Parent Organization'),
				reference:'parentorganization',
				displayField: 'name',
				valueField:'orgId',
				bind:'{parentorgid}',
				forceSelection:true,
				editable:true,
				queryMode: 'local',
				emptyText: Core.Translate.i18nJSON('Parent Organization...'),
				trackRemoved:false,
				store: {fields:['name', 'orgId'], sorters:[{property:'name', direction:'ASC'}]}
			},{
				xtype: 'checkboxfield',
				fieldLabel: Core.Translate.i18nJSON('Restrict Incidents?'),
				reference: 'restrictincidents',
				checked: true
			},{
				xtype: 'checkboxfield',
				fieldLabel: Core.Translate.i18nJSON('Create Incident Requires Admin?'),
				reference: 'createincidentrequiresadmin',
				checked: false
			}]
	    },{
	    	xtype: 'checkboxgroup',
	    	title: Core.Translate.i18nJSON('Organization Types'),
	    	reference: 'orgTypeForm',
	    	defaultType: 'checkbox',
	    	layout: {
    	        type: 'table',
    	        columns: 2
    	    },
    	    items: []
	    }],
	    
	    buttons: [{
	        	text: Core.Translate.i18nJSON('Submit'),
	        	reference: 'submitButton',
		        handler: 'submitForm',
		        disabled: false //Allow admins to create new orgs
	    		},{
	        	text: Core.Translate.i18nJSON('Cancel'),
		        handler: 'cancelForm'
		     }]
	     });
});