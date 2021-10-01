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
define(['iweb/CoreModule','./TimelineController'],
    function(Core, TimelineController) {

        return Ext.define('modules.whiteboard.TimelineView', {

            extend: 'Ext.panel.Panel',

            controller: 'timelinecontroller',

            initComponent: function(){

                this.callParent();
            },

            config: {
                layout: 'border',
                maskElement: 'body'
            },

            listeners: {
                'afterlayout': 'onPanelLayout'
            },

            items: [{
                xtype: 'label',
                reference: 'timelineLabel',
                region: 'north',
                text: ''
            },{
                xtype: 'button',
                region:'west',
                text: 'Previous',
                listeners: {
                    click: 'onPrevBtnHandler'
                },
                margin: '5'
            },{
                xtype: 'slider',
                region: 'center',
                value: 0,
                minValue: 0,
                maxValue: 0,
                reference: 'timelineSlider',
                listeners: {
                    change: 'onSliderChange'
                },

                //TODO: Move to css
                style: {
                    // overflow: 'auto',
                    backgroundColor: 'white',
                    width: '90%',
                    align: 'center'
                },
                margin: '5'
            }, {
                xtype: 'button',
                region: 'east',
                text: 'Next',
                listeners: {
                    click: 'onNextBtnHandler'
                },
                margin: '5'
            }],

            getSlider: function() {
                return this.lookupReference('timelineSlider');
            },

            getLabel: function() {
                return this.lookupReference('timelineLabel');
            }
        });
    });
