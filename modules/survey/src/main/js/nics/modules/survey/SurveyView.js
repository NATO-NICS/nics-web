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
define(['ext', 'iweb/CoreModule', './SurveyController'], function(Ext, Core) {
  'use strict';
  // Survey view
  return Ext.define('.SurveyView', {
    extend: 'Ext.form.Panel',
    controller: 'surveycontroller',
    title: 'Reports (Custom)',
    jsonSubmit: true,

    // Fields will be arranged vertically, stretched to full width
    layout: 'anchor',
    bodyPadding: 5,
    defaults: {
      anchor: '100% 99%'
    },

    listeners: {
       'added': function(tabpanel, tab, index, opts) {
           //console.log("GOT onAdded event with index: " + index);
       },

       'focus': function(panel, evt, opts) {
           //console.log("SURVEYTAB got FOCUS");
       },

       'render': function(element, opts) {
           //console.log("SURVEYTAB was rendered");
       },

       'activate': function(panel, opts) {
            //console.log("SURVEYTAB got activated");
       }
   },


    items: [{
      xtype: 'tabpanel',
      margins: '5 5 5 5',
      border: false,
      items: [
        {
            title: 'Reports (Custom)',
            html: '<div id="surveyDiv" style="height:100%"><p style="font:28px bold;color:gray">No Survey Selected</p></div>',
            bodyPadding: '5px',
            layout: 'anchor',
            items: [
                {
                    xtype: 'fieldset',
                    title: 'Fill a Report',
                    anchor: '95%',
                    //layout: 'hbox',
                    layout: 'anchor',
                    style: 'padding: 10px',
                    items: [{
                        xtype: 'combo',
                        id: 'surveyCombo',
                        anchor: '95%',
                        fieldLabel: 'Select a Report',
                        width: '300px',
                        store: Ext.create('Ext.data.Store',
                            {   storeId: 'surveyStore',
                                model: Ext.define('Survey', {
                                    extend: 'Ext.data.Model',
                                    fields: [
                                        {name: 'surveyid', type: 'int'},
                                        {name: 'title', type: 'string'},
                                        {name: 'survey',  type: 'string'},
                                        {name: 'created',       type: 'date'}
                                    ],
                                    sorters: [
                                        {property: 'title', direction: 'ASC'}
                                    ]
                                })
                            }),
                        queryMode: 'local',
                        displayField: 'title',
                        valueField: 'surveyid',
                        emptyText: 'Select a report...',
                        editable: false,
                        forceSelection: true,
                        listeners: {
                            scope: this,
                            select: 'onSurveySelect'
                        }
                    }]
                },
                {
                    xtype: 'container',
                    reference: 'surveyContainer',
                    contentEl: 'surveyDiv',
                    anchor: '100% 90%',
                    scrollable: true,
                    width: '600px',
                    height: '700px'
                }
            ] // end survey tab panel items
        }, // End survey tab panel


        ,{
            title: 'Administration',
            items: [
                {
                    xtype: 'tabpanel',
                    margins: '5 5 5 5',
                    layout: 'anchor',
                    items: [
                        {
                            title: 'Create and Edit Reports',
                            bodyPadding: '5px',
                            //layout: 'anchor',
                            anchor: '95% 99%',
                            scrollable: true,
                            items: [
                                {
                                    xtype: 'fieldset',
                                    title: 'Create and Edit Reports',
                                    anchor: '95%',
                                    layout: 'anchor',
                                    style: 'padding: 10px',
                                    items: [
                                        {
                                            xtype: 'button',
                                            text: 'Create from JSON',
                                            handler: 'onCreateFromJson'
                                        },
                                        {
                                            xtype: 'tbspacer',
                                            align: 'middle',
                                            padding: '10px'
                                        },
                                        {
                                            xtype: 'combo',
                                            id: 'surveyEditorCombo',
                                            reference: 'surveyEditorCombo',
                                            anchor: '95%',
                                            fieldLabel: 'Edit a Survey',
                                            width: '500px',
                                            store: 'surveyStore',
                                            queryMode: 'local',
                                            displayField: 'title',
                                            valueField: 'surveyid',
                                            emptyText: 'Select a report to edit...',
                                            editable: false,
                                            forceSelection: true,
                                            listeners: {
                                                scope: this,
                                                select: 'onSurveyEditSelect'
                                            }
                                        },
                                        {
                                            xtype: 'textarea',
                                            id: 'jsonText',
                                            reference: 'jsonText',
                                            scrollable: true,
                                            height: '700px',
                                            width: '600px'
                                        }
                                    ]
                                },
                                {
                                    xtype: 'container',
                                    reference: 'surveyEditorContainer',
                                    //contentEl: 'surveyEditorDiv',
                                    //anchor: '100% 90%',
                                    scrollable: true,
                                    //width: '600px',
                                    //height: '700px'
                                }
                              ] // end Manage Surveys items
                        },{
                            title: 'Manage Reports and Results',
                            html: '<div class="result-stripe" id="resultDiv">No Results Selected...</div>',
                            layout: 'anchor',
                            bodyPadding: '5px',
                            items: [
                                {
                                    xtype: 'fieldset',
                                    title: 'Delete',
                                    layout: 'hbox',
                                    bodyPadding: '5px',
                                    height: '50px',
                                    items: [
                                        {
                                            xtype: 'combo',
                                            id: 'surveyDeleteCombo',
                                            anchor: '95%',
                                            fieldLabel: 'Delete a Report',
                                            width: '300px',
                                            store: 'surveyStore',
                                            queryMode: 'local',
                                            displayField: 'title',
                                            valueField: 'surveyid',
                                            emptyText: 'Select a report to delete...',
                                            editable: false,
                                            forceSelection: true/*,
                                            listeners: {
                                                scope: this,
                                                select: 'onSurveyDeleteSelect'
                                            }*/
                                        },
                                        {
                                            xtype: 'tbspacer',
                                            align: 'middle',
                                            padding: '10px'
                                        },
                                        {
                                            xtype: 'button',
                                            text: 'Delete',
                                            handler: 'onSurveyDelete'
                                        }
                                    ] // End Delete fieldset items
                                }, // End Delete Fieldset
                                {
                                    xtype: 'fieldset',
                                    title: 'View Submitted Reports',
                                    bodyPadding: '5px',
                                    height: '50px',
                                    items: [
                                        {
                                            xtype: 'container',
                                            layout: 'hbox',
                                            items: [
                                                {
                                                    xtype: 'combo',
                                                    id: 'surveyViewCombo',
                                                    anchor: '95%',
                                                    fieldLabel: 'Select a Report',
                                                    width: '400px',
                                                    store: 'surveyStore',
                                                    queryMode: 'local',
                                                    displayField: 'title',
                                                    valueField: 'surveyid',
                                                    emptyText: 'Select a report to view',
                                                    editable: false,
                                                    forceSelection: true,
                                                    listeners: {
                                                        scope: this,
                                                        select: 'onSurveyViewSelect'
                                                    }
                                                },
                                                {xtype: 'tbspacer', align: 'middle', padding: '10px'},
                                                {
                                                    xtype: 'combo',
                                                    id: 'surveyResultCombo',
                                                    anchor: '95%',
                                                    fieldLabel: 'Result',
                                                    width: '400px',
                                                    store: Ext.create('Ext.data.Store',
                                                       {   storeId: 'resultStore',
                                                           model: Ext.define('SurveyResult', {
                                                               extend: 'Ext.data.Model',
                                                               fields: [
                                                                   {name: 'surveyresultid', type: 'int'},
                                                                   {name: 'surveyid', type: 'int'},
                                                                   {name: 'userid', type: 'string'},
                                                                   {name: 'surveyresult',  type: 'string'},
                                                                   // not loading results into a combo store?
                                                                   {name: 'created', type: 'date', convert: function(v, record){
                                                                            return new Date(v);
                                                                       }}
                                                               ],
                                                               //filters: [] TODO: add surveyid filter
                                                               sorters: [
                                                                   {property: 'userid', direction: 'ASC'}
                                                               ]
                                                           })
                                                       }),
                                                    queryMode: 'local',
                                                    displayField: 'created', // 'userid'
                                                    valueField: 'surveyresultid',
                                                    emptyText: 'Select a result to view...',
                                                    editable: false,
                                                    forceSelection: true,
                                                    listeners: {
                                                        scope: this,
                                                        select: 'onSurveyResultSelect'
                                                    }
                                                },
                                            ]
                                        }

                                    ]
                                }, // End View Survey Results fieldset
                                {
                                    xtype: 'container',
                                    border: true,
                                    cls: 'result-stripe',
                                    //html: '<div style="height:100%" id="resultDiv"/>',
                                    contentEl: 'resultDiv',
                                    reference: 'resultContainer',
                                    //anchor: '100% 95%',
                                    scrollable: true,
                                    width: '600px',
                                    height: '700px'
                                } // End survey view container

                            ] // end Manage Surveys Results items
                        }
                    ]
                } // end inner admin tab panel
            ] // End Administration tab panel
        }
      ]
    }],

    getSurveyContainer: function() {
        return this.lookupReference('surveyContainer');
    },

    getResultContainer: function() {
        return this.lookupReference('resultContainer');
    },

    getSurveyFromJsonText: function() {
        return this.lookupReference('jsonText').getValue();
    }
  });
});