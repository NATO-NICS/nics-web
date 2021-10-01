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
define(['iweb/CoreModule','./DDGridView', './IncidentTypeFormTypeController', 'iweb/core/FormVTypes'],
		function(Core, DDGridView, IncidentTypeFormTypeController) {
	
	return Ext.define('modules.administration.IncidentTypeFormTypeView', {
	 
	 	extend: 'Ext.window.Window',
	 	
	 	title: Core.Translate.i18nJSON('Manage Incident Type to Report Associations'),

		initComponent: function() {
	 		this.test = true;
	 		console.log("Testing initComponent of IncidentTypeFormTypeView: ", this.test);
		},
        
	 	layout: {
            type: 'vbox',
            align: 'stretch'
        },
	 	
	 	controller: 'incidenttypeformtypecontroller',
	 	
	 	closeAction : 'hide',
	 	
	 	width: 400,
	 	
	 	height: 400,
	 	
	 	items: [{
	 		xtype:'form',
            layout: 'vbox',
            reference: 'incidentTypeFormTypeForm',
            bodyPadding: 5,
            width: 375,
            items: [{
	            xtype: 'fieldcontainer',
	            fieldLabel: Core.Translate.i18nJSON('Incident Types'),
	            layout: 'hbox',
	            width: 370,
	            items: [
	            	{
	    				xtype: 'combobox',
	    				disabled: true,
	    				fieldStyle: {
	    					'textAlign':'center'
	    				},
	    				listConfig: {
	    					style: {
	    						'textAlign':'center'
	    					}
	    				},
	    				store: {
	    					fields: ['incidentTypeId', 'incidentTypeName'],
	    					sorters: ['incidentTypeName']
	    				},
	    				forceSelection: true,
	    				queryMode: 'local',
	    				displayField: 'incidentTypeName',
	    				valueField: 'incidentTypeId',
	    				reference: 'incidentTypes'
	    			}
	            ]
	        }]

	 		},{
	 			xtype: 'checkboxgroup',
				title: 'Report Types',
				width: 370,
				columns: 2,
				vertical: true,
				items: []

		}]
	});
});