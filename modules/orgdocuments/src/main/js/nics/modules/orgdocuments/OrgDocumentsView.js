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
define(['iweb/CoreModule','./OrgDocumentsController'], function(Core, ActiveUsersController) {

	return Ext.define('modules.orgdocuments.OrgDocumentsView', {
	 	extend: 'Ext.grid.Panel',

	 	controller: 'orgdocumentscontroller',
	 	
	 	title:  Core.Translate.i18nJSON('Org Documents'),
	 	
        viewConfig: {
            emptyText:  Core.Translate.i18nJSON('There are no documents'),
            markDirty: false
        },
        
        listeners: {
        	selectionchange: 'onSelectionChange'
        },
        
        store: {
        	model: 'modules.orgdocuments.OrgDocumentsModel'
        },
                
        dockedItems: [{
            xtype: 'toolbar',
            dock: 'top',
            layout: {
            	pack: 'start'
            },
            items: [{
            	xtype: 'button',
            	text:  Core.Translate.i18nJSON('Add'),
                tooltip:  Core.Translate.i18nJSON('Add a New Document'),
                reference: 'addButton',
                handler: 'onAddButtonClick'
            },{
                xtype: 'button',
                text:  Core.Translate.i18nJSON('Update'),
                tooltip:  Core.Translate.i18nJSON('Upload a New Version'),
                reference: 'uploadButton',
                handler: 'onUploadButtonClick'
            },{
                xtype: 'button',
                text:  Core.Translate.i18nJSON('Download'),
                tooltip:  Core.Translate.i18nJSON('Download this version of the document'),
                reference: 'downloadButton',
                handler: 'onDownloadButtonClick'
            },{
                xtype: 'button',
                text:  Core.Translate.i18nJSON('Delete'),
                tooltip:  Core.Translate.i18nJSON('Delete all versions of this document.'),
                reference: 'deleteButton',
                handler: 'onDeleteButtonClick'
            }]
        }],

        plugins: [
            Ext.create('Ext.grid.plugin.CellEditing', {
                clicksToEdit: 1
            })
        ],

        listeners: {
            beforeedit: 'onBeforeCellEdit'
        },

        columns: [{
            text:  Core.Translate.i18nJSON('Type'),
            dataIndex: 'display',
            width: 50,
            renderer: function(value, meta, record) {
                var filetype = record.get("filetype");
                var imgUrl = "images/orgdocuments/{0}.png";
                var url;
                if(filetype){
                    if(filetype.indexOf('doc') != -1) {
                        url = Ext.String.format(imgUrl, "WordDoc_icon");
                    }else if(filetype.indexOf('xls') != -1){
                        url = Ext.String.format(imgUrl, "Excel_icon");
                    }else if(filetype.indexOf('pdf') != -1){
                        url = Ext.String.format(imgUrl, "PDF_icon");
                    }
                    if(url) {
                        return '<img height=20 width=20 src=' + url + '></img>';
                    }else{
                        return "";
                    }
                }
            }
        },{
            text:  Core.Translate.i18nJSON('Document Name'),
            dataIndex: 'displayname',
            width: 175
        }, {
            text: 'Version',
            reference: 'created',
            dataIndex: 'created',
            xtype: 'datecolumn',
            format: 'Y-m-d H:i:s',
            width: 150,
            editor: {
                xtype: 'combobox',
                displayField: 'created',
                valueField:'created',
                forceSelection:true,
                editable:false,
                queryMode: 'local',
                allowBLank:false,
                emptyText: Core.Translate.i18nJSON('Select a version...'),
                trackRemoved:false,
                store: {
                    fields:['created', 'filename'],
                    sorters:[{property:'created', direction:'DESC'}]}
            }
        }, {
            text:  Core.Translate.i18nJSON('Description'),
            dataIndex: 'description',
            flex: 1
        }]

	 });
});
