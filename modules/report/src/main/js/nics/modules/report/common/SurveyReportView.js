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
define(['iweb/CoreModule','./SurveyReportController', './SurveyReportModel'],
    function(Core, SurveyReportController, SurveyReportModel) {

        return Ext.define('modules.report.common.SurveyReportView', {
            extend: 'Ext.panel.Panel',

            controller: 'surveyreportcontroller',

            autoDestroy: true,

            header: false,

            title: 'CustomReport',
            surveyDiv: null,

            reportType: null,
            surveyList: null,
            surveyCreate: null,
            surveyView: null,


            getReportType: function() {
                return this.reportType;
            },

            getLoadEvt: function() {
                return this.loadEvt;
            },

            getIncidentId: function() {
                return this.incidentId;
            },

            getSurveyDiv: function() {
                return this.surveyDiv;
            },

            viewConfig: {
                emptyText: 'There are no reports'
            },

            viewModel: {
                type: 'surveyresult'
            },

            initComponent: function() {
                //console.log("INIT component in SurveyReportView...." + this.reportType);
                this.surveyList = 'surveyList'+this.reportType;
                this.surveyCreateButton = 'createButton'+this.reportType;
                this.surveyViewButton = 'viewButton'+this.reportType;
                this.surveyContainer = 'surveyContainer';//+this.reportType;

                this.dockedItems = [{
                    xtype: 'toolbar',
                    dock: 'top',
                    layout: {
                        pack: 'end'
                    },
                    items: [{
                        xtype: 'combobox',
                        reference: this.surveyList,
                        displayField: 'requestDate', // TODO:itft can change to a real field/date... the buildReportData did this
                        valueField: 'formId',
                        forceSelection: true,
                        editable: false,
                        queryMode: 'local',
                        allowBLank: false,
                        width: 250,
                        emptyText: Core.Translate.i18nJSON('Select a report...'),
                        trackRemoved: false,
                        store: {
                            sorters:[{property:'requestDate', direction:'DESC'}]
                        },
                        listeners: {
                            select: 'onReportSelect'
                        }
                    },{
                        xtype: 'tbfill'
                    }, {
                        xtype: 'button',
                        text: Core.Translate.i18nJSON('New'),
                        tooltip: Core.Translate.i18nJSON('Create or Update Report'),
                        reference: this.surveyCreateButton,
                        listeners: {
                            click: 'onAddReport'
                        }
                    },{
                        xtype: 'button',
                        text: Core.Translate.i18nJSON('View'),
                        tooltip: Core.Translate.i18nJSON('View Report'),
                        reference: this.surveyViewButton,
                        listeners: {
                            click: 'onViewSurvey'
                        }
                    }]
                }];

                this.initDockingItems();

                /*this.items = [
                    {
                        xtype: 'container',
                        reference: this.surveyContainer, //'surveyContainer',
                        contentEl: this.surveyDiv, //'surveyDiv',
                        anchor: '100% 90%',
                        scrollable: true,
                        //width: '600px',
                        height: '700px'
                    }];
                this.initItems();*/

                this.callParent();
            },


            listeners: {
                //selectionchange: 'onSelectionChange'
            },
            //reference: 'surveyReportPanel',
            autoScroll: true,
            referenceHolder: true,
            bodypadding: 10,
            /*dockedItems: [{
                xtype: 'toolbar',
                dock: 'top',
                layout: {
                    pack: 'end'
                },
                items: [{
                    xtype: 'combobox',
                    reference: this.surveyList,
                    displayField: 'requestDate', // TODO:itft can change to a real field/date... the buildReportData did this
                    valueField: 'formId',
                    forceSelection: true,
                    editable: false,
                    queryMode: 'local',
                    allowBLank: false,
                    width: 350,
                    emptyText: 'Select a report...',
                    trackRemoved: false,
                    store: {
                        sorters:[{property:'requestDate', direction:'DESC'}]
                    },
                    listeners: {
                        select: 'onReportSelect'
                    }
                },{
                    xtype: 'tbfill'
                }, {
                    xtype: 'button',
                    text: 'New',
                    id: 'createSurveyReport',
                    tooltip: 'Create/Update Report',
                    reference: 'createButton',
                    listeners: {
                        click: 'onAddReport'
                    }
                },{
                    xtype: 'button',
                    text: 'View',
                    tooltip: 'View Report',
                    id:'viewSurvey',
                    reference: 'viewButton',
                    listeners: {
                        click: 'onViewSurvey'
                    }
                }]
            }],*/
            items:[
                {
                    xtype: 'container',
                    reference: 'surveyContainer',
                    html: '<h1>' + Core.Translate.i18nJSON('No Report Selected') + '</h1>',
                    contentEl: this.surveyDiv,
                    anchor: '100% 90%',
                    scrollable: true
                }]
        });
    });