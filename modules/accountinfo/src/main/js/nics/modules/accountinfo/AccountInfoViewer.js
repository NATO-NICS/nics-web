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
 define(['iweb/CoreModule', './AccountInfoController', './ChangeOrgViewer',  'iweb/core/FormVTypes' ], 

 	function(Core, AccountInfoController, ChangeOrgViewer) {
 	
		Ext.define('modules.accountinfo.AccountInfoViewer', {
			extend: 'Ext.Button',
		
			controller: 'accountinfocontroller',

			requires: [ 'Ext.Panel', 'Ext.Button', 'Ext.form.TextField', 'Ext.Container' ],
			
			referenceHolder: true,

			initComponent: function(){

				this.accountInfoButton = this.addMenuItem(
						Core.Translate.i18nJSON('Account Information'), "accountInfoButton");

				this.menu.add(this.accountInfoButton);
				/*this.changeOrgButton= this.addMenuItem(
						Core.Translate.i18nJSON('Change Organization'), "changeOrgButton");
				this.menu.add(this.changeOrgButton);*/

				this.userAccountTab = Ext.create('Ext.form.Panel', {
				    title: Core.Translate.i18nJSON('User Account Info'),
					layout: 'anchor',
					bodyPadding: 10,
					referenceHolder: true,
				    defaults: {
				        anchor: '100%'
				    },
				    
				        
				    defaultType: 'textfield',
				    items: [{
				        fieldLabel: Core.Translate.i18nJSON('Username'),
				        name: 'username',
				        xtype: 'displayfield'
				    },
				    {
				        fieldLabel: Core.Translate.i18nJSON('First Name'),
				        name: 'firstname',
				        vtype:'simplealphanum'
				    },
				    {
				        fieldLabel: Core.Translate.i18nJSON('Last Name'),
				        name: 'lastname',
				        vtype:'simplealphanum'
				    },
				    
				    {
				        fieldLabel: Core.Translate.i18nJSON('Organization'),
				        name: 'org',
				        xtype: 'displayfield'
				    },
				    {
				        fieldLabel: Core.Translate.i18nJSON('Job Title'),
				        name: 'job',
				        vtype:'simplealphanum'
				    },
				    
				    {
				        fieldLabel: Core.Translate.i18nJSON('Rank'),
				        name: 'rank',
				        vtype:'simplealphanum'
				    },
				   {
				        fieldLabel: Core.Translate.i18nJSON('Job Description'),
				        name: 'desc',
				        vtype:'simplealphanum'
				    },
				    {
 				    	 xtype: 'combobox',
				    	 fieldLabel: Core.Translate.i18nJSON('Preferred Language'),
				    	 name:'languageList',
				    	 reference:'languageList',
		            	 displayField: 'language',
		            	 valueField:'code',
		            	 forceSelection:true,
		            	 editable:false,
		            	 queryMode: 'local',
		            	 allowBLank:false,
		            	 emptyText: Core.Translate.i18nJSON('Select a language...'),
		            	 trackRemoved:false,

		            	 store: {fields:['code', 'language'], sorters:[{property:'language', direction:'ASC'}]}
				    },
				    {
				    	xtype: 'component',
				    	html: Ext.String.format("<a href={0} target={1}>Reset Password</a>", 
				    			Ext.String.format("https://{0}/auth/realms/NICS/account/password", Core.Config.getProperty("nics.idam.server")),
				    			"_blank"),
				        listeners: {
				            element: 'el',
				            delegate: 'a'
				        }
				    	
				    }
				    ],
				    buttons: [{
				    	 text: Core.Translate.i18nJSON('Submit'),
				    	 reference: 'submitButton'
				    }],
				    
				    getSubmitButton: function(){
						return this.lookupReference('submitButton');
					}
				});
				
				this.userLanguageComboBox = Core.UIBuilder.buildComboBox(
						"language", "Preferred Language", 135, ['languageCode', 'language'], {valueField: 'languageCode', displayField: 'language',  allowBlank: true, typeAhead: true });

				this.userContactTab = Ext.create('Ext.grid.Panel', {
						title: Core.Translate.i18nJSON('User Contact Info'),
						store:{
							model:'modules.accountinfo.AccountInfoModel'
						},
						referenceHolder: true,
						selType: 'rowmodel',
						columns: [
						 	{
						 		text:  Core.Translate.i18nJSON('Contact Type'),
					            dataIndex: 'contacttypeid',
					            editor:{
					            	xtype:'combobox',
					            	allowBlank: false,
					            	editable: false,
					            	store: Ext.create('Ext.data.Store', {
									    fields: ['contacttypeid', 'type'],
									    data : [
									         {'contacttypeid':0, 'type': Core.Translate.i18nJSON('Email')},
									        {'contacttypeid':1, 'type': Core.Translate.i18nJSON('Home Phone')},
									        {'contacttypeid':2, 'type': Core.Translate.i18nJSON('Cell Phone')},
									        {'contacttypeid':3, 'type': Core.Translate.i18nJSON('Office Phone')},
									        {'contacttypeid':4, 'type': Core.Translate.i18nJSON('Radio Number')},
									        {'contacttypeid':5, 'type': Core.Translate.i18nJSON('Other Phone')}
									    ]
									}),
									valueField: 'contacttypeid',
									displayField: 'type'
									
					            }
					        },{
					            text: Core.Translate.i18nJSON('Value'),
					            dataIndex: 'value',
					            width: 150,
					            editor:{
					            	xtype: 'textfield',
                					allowBlank: false,
                					vtype:'simplealphanum'
					            }
					        }
					       ],
				   buttons: [{
 						text:  Core.Translate.i18nJSON('Add'),
  						reference: 'addButton'
  				
    				 },
    				 {
    					  text:  Core.Translate.i18nJSON('Delete'),
    					  reference: 'deleteButton'
    				 }],
				   	plugins:[{
							ptype: 'rowediting',
							pluginId: 'contactRowEditing',
							cancelBtnText : Core.Translate.i18nJSON('Cancel'),
							saveBtnText:Core.Translate.i18nJSON('Update'),
							errorsText:Core.Translate.i18nJSON('Errors'),
							blankText:Core.Translate.i18nJSON('This field is required'),
							listeners:{
								beforeedit: function(editor, context){
									var record = context.record;
									return record.phantom;
								},
								canceledit: function(editor, context) {
									var record = context.record;
									context.store.remove(record);
								},
								validateedit: function(editor, context) {
									Core.EventManager.fireEvent('nics.user.contact.validate',context);
								}
							}
					}],

					
					getAddButton: function(){
						return this.lookupReference('addButton');
					},
					
					getDeleteButton: function(){
						return this.lookupReference('deleteButton');
					}
					
				});
				

				this.accountInfoTabs = Ext.create('Ext.tab.Panel', {
					height: 475,
				    bodyBorder: false,
				    border: false,
				    items: [this.userAccountTab, this.userContactTab]
				});
				this.organizationInfoTabs = Ext.create('Ext.tab.Panel', {
					height: 475,
				    bodyBorder: false,
				    border: false,
				    items: [new ChangeOrgViewer()]
				});
				 

				this.accountWindow = Ext.create('Ext.window.Window',{
					title: Core.Translate.i18nJSON('User Account Info'),
					cls: 'account-info-window',
					layout : 'form',
					minimizable : false,
					closable : true,
					maximizable : false,
					resizable : false,
					draggable : true,
					constrainHeader: true,
					height: 515,
					width: 450,
					closeAction: 'hide',
					buttonAlign: 'center',
			    	items: [
				    		this.accountInfoTabs
				    ]
				});	
				 	
				this.organizationWindow = Ext.create('Ext.window.Window',{
					cls: 'account-info-window',
					layout : 'form',
					minimizable : false,
					closable : true,
					maximizable : false,
					resizable : false,
					draggable : true,
					constrainHeader: true,
					height: 515,
					width: 450,
					closeAction: 'hide',
					buttonAlign: 'center',
			    	items: [
				    		this.organizationInfoTabs
				    ]
				});	
			

				this.callParent();
			},
	
			config: {
				text : '',
				cls: 'accountinfo-btn',
			
				menu : {
					xtype : 'menu',
					cls: 'accountinfo-menu',
					forceLayout : true,
					autoWidth: true
				},
				baseCls: 'nontb_style'
			},
			
			addMenuItem: function(label, id){
			
				var config = {
					text: label,
					id:id
				};
				
				var newItem = Ext.create('Ext.menu.Item',config);
				
				return this.menu.add(newItem);
			},
			
			setButtonLabel: function(name){
				this.setText(name);
			},
	
			setFormField: function(field, value){
				this.userAccountTab.getForm().findField(field).setValue(value);

			}
			

		});
});
