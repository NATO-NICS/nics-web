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
define([ 'iweb/CoreModule', './FeatureDetailController', './FeatureCommentsView', 'iweb/core/FormVTypes', './ColorButton'],
function(Core, FeatureDetailController, FeatureCommentsView, FormVTypes, ColorButton) {

	return Ext.define('modules.feature-comments.FeatureDetailView', {
		extend : 'Ext.Panel',

		controller : 'featuredetailcontroller',

		closable : false,

		closeAction : 'hide',

		autoScroll : true,

		config : {
			autoWidth : true,
			autoHeight : true,
			layout : {
				type : 'vbox',
				align : 'stretch'
			},
			title : Core.Translate.i18nJSON('Feature Details')
		},
		dockedItems : [ {
			xtype : 'toolbar',
			dock : 'top',
			layout : {
				pack : 'start'
			},
			items : [ {
				xtype : 'button',
				text : Core.Translate.i18nJSON('Edit Feature'),
				enableToggle: true,
				hidden : false,
				disabled : true,
				reference : 'editButton',
				toggleHandler : 'onToggleEditButton'
			},{
				xtype : 'button',
				text : Core.Translate.i18nJSON('Mark As Hazard'),
				enableToggle: true,
				hidden : false,
				disabled : true,
				reference : 'hazardButton',
				toggleHandler : 'onToggleHazardButton'
			}]
		} ],
		items: [{
			xtype: 'box',
			reference: 'htmlBox',
			html: ''
		}, {
			xtype: 'form',
			defaultType: 'textfield',
			bodyPadding: 5,
			reference: 'editForm',
			items: [
				{
					fieldLabel: Core.Translate.i18nJSON('Label'),
					name: 'labelText',
					reference: 'labelText',
					vtype : 'extendedalphanum',
					disabled: true
				},
				{
					fieldLabel: Core.Translate.i18nJSON('Description'),
					name: 'description',
					reference: 'description',
					vtype : 'extendedalphanum',
					disabled: true
				},
				{
					xtype: 'fieldcontainer',
					fieldLabel: Core.Translate.i18nJSON('Stroke Color'),
					reference: 'strokeColorBox',
					disabled: true,
					items: [{
						xtype: 'featuredetail.colorbutton',
						name: 'strokeColor',
						reference: 'strokeColor'
					}]
				},
				{
					xtype: 'fieldcontainer',
					fieldLabel: Core.Translate.i18nJSON('Fill Color'),
					reference: 'fillColorBox',
					disabled: true,
					items: [{
						xtype: 'featuredetail.colorbutton',
						name: 'fillColor',
						reference: 'fillColor'
					}]
				},
				{
					xtype: 'sliderfield',
					fieldLabel: Core.Translate.i18nJSON('Opacity'),
					reference: 'opacitySlider',
					disabled: true,
					width: '50%',
					value: 100,
					minValue: 1,
					maxValue: 100,
					increment: 1,
					tipText: function(thumb){
						return  thumb.value + '%';
					}
				},
				{
					xtype: 'button',
					text: Core.Translate.i18nJSON('Save'),
					reference: 'saveButton',
					disabled: true,
					handler : 'onSaveButton'
				}
			]
		}, {
			xtype: 'form',
			defaultType: 'textfield',
			bodyPadding: 5,
			reference: 'hazardForm',
			hidden: true,
			items: [
				{
					fieldLabel: Core.Translate.i18nJSON('Hazard Label'),
					name: 'hazardLabel',
					reference: 'hazardLabel',
					vtype : 'extendedalphanum'
				},
				{
					fieldLabel: Core.Translate.i18nJSON('Hazard Type'),
					name: 'hazardType',
					reference: 'hazardType',
					vtype : 'extendedalphanum'
				},
				{
					xtype: 'fieldcontainer',
					fieldLabel: Core.Translate.i18nJSON('Radius'),
					reference: 'radiusContainer',
					layout: 'hbox',
					items: [{
						name: 'radius',
						reference: 'radius',
						xtype: 'textfield',
						vtype : 'extendedalphanum',
						allowBlank: false
					},{
						xtype: 'combobox',
						name: 'metric',
						reference: 'metric',
						displayField: 'label',
						valueField: 'metric',
						allowBlank: false,
						store: {
							fields: ['metric', 'label'],
							data : [
								{"metric":"meter", "label":"Meters"},
								{"metric":"kilometer", "label":"Kilometers"}
							]
						}
					}]
				},
				{
					xtype: 'button',
					text: Core.Translate.i18nJSON('Save'),
					reference: 'hazardSaveButton',
					formBind: true,
					handler : 'onSaveHazardButton'
				},
				{
					xtype: 'button',
					text: Core.Translate.i18nJSON('Remove'),
					reference: 'hazardRemoveButton',
					handler : 'onRemoveHazardButton'
				}]
		},{
			xtype: 'featureComments'
		}]
	});
});
