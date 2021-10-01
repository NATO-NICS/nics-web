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
 define(['iweb/CoreModule', './IncidentOrgController'],
 	function(Core, IncidentOrgController) {

 		var ENABLED_GRID_REF = 'enabledOrgGrid';
 		var DISABLED_GRID_REF = 'disabledOrgGrid';

		return Ext.define('modules.incident.IncidentOrgViewer', {
    	
			extend: 'Ext.Window',

		 	controller: 'incidentorgcontroller',
		 	
		 	closable: false,
	        
		 	closeAction: 'hide',
	        
	        //autoWidth: true,
		 	//autoHeight: true,
	        autoScroll: true,
	        height: 400,
	        width: 400,
	        
	        reference: 'incidentOrgView',
	        
	        config: {

		 		layout: {
		            type: 'hbox',
		            align: 'stretch'
		        },
		        defaults: { flex: 1 },
		        title:  Core.Translate.i18nJSON('Organizations')
		 	},

		 	items: [{
		 		xtype: 'grid',
		 		reference: ENABLED_GRID_REF,
		 		multiSelect: true,
		 		viewConfig: {
		 			plugins: {
		 				ptype: 'gridviewdragdrop',
		 				dragGroup: 'enabledGridDDGroup',
		 				dropGroup: 'disabledGridDDGroup'
		 			}
		 		},
		 		store: {
		 			model: 'modules.administrator.OrganizationModel',
		 			sorters: 'name'
		 		},
		 		columns: [
		 			{text: Core.Translate.i18nJSON("Name"), flex: 1, sortable: true, dataIndex: 'name'}
		 		],
		 		stripeRows: true,
		 		title: Core.Translate.i18nJSON('Enabled')
		 	},{
		 		xtype: 'grid',
		 		reference: DISABLED_GRID_REF,
		 		multiSelect: true,
		 		viewConfig: {
		 			plugins: {
		 				ptype: 'gridviewdragdrop',
		 				dragGroup: 'disabledGridDDGroup',
		 				dropGroup: 'enabledGridDDGroup'
		 			}
		 		},
		 		store: {
		 			model: 'modules.administrator.OrganizationModel',
		 			sorters: 'name'
		 		},
		 		columns: [
		 			{text: Core.Translate.i18nJSON("Name"), flex: 1, sortable: true, dataIndex: 'name'}
		 		],
		 		stripeRows: true,
		 		title: Core.Translate.i18nJSON('Disabled')
		 	}],

		 	/*
		 	items:[{
		            xtype: 'grid',
		            reference: 'incOrgGrid',
		            region: 'north',
		            width: 300,
		            height: 300,
		            store: {
			        	model: 'modules.administrator.OrganizationModel',
			        	sorters: 'name'
			        },
			        selModel: {
		            	selType: 'rowmodel',
		            	mode   : 'MULTI'
		        	},
			        columns: [{
			            text:  Core.Translate.i18nJSON('Name'),
			            dataIndex: 'name',
			            flex: 1
			        }, {
			            text:  Core.Translate.i18nJSON('Prefix'),
			            dataIndex: 'prefix'
			    	}]
			    }
		 	],*/

		 	buttons: [
		 		/*{

		 				text:  Core.Translate.i18nJSON('Assign'),
  						reference: 'assignIncOrgBtn',
  						listeners: {
							click:'onUpdateIncOrg'
						}

		 		},{
		 				text:  Core.Translate.i18nJSON('Remove'),
  						reference: 'removeIncOrgBtn',
  						listeners: {
							click:'onUpdateIncOrg'
						}
		 		},*/{
		 				text:  Core.Translate.i18nJSON('Close'),
  						reference: 'cancelIncOrgBtn',
  						listeners: {
							click:'onCancelIncOrg'
						}
		 		}

		 	],
		 	
		 	initComponent: function(){
				this.callParent();
			},
			
			setIncidentId: function(incidentId){
				this.getController().setIncidentId(incidentId);
			},

			setUserId: function(userId){
				this.getController().setUserId(userId);
			},

			getEnabledOrgsGrid: function() {
				return this.lookupReference(ENABLED_GRID_REF);
			},

			getDisabledOrgsGrid: function() {
				return this.lookupReference(DISABLED_GRID_REF);
			},

			getIncOrgs: function(){
				return this.lookupReference(ENABLED_GRID_REF).store.getRange();
			},

			setOnCreate: function(value){
				this.getController().setOnCreate(value);
			},

			loadOrgs: function(){
				this.getController().loadOrgs();
			},

			resetOrgs: function() {
				this.lookupReference(ENABLED_GRID_REF).store.removeAll();
			}
			
		});
	});