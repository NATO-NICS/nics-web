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
define(['iweb/CoreModule','./StreamingResultsController'], function(Core) {

	return Ext.define('modules.streaming-report.StreamingResultsView', {
	 	extend: 'Ext.Panel',

	 	controller: 'streamingresultscontroller',
	 	
	 	title:  Core.Translate.i18nJSON('Streams'),

        items:[
            {
              xtype: 'container',
              requires: ['Ext.resizer.Splitter', 'Ext.layout.container.VBox', 'Ext.panel.Panel'],
              layout: {
                  type: 'vbox',
                  align: 'stretch'
              },
              items: [{
                  xtype: 'panel',
                  collapsible: true,
                  resizable : true,
                  height: 200,
                  items: [
                      {
                          xtype: 'container',
                          layout: {
                              type: 'hbox',
                              defaultMargins: 8,
                              align: 'stretch'
                          },
                          padding: '5px',
                          items: [
                              {
                                  xtype: 'button',
                                  text: "Refresh",
                                  tooltip: "Fetch latest streams",
                                  handler: 'populateStreams'
                              }, {
                                  xtype: 'button',
                                  text: "Deselect",
                                  tooltip: "Deselect stream and reset viewing window",
                                  handler: 'doDeselect'
                              }, {
                                  xtype: 'button',
                                  text: "Add",
                                  tooltip: "Add a stream",
                                  handler: 'showAdd'
                              }, {
                                  xtype: 'button',
                                  text: "Delete",
                                  tooltip: "Delete a stream",
                                  handler: 'deleteStream'
                              }
                          ]
                      }, {
                          xtype: 'gridpanel',

                          viewConfig: {
                              emptyText: Core.Translate.i18nJSON('There are no active results')
                          },

                          listeners: {
                              selectionchange: 'onSelectionChange',
                              itemdblclick: 'onDoubleClick'
                          },

                          reference: 'streamGrid',

                          autoScroll: true,

                          scrollable: true,

                          height: '90%',

                          store: {
                              model: 'modules.report-streaming.StreamingResultsModel'
                          },

                          columns: [{
                              text: Core.Translate.i18nJSON('Stream Id'),
                              dataIndex: 'msid',
                              hidden: true,
                              hideable: false
                          }, {
                              text: Core.Translate.i18nJSON('Title'),
                              dataIndex: 'title',
                              width: 120
                          }, {
                              text: Core.Translate.i18nJSON('URL'),
                              dataIndex: 'url',
                              flex: 1
                          }]
                      }
                  ]
              }, {
                  xtype: 'splitter',
                  collapseTarget: 'prev'
              }, {
                  xtype: 'panel',
                  collapsible: true,
                  resizable : true,
                  height: '100%',
                  items: [
                      {
                          xtype: 'panel',
                          reference: 'detailsPanel',
                          html: '<h1>Select a stream</h1>',
                          height: '90%',
                          viewConfig: {
                              emptyText: Core.Translate.i18nJSON('There are no active results')
                          }
                      }]
                  }
              ]
            }]
        }

        );
});
