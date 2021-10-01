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
define([ 'iweb/CoreModule','./CollabRoomDatalayerController', './CollabRoomDatalayerModel'], function(Core) {

	return Ext.define('modules.collabroom.CollabRoomDatalayerView', {
	 	extend: 'Ext.grid.Panel',

	 	controller: 'collabroomdatalayercontroller',
	 	
	 	title:  Core.Translate.i18nJSON('Room Layers'),

		viewConfig: {
			markDirty: false,
            emptyText:  Core.Translate.i18nJSON('There are no layers associated with this room')
        },
        
        store: {
        	model: 'modules.collabroom.CollabRoomDatalayerModel',
        	sorters: 'displayname',
        	proxy: {
        		type: 'memory'
        	}
        },
        
        dockedItems: [{
            xtype: 'toolbar',
            dock: 'top',
            layout: {
            	pack: 'start'
            },
            items: [{
            	xtype: 'button',
            	text:  Core.Translate.i18nJSON('Remove'),
                tooltip:  Core.Translate.i18nJSON('Remove selected datalayers from displaying in the current room'),
                handler: 'onRemoveButtonClick'
            }]
        }],

		plugins: {
			ptype: 'cellediting',
			clicksToEdit: 1
		},

		listeners: {
			cellclick: 'onCellClick',
			edit: 'onCellEdit'
		},
	 	
        columns: [ {
        	text:  Core.Translate.i18nJSON('View'),
        	dataIndex: 'display',
        	width: 50,
			renderer: function(value, meta, record) {
				if(record.get("view") === true){
					return '<img height=20 width=20 src="images/collabroom/bullet_green.png"/>';
				}
				return '<img height=20 width=20 src="images/collabroom/bullet_red.png"/>';
			}
        },{
			text:  Core.Translate.i18nJSON('Hazard'),
			dataIndex: 'display',
			width: 50,
			renderer: function(value, meta, record) {
				if(!Ext.isEmpty(record.get("hazard")) &&
					!Ext.isEmpty(record.get("hazard").radius)){
					return '<img height=20 width=20 src="images/collabroom/bullet_green.png"/>';
				}else if(record.get("layerType") == "wfs") {
					return '<img height=20 width=20 src="images/collabroom/bullet_red.png"/>';
				}else{
					return "N/A";
				}
			}
		},{
            text:  Core.Translate.i18nJSON('Datalayer'),
            dataIndex: 'displayname',
            flex: 1
        },{
			text: 'Opacity',
			reference: 'opacity',
			dataIndex: 'opacity',
			width: 150,
			renderer: function(value){
				return Ext.String.format('{0}%', value * 100);
			},
			editor: {
				xtype: 'slider',
				labelAlign: 'top',
				labelClsExtra: "x-menu-item-text-default",
				decimalPrecision: 1,
				increment: 0.1,
				minValue: 0.1,
				maxValue: 1,
				tipText: function(thumb) {
					return Ext.String.format('{0}%', thumb.value * 100);
				}
			}
		},{
			text:  Core.Translate.i18nJSON('Mobile'),
			dataIndex: 'enablemobile',
			width: 50,
			renderer: function(value, meta, record) {
				var enablemobile = record.get("enablemobile");
				if(enablemobile === true){
					return '<img height=20 width=20 src="images/collabroom/bullet_green.png"/>';
				}
				return '<img height=20 width=20 src="images/collabroom/bullet_red.png"/>';
			}
		}],
        
	 	selModel: {
	          selType: 'checkboxmodel',
	          showHeaderCheckbox: true,
	          checkOnly: true
	    }

	 });
});
