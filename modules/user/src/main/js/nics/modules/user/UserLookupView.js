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
define(['iweb/CoreModule','./DDGridView', './UserLookupController', './UserModel',  'iweb/core/FormVTypes'],
		function(Core, DDGridView, UserLookupController, UserModel) {
	
	return Ext.define('modules.user.UserLookupView', {
	 
	 	extend: 'Ext.window.Window',
	 	
	 	title: Core.Translate.i18nJSON('User Lookup'),
        
	 	layout: {
            type: 'vbox',
            align: 'stretch'
        },
	 	
	 	controller: 'userlookupcontroller',
	 	
	 	closeAction : 'hide',
	 	
	 	width: 400,
	 	
	 	height: 400,
	 	
	 	items: [{
	 		xtype:'form',
            layout: 'vbox',
            reference: 'userLookupForm',
            bodyPadding: 5,
            width: 375,
            items: [{
	            xtype: 'fieldcontainer',
	            fieldLabel: Core.Translate.i18nJSON('Search Type'),
	            reference: 'searchTypes',
	            width: 300,
	            defaultType: 'radiofield',
	            defaults: {
	                flex: 1
	            },
	            layout: 'hbox',
	            items: [
	                {
				        xtype: 'radiogroup',
				        items: [
				            { 
				            	boxLabel: Core.Translate.i18nJSON('Exact'), 
				            	name: 'rb', 
				            	reference: 'exact' 
				            },{ 
				            	boxLabel: Core.Translate.i18nJSON('Contains'), 
				            	name: 'rb', 
				            	reference: 'contains'
				            }
				        ]
				    }
	            ]
	        },{
	        	xtype: 'textfield',
	        	fieldLabel: Core.Translate.i18nJSON('First Name'),
	        	reference: 'firstName',
		        vtype:'simplealphanum'
	        },{
	        	xtype: 'textfield',
	        	fieldLabel: Core.Translate.i18nJSON('Last Name'),
	        	reference: 'lastName',
		        vtype:'simplealphanum'
	        },{
	            xtype: 'fieldcontainer',
	            fieldLabel: Core.Translate.i18nJSON('Orgs'),
	            layout: 'hbox',
	            width: 370,
	            items: [
	            	{
	    				xtype: 'combobox',
	    				disabled: true,
	    				fieldStyle: {
	    					'textAlign':'center'
	    				},
	    				listConfig: {
	    					style: {
	    						'textAlign':'center'
	    					}
	    				},
	    				store: {
	    					fields: ['orgId', 'name'],
	    					sorters: ['name']
	    				},
	    				forceSelection: true,
	    				queryMode: 'local',
	    				displayField: 'name',
	    				valueField: 'orgid',
	    				reference: 'orgs'
	    			},{ 
						xtype: 'checkbox',
						padding: '0 0 0 10',
						reference: 'orgCheckbox',
						listeners: {
							change: "onOrgLookup"
						}
	    			}
	            ]
	        }],
	        
	        buttons: [{
	        		text: Core.Translate.i18nJSON('Search'),
	        		handler: 'findUsers'
	        	}]
	 		},{
	        
	            xtype: 'grid',
	            flex:1,
	            reference: 'lookupGrid',
	            
	            store: {
	            	fields: ['username', 'firstName', 'lastName', 'userId']
		        },
		        
		        autoHeight: true,
		        autoWidth: true,
		        autoScroll: true,
		       
		                
		        columns: [{
		            text: Core.Translate.i18nJSON('Username'),
		            dataIndex: 'username',
		            flex: 1
		        },{
		            text: Core.Translate.i18nJSON('First Name'),
		            dataIndex: 'firstName',
		            flex: 1
		        },{
		        	text: Core.Translate.i18nJSON('Last Name'),
		            dataIndex: 'lastName'
		        }],
		        
		        buttons: [{
		        	text: Core.Translate.i18nJSON('Add Users'),
		        	handler: 'addSelectedUsers'
		        },{
		        	text: Core.Translate.i18nJSON('Clear'),
		        	handler: 'clearGrid'
		        }],
		        selModel: {
		            selType: 'rowmodel',
		            mode   : 'MULTI'
		        }
	    	}]
	});
});