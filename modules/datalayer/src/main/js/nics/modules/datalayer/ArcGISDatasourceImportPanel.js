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
define(["iweb/CoreModule", './ArcGISDatasourceImportController', "nics/modules/UserProfileModule",],
    function(Core, ArcGISDatasourceImportController, UserProfile) {

        var model = Ext.define(null, {
            extend: 'Ext.data.TreeModel',
            idProperty: 'datasourceid',
            fields:[
                'datasourceid', 'displayname', 'internalurl','secure',
                {
                    name: 'layers',
                    persist: false
                }]
        });

        return Ext.define('modules.datalayer.ArcGISDatasourceInputPanel', {
            extend: 'Ext.panel.Panel',
            controller: 'datalayer.arcgisdatasourceimportcontroller',
            config: {
                layout: {
                    type: 'vbox',
                    align: 'stretch'
                }
            },
            items:[{
                xtype: 'treepanel',
                title: Core.Translate.i18nJSON('Data Sources'),
                reference: 'grid',
                rootVisible: false,
                flex: 2,
                store: {               
                    model: model
                },
                columns: [{
                    xtype: 'treecolumn',
                    text: Core.Translate.i18nJSON('Title'),
                    dataIndex: 'displayname',
                    flex: 1,
                    editor: {
                        xtype: 'textfield',
                        allowBlank: false
                    }
                }, {
                    text: 'URL',
                    dataIndex: 'internalurl',
                    flex: 1,

                    editor: {
                        xtype: 'textfield',
                        vtype: 'url',
                        allowBlank: false
                    }
                }],
                tbar: ["->",{
                    text: Core.Translate.i18nJSON('Add Data Source'),
                    baseCls: 'nontb_style',
                    handler: 'onAddDataSourceClick'
                },{
                    text: Core.Translate.i18nJSON('Delete Data Source'),
                    baseCls: 'nontb_style',
                    handler: 'onDeleteDataSourceClick',
                    hidden: !(UserProfile.isSuperUser() || UserProfile.isAdminUser())
                }],
                plugins: [{
                    ptype: 'rowediting',
                    pluginId: 'rowediting',
                    clicksToEdit: 1
                }],
                listeners: {
                    'beforeedit': 'onGridBeforeEdit',
                    'canceledit': 'onGridCancelEdit',
                    'edit': 'onGridEdit',
                    'selectionchange': 'onGridSelectionChange'
                }
            },{
                xtype: 'fieldset',
                reference: 'fieldset',
                title: Core.Translate.i18nJSON('Import from ArcGIS Data Source'),
                margin: '5px',
                padding: '5px',

                layout: {
                    type: 'vbox',
                    align: 'middle'
                },

                items:[{
                    xtype: 'combobox',
                    fieldLabel: Core.Translate.i18nJSON('Layer to import'),
                    reference: 'layerCombo',
                    forceSelection: true,
                    queryMode: 'local',
                    allowBlank: false,
                    allowOnlyWhitespace: false,
                    disabled: true,

                    store: {
                        proxy: {
                            type: 'memory'
                        },
                        fields: ['Title', 'Name']
                    },
                    displayField: 'Title',
                    valueField: 'Name',

                    listeners: {
                        'change': 'onComboChange',
                        'validitychange': 'onFormValidityChange'
                    }
                }, {
                    xtype: 'textfield',
                    fieldLabel: Core.Translate.i18nJSON('Display Name'),
                    reference: 'titleInput',

                    allowBlank: false,
                    allowOnlyWhitespace: false,
                    disabled: true,

                    listeners: {
                        'validitychange': 'onFormValidityChange'
                    }
                }, {
                    xtype: 'textfield',
                    fieldLabel: Core.Translate.i18nJSON('Legend'),
                    reference: 'legendInput',

                    allowBlank: true,
                    disabled: true

                    
                }, {
                    xtype: 'combo',
                    fieldLabel: Core.Translate.i18nJSON('Refresh Rate'),
                    reference: 'refreshRateCombo',
                    queryMode: 'local',
                    store: new Ext.data.SimpleStore({
                        fields: [
                            'value',
                            'text'
                        ],
                        data: [[30, '0:30'],[60, '1:00'], [90, '1:30'], [180, '3:00'], [300, '5:00']]
                    }),
                    valueField: 'value',
                    displayField: 'text',
                    allowBlank: false,
                    disabled: true
                },
                {
                    xtype: 'combo',
                    name: 'orgid',
                    reference: 'orgCombo',
                    fieldLabel: Core.Translate.i18nJSON('Restrict to organization'),
                    valueField: 'orgId',
                    displayField: 'name',
                    queryMode: 'local',
                    store: {
                        sorters: 'name'
                    },
                    forceSelection: true,
                    editable: false,
                    emptyText: 'None',
                    disabled: true
                }, {
                    xtype: 'combo',
                    name: 'collabroomId',
                    reference: 'collabroomCombo',
                    fieldLabel: Core.Translate.i18nJSON('Restrict to room'),
                    valueField: 'collabRoomId',
                    displayField: 'name',
                    queryMode: 'local',
                    disabled: true,
                    forceSelection: true,
                    editable: false,
                    emptyText: 'None',
                    disabled: true
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
                    disabled: true,
                    forceSelection: true,
                    editable: false,
                    emptyText: 'None'
                }, {
                    xtype: 'button',
                    text: Core.Translate.i18nJSON('Import Data Layer'),
                    reference: 'importButton',
                    handler: 'onImportClick',
                    disabled: true
                }]

            }],

            getGrid: function() {
                return	this.lookupReference('grid');
            },

            getFieldSet: function() {
                return	this.lookupReference('fieldset');
            },

            getLayerCombo: function() {
                return	this.lookupReference('layerCombo');
            },

            getLabelInput: function() {
                return	this.lookupReference('titleInput');
            },

            getImportButton: function() {
                return	this.lookupReference('importButton');
            },

            getLegendInput: function() {
                return	this.lookupReference('legendInput');
            },

            getRefreshRateCombo: function() {
                return this.lookupReference('refreshRateCombo');
            },

            getOrgCombo: function() {
                return this.lookupReference('orgCombo');
            },

            getCollabroomCombo: function() {
                return this.lookupReference('collabroomCombo');
            }
        });
    });
