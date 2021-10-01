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
 define(["iweb/CoreModule", './GeotiffImportController'],
	function(Core, GeotiffImportController) {
	 
	return Ext.define('modules.datalayer.GeotiffImportPanel', {
		extend: 'Ext.panel.Panel',
		
		controller: 'datalayer.geotiffimportcontroller',
		
		config: {
			layout: {
				type: 'vbox',
				align: 'stretch'
			}
		},
		
		items:[{
			xtype: 'form',
			title: Core.Translate.i18nJSON('GeoTIFF File Import'),
			reference: 'formPanel',
			buttonAlign : 'center',
			layout: {
				type: 'vbox',
				align: 'center'
			},
			defaults:{
				width: '100%',
				xtype: 'textfield',
				padding: '0 20'
			},
			items:[{
				xtype:'filefield',
				name: 'tifFile',
				fieldLabel: Core.Translate.i18nJSON('Choose a geotiff or zip file to load as a data layer'),
				buttonText: Core.Translate.i18nJSON('Browse'),
				//extension: 'tif,tiff,zip', // TODO: need to implement controller to allow for multiple types
				allowBlank: true
			},{
                xtype:'textfield',
                name: 'filename',
                fieldLabel: Core.Translate.i18nJSON('Absolute path and filename of file on mapserver'),
                allowBlank: true,
                regex: /[^\\/]+\.[zip|tif|tiff]+$/i,
                maskRe: /[\w\d\s\-\.\/:]/i,
                invalidText: 'Must be a file path to a zip or tif file'
            },{
				xtype: 'textfield',
				name: 'displayName',
				fieldLabel: Core.Translate.i18nJSON('Display Name'),
				allowBlank: false
			}, {
				xtype: 'combo',
				name: 'folderid',
				reference: 'folderCombo',
				fieldLabel: Core.Translate.i18nJSON('Upload Folder'),
				valueField: 'folderid',
				displayField: 'foldername',
				queryMode: 'local',
				store: {
					fields: ['folderid', 'foldername'],
					sorters: ['foldername']
				},
				forceSelection: true,
				editable: false,
				emptyText: 'None'
			},{
                xtype: 'checkboxfield',
                name: 'mosaic',
                id: 'mosaic',
                boxLabel: Core.Translate.i18nJSON('Is this a zip containing images to create a mosaic?'),
                allowBlank: true
			}],
			buttons: [{
				text: Core.Translate.i18nJSON('Upload'),
				handler :  'submitForm',
				formBind: true
			}]
		}],
		
		getFormPanel: function() {
			return	this.lookupReference('formPanel');
		}
		
	});
});
