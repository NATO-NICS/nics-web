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
define(["ext", "iweb/CoreModule", "./SearchConeController"], function(Ext, Core, SearchConeController) {
	return Ext.define(null, {
		extend: 'Ext.Window',
		
		controller: 'feature.searchconecontroller',

		title: Core.Translate.i18nJSON("Draw Search Cone"),
		message: "",
		cls:'draw-searchcone-window',
		height: 300,
		width: 500,
		
		layout: {type: 'vbox', align: 'stretch'},
		closeAction: 'destroy',
		resizable: false,
		constrain: true,

		bodyPadding: 10,

		items:[{
			xtype: 'fieldcontainer',
			fieldLabel:Core.Translate.i18nJSON('CRS'),
			combineErrors: true,
			msgTarget : 'side',
			layout: 'hbox',
			reference: 'crsGroup',
			
			items: [{
				reference: 'crs',
				flex: 1,

				xtype: 'combobox',
				queryMode: 'remote',
				queryParam: 'q',
				allQuery: '',
		
				displayField: 'name',
				valueField: 'code',
				emptyText:Core.Translate.i18nJSON('Search (ex. 3908 or balkans)'),
				
				// For the dropdown list
				tpl: Ext.create('Ext.XTemplate',
					'<ul class="x-list-plain"><tpl for=".">',
						'<li role="option" class="x-boundlist-item">EPSG:{code} - {name}</li>',
					'</tpl></ul>'
				),

				// For the content of the text field
				displayTpl: Ext.create('Ext.XTemplate',
					'<tpl for=".">',
						'EPSG:{code} - {name}',
					'</tpl>'
				),

				store: {
					fields: ['code', 'name'],
					proxy: {
						type: 'jsonp',
						url: 'https://epsg.io/?format=json',
						reader: {
							type: 'json',
							rootProperty: 'results',
							totalProperty: 'number_results'
						}
					},
				}
			}]
		}, {
			xtype: 'fieldset',
			title: 'Position',
			items: [{
				xtype: 'fieldcontainer',
				fieldLabel:Core.Translate.i18nJSON('Longitude'),
				combineErrors: true,
				msgTarget : 'side',
				layout: 'hbox',
				reference: 'longitudeGroup',
				
				defaults: {
					hideLabel: true,
					
					maskRe: /[0-9\-.]/,
					stripCharsRe: /[^0-9\-.]/,
					
					style: {
						textAlign: 'center'
					}
				},
				items: [{
					xtype: 'textfield',
					reference: 'lng',
					flex: 1
				}]
			}, {
				xtype: 'fieldcontainer',
				fieldLabel:Core.Translate.i18nJSON('Latitude'),
				combineErrors: true,
				msgTarget : 'side',
				layout: 'hbox',
				reference: 'latitudeGroup',
				
				defaults: {
					hideLabel: true,
					
					maskRe: /[0-9\-.]/,
					stripCharsRe: /[^0-9\-.]/,
					
					style: {
						textAlign: 'center'
					}
				},
				items: [{
					xtype: 'textfield',
					reference: 'lat',
					flex: 1
				}]
			}, {
				xtype: 'button',
				text: Core.Translate.i18nJSON('Locate'),
				reference: 'locateButton',
				toggleHandler: 'onLocateToggle',
				scope: 'controller',
				enableToggle: true
			}]
		}, {
			xtype: 'fieldcontainer',
			fieldLabel:Core.Translate.i18nJSON('Radius KM'),
			combineErrors: true,
			msgTarget : 'side',
			layout: 'hbox',
			reference: 'radiusGroup',
			
			defaults: {
				hideLabel: true,
				
				maskRe: /[0-9\-.]/,
				stripCharsRe: /[^0-9\-.]/,
				
				style: {
					textAlign: 'center'
				}
			},
			items: [{
				xtype: 'textfield',
				reference: 'radius',
				flex: 1,
				value: 10
			}]
		}, {
			xtype: 'fieldcontainer',
			fieldLabel:Core.Translate.i18nJSON('Degrees Azimuth'),
			combineErrors: true,
			msgTarget : 'side',
			layout: 'hbox',
			reference: 'azimuthGroup',
			
			defaults: {
				hideLabel: true,
				
				maskRe: /[0-9\-.]/,
				stripCharsRe: /[^0-9\-.]/,
				
				style: {
					textAlign: 'center'
				}
			},
			items: [{
				xtype: 'textfield',
				reference: 'azimuth',
				flex: 1,
				value: 30
			}]
		}, {
			xtype: 'fieldcontainer',
			fieldLabel:Core.Translate.i18nJSON('Delta Degrees'),
			combineErrors: true,
			msgTarget : 'side',
			layout: 'hbox',
			reference: 'azimuthDeltaGroup',
			
			defaults: {
				hideLabel: true,
				
				maskRe: /[0-9\-.]/,
				stripCharsRe: /[^0-9\-.]/,
				
				style: {
					textAlign: 'center'
				}
			},
			items: [{
				xtype: 'textfield',
				reference: 'delta',
				flex: 1,
				value: 15
			}]
		}],
		
		buttons: [{
			text: Core.Translate.i18nJSON('Add to room'),
			reference: 'addToRoomButton',
			handler: 'onAddToRoomClick',
			scope: 'controller'
		}, {
			text: Core.Translate.i18nJSON('Draw'),
			reference: 'drawButton',
			handler: 'onDrawClick',
			scope: 'controller'
		}, {
			text: Core.Translate.i18nJSON('Clear'),
			reference: 'clearButton',
			handler: 'onClearClick',
			scope: 'controller'
		}],
		
		listeners: {
			close: "onWindowClose"
		}
		
	});
});
