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
define(['./DDGridView', 'iweb/CoreModule', './ArchivedIncidentLookupController', './ArchiveModel',  'iweb/core/FormVTypes'],
		function(DDGridView, Core, ArchivedIncidentLookupController, ArchiveModel) {
	
	return Ext.define('modules.administration.ArchivedIncidentLookup', {
	 
	 	extend: 'Ext.window.Window',
	 	
	 	title: Core.Translate.i18nJSON('Incident Lookup'),
        
	 	layout: {
            type: 'vbox',
            align: 'stretch'
        },
	 	
	 	controller: 'archivedincidentlookupcontroller',
	 	
	 	closeAction : 'hide',
	 	
	 	width: 400,
	 	
	 	height: 400,
	 	
	 	items: [{
	 		xtype:'form',
            layout: 'vbox',
            reference: 'incidentLookupForm',
            items: [{
	        	xtype: 'textfield',
	        	fieldLabel: Core.Translate.i18nJSON('Org Prefix'),
	        	reference: 'orgPrefix',
		        vtype:'simplealphanum',
		        margin: '5 5 5 5'
	        },{
	        	xtype: 'textfield',
	        	fieldLabel: Core.Translate.i18nJSON('Incident Name'),
	        	reference: 'searchInput',
		        vtype:'simplealphanum',
		        margin: '0 5 5 5'
	        },{
	        	xtype: 'checkboxfield',
	        	fieldLabel: Core.Translate.i18nJSON('Time Range'),
	        	reference: 'timeRange',
	        	listeners: {
	        		change: 'onTimeRangeCheck'
	        	}
	        },{
				xtype: 'fieldcontainer',
				layout: 'hbox',
				reference: 'timeRangeFields',
				hidden: true,
				items:[{
					xtype: 'label',
					text: Ext.String.format('{0}:', Core.Translate.i18nJSON('From')),
					margin: '0 5 5 5'
                }, {
					xtype: 'textfield',
					reference: 'startDate',
					width: 75,
					margin: '5 5 5 5',
					readOnly:true
                }, {
					xtype:'button',
					text: '...',
					reference: 'start',
					handler: 'showPicker',
					margin: '5 5 5 5'
                },{
					xtype: 'label',
					text: Ext.String.format('{0}:', Core.Translate.i18nJSON('To')),
					margin: '5 5 5 5'
                }, {
					xtype: 'textfield',
					reference: 'endDate',
					width: 75,
					margin: '5 5 5 5',
					readOnly: true,
                }, {
					xtype:'button',
					text: '...',
					reference: 'end',
					handler: 'showPicker',
					margin: '5 5 5 5'
                },{
					xtype:'button',
					text: Core.Translate.i18nJSON('Clear'),
					handler: 'clearDates',
					margin: '5 5 5 5'
                }]
	        },{
	        	xtype: 'container',
	        	items: [
	        		{
	    	        	xtype: 'checkboxfield',
	    	        	fieldLabel: Core.Translate.i18nJSON('Incident Type'),
	    	        	reference: 'incidentType',
	    	        	listeners: {
	    	        		change: 'onIncidentTypeCheck'
	    	        	}
	    	        },{
	    				xtype: 'combobox',
	    				hidden: true,
	    				reference:'incidentTypeCombo',
	    				store: Ext.create('Ext.data.Store', {
	    				    fields: ['incidentTypeId', 'incidentTypeName']
	    				}),
	    				forceSelection: true,
	    				queryMode: 'local',
	    				fieldLabel: Core.Translate.i18nJSON('Incident Type'),
	    				valueField: 'incidentTypeId',
	    				displayField: 'incidentTypeName',
	    				name: 'incidentType'
	    			}
	        	]
	        },{
	        	xtype: 'checkboxfield',
	        	fieldLabel: Core.Translate.i18nJSON('Archived'),
	        	reference: 'archived'
	        }],
	        
	        buttons: [{
	        		text: Core.Translate.i18nJSON('Search'),
	        		handler: 'findArchivedIncidents'
	        	}]
	 		},{
	        
	            xtype: 'grid',
	            flex:1,
	            reference: 'lookupGrid',
	            
	            store: {
	            	fields: [ "incidentname", "incidentid" ]
		        },
		        
		        autoHeight: true,
		        autoWidth: true,
		        autoScroll: true,
		       
		                
		        columns: [{
		            text: Core.Translate.i18nJSON('Incident'),
		            dataIndex: 'incidentname',
		            flex: 1
		        }],
		        
		        buttons: [{
		        	text: Core.Translate.i18nJSON('Join'),
		        	handler: 'joinIncident'
		        },{
		        	text: Core.Translate.i18nJSON('Clear'),
		        	handler: 'clearGrid'
		        }],
		        selModel: {
		            selType: 'rowmodel',
		            mode   : 'SINGLE'
		        }
	    	}]
	});
});