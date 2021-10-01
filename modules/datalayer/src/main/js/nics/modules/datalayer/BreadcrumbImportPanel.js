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
define([ "iweb/CoreModule", 'iweb/core/FormVTypes',
		'./BreadcrumbImportController' ], function(Core, FormVTypes) {

	return Ext.define('modules.datalayer.BreadcrumbImportPanel', {
		extend : 'Ext.panel.Panel',

		controller : 'datalayer.breadcrumbimportcontroller',

		/*config : {
			layout : {
				type : 'vbox',
				align : 'stretch'
			},
		},*/
		items : [ {
			xtype : 'form',
			title : Core.Translate.i18nJSON('Mobile Tracking Import'),
			reference : 'formPanel',
			buttonAlign : 'center',
			layout : {
				type : 'vbox',
				align : 'stretch'
			},
			items : [{
						xtype : 'textfield',
						fieldLabel : Core.Translate
								.i18nJSON('Display Name'),
						name : 'displayname',
						reference : 'displayname',
						vtype : 'simplealphanum',
						allowBlank : false,
						allowOnlyWhitespace : false,
						padding : '5 20 0 20'
					},{
						xtype: 'panel',
						collapsible: true,
						title: Core.Translate.i18nJSON('Breadcrumbs'),
						reference: 'breadcrumbPanel',
						layout : {
							type : 'table',
							columns : 3
						},
						listeners: {
							 expand: 'onBreadcrumbExpand',
						},
						padding : '0 20 0 20',
						items: [{
							xtype : 'textfield',
							fieldLabel : Core.Translate.i18nJSON('NICS User'),
							name : 'breadcrumbUser',
							reference : 'breadcrumbsUser',
							vtype : 'simplealphanum',
							padding : '0 0 0 20',
							colspan : 2
						},{
							xtype:'button',
							text: 'Lookup',
							handler: 'lookupSingleUser',
							margin: '5 5 5 5',
							colspan : 1
		                },{
							xtype : 'textfield',
							fieldLabel : Core.Translate.i18nJSON('From'),
							reference: 'startDate',
							vtype : 'simplealphanum',
							padding : '0 0 0 20',
							colspan : 2,
							readOnly:true
						},{
							xtype:'button',
							text: '...',
							reference: 'start',
							handler: 'showPicker',
							margin: '5 5 5 5',
							colspan : 1
		                },{
							xtype : 'textfield',
							fieldLabel : Core.Translate.i18nJSON('To'),
							reference: 'endDate',
							vtype : 'simplealphanum',
							padding : '0 0 0 20',
							colspan : 2,
							readOnly:true
						}, {
							xtype:'button',
							text: '...',
							reference: 'end',
							handler: 'showPicker',
							margin: '5 5 5 5',
							colspan : 1
		                },{
							xtype : 'textfield',
							fieldLabel : Core.Translate.i18nJSON('Hours Past'),
							name : 'hoursPast',
							reference : 'hoursPast',
							vtype : 'simplealphanum',
							disabled: true,
							padding : '0 0 0 20',
							colspan : 2
						},{ 
							xtype: 'checkbox',
							padding: '0 0 0 10',
							reference: 'hoursPastCheckbox',
							listeners: {
								change: "onHoursPast"
							}
		    			},{
							xtype: 'checkbox',
							boxLabel: Core.Translate.i18nJSON('Segment'),
							padding: '0 0 0 20',
							reference: 'segmentCheckbox',
							colspan: 2
						},,{
							xtype: 'tbspacer',
							colspan: 1
						},{
							xtype: 'checkbox',
							boxLabel: Core.Translate.i18nJSON('Style'),
							padding: '0 0 0 20',
							reference: 'pointStyleCheckbox',
							listeners: {
								change: "onPointStyle"
							},
							colspan: 1
						},{
							xtype: 'radiogroup',
							reference: 'segmentStyle',
							padding : '0 0 0 20',
							columns: 2,
							vertical: true,
							disabled: true,
							items: [
								{ boxLabel: Core.Translate.i18nJSON('Point'), name: 'type', inputValue: 'point.png', padding: '0 20 0 17' },
								{ boxLabel: Core.Translate.i18nJSON('Arrow'), name: 'type', inputValue: 'arrow.png' }
							]
						}],
		                buttons : [{
							text : Core.Translate.i18nJSON('Upload'),
							reference : 'uploadbutton',
							handler : 'onUploadBreadcrumbs',
							formBind : true,
							disabled : true
						}]
					 },{
						 xtype: 'form',
						 collapsible: true,
						 title: Core.Translate.i18nJSON('Tracking Team'),
						 reference: 'trackingPanel',
						 layout : {
							type : 'vbox',
							align : 'stretch'
						 },
						 padding : '0 20 0 20',
						 listeners: {
							 expand: 'onTrackingExpand',
						 },
						 collapsed: true,
						 items:[{
					        xtype: 'grid',
				            reference: 'mobileUsers',
				            store: {
				            	fields: ['username', 'firstName', 'lastName', 'userId']
					        },
					        
					        height: 170,
					       
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
					        colspan : 3,
						    buttons:[{
								text : 'Lookup',
								handler : 'addMobileUser'
						    },{
								text : 'Clear',
								handler : 'clearMobileGrid'
						    }]
						},{
							xtype:'filefield',
							name: 'fileName',
							reference: 'trackingIcon',
							fieldLabel: Core.Translate.i18nJSON('Add Team Icon'),
							buttonText: Core.Translate.i18nJSON('Browse'),
							colspan: 3
						}],
						buttons : [{
							text : Core.Translate.i18nJSON('Upload'),
							reference : 'uploadbutton',
							handler : 'beforeUploadTeam',
							formBind : true,
							disabled : true
						}]
					  }]
		}]
	});
});
