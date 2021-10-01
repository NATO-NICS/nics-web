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
define(['iweb/CoreModule', './MkFloodFormController', './MkFloodFormModel' , 'iweb/core/FormVTypes'],
       
function(Core, MkFloodFormController, MkFloodFormModel ) {

	return Ext.define('modules.report-mk-flood.MkFloodFormView', {
		extend: 'Ext.form.Panel',
		
	 	controller: 'mkfloodformcontroller',
	 	 viewModel: {
		       type: 'mkflood'
		    },
		   
	 	buttonAlign: 'center',
	 	autoHeight: true,
	 	defaults: { padding:'5'},
		reference: "mkfloodReportForm",
        title: 'Flood Report',
        defaultType: 'textfield',
        bodyPadding: 10,
		referenceHolder: true,
	    items:[
	    { 
	    	 xtype: 'fieldset',
	         title: Core.Translate.i18nJSON('Incident Info'),
	         defaultType: 'textfield',
	         defaults: {
	             anchor: '100%'
	             
	         },
	    	 items:[  {bind:'{reportType}',fieldLabel: 'Report Type',xtype:'displayfield'},
	    	 	      
	    	         { xtype: 'fieldcontainer',layout:'hbox',defaultType: 'textfield', defaults: {anchor: '100%'},
	    	          items:[ {bind: '{incidentName}',vtype:'simplealphanum',fieldLabel: Core.Translate.i18nJSON('Incident Name'), flex:2,allowBlank:false,cls:'roc-required'},
	    	        	      {bind: '{incidentId}',vtype:'alphanum',fieldLabel: Core.Translate.i18nJSON('Incident Number'),padding:'0 0 0 5', flex:1,labelWidth:125,labelAlign:"left",allowBlank:false,cls:'roc-required'}
	    	           ]
	    	         },
	    	            {xtype: 'hiddenfield',bind:'{formTypeId}' },
	    	 	        //{bind:'{mkfloodDisplayName}',vtype:'simplealphanum',fieldLabel: Core.Translate.i18nJSON('Flood Display Name'),allowBlank:false,cls:'roc-required'},
	    	 	        {bind: '{date}',xtype: 'datefield',fieldLabel: Core.Translate.i18nJSON('Date'),format: 'm/d/y',cls:'roc-required',allowBlank:false},
	    	 	        {bind: '{starttime}',xtype: 'timefield',fieldLabel: Core.Translate.i18nJSON('Time'),format: 'H:i',hideTrigger:true,allowBlank:false,cls:'roc-required',
	    	 	        	listeners: {beforequery : function() { return false;  }}},
	    	 	        {bind: '{dateTimeOfEvent}',vtype:'extendedalphanum',fieldLabel: Core.Translate.i18nJSON('Date and time of the event / occurrence locally and by GMT'),allowBlank:false,cls:'roc-required'},
	    	 	        {bind: '{location}',xtype: 'textarea',vtype:'extendedalphanum',fieldLabel: Core.Translate.i18nJSON('Location affected area (City / district / district and geographic coordinates)'),allowBlank:false,cls:'roc-required'}
	    	]
	    },
	    
	    {
	    	xtype: 'fieldset',
	    	title: Core.Translate.i18nJSON('Flood'),
	        defaultType: 'textfield',
	        defaults: {
	             anchor: '100%'
	        },
	        items: [{bind:'{reason}',xtype:'textarea',fieldLabel: Core.Translate.i18nJSON('Reason for the event / occurrence (spill / slip / torrents)'),allowBlank:false,cls:'roc-required'},
	                {bind:'{description}',xtype:'textarea',fieldLabel: Core.Translate.i18nJSON('Event description (short and analytical)'),allowBlank:false,cls:'roc-required'},
	                {bind:'{waterLevelTendency}',vtype:'extendedalphanum',fieldLabel: Core.Translate.i18nJSON('Tendency of water level (rise / fall)'),allowBlank:false,cls:'roc-required'},
	                {bind:'{humanCasualties}',xtype:'textfield',fieldLabel: Core.Translate.i18nJSON('Number of human casualties and injuries'),allowBlank:false,cls:'roc-required'}
	        ]
	   },
	   {
            xtype: 'fieldset',
            title: Core.Translate.i18nJSON('Material Damage'),
            defaultType: 'textfield',
            defaults: {
                 anchor: '100%'
            },
            items: [{bind:'{dmgElectricalDistribution}',xtype:'textarea',fieldLabel: Core.Translate.i18nJSON('Damage to the electrical distribution network'),allowBlank:false,cls:'roc-required'},
                    {bind:'{dmgWaterSupply}',xtype:'textarea',fieldLabel: Core.Translate.i18nJSON('Damage to the water supply network'),allowBlank:false,cls:'roc-required'},
                    {bind:'{dmgTelecommunications}',xtype:'textarea',fieldLabel: Core.Translate.i18nJSON('Damage to the telecommunications networks'),allowBlank:false,cls:'roc-required'},
                    {bind:'{dmgTrafficInfrastructure}',xtype:'textarea',fieldLabel: Core.Translate.i18nJSON('Damage to the traffic infrastructure'),allowBlank:false,cls:'roc-required'},
                    {bind:'{dmgFacilitiesOther}',xtype:'textarea',fieldLabel: Core.Translate.i18nJSON('Damage to facilities and other infrastructure'),allowBlank:false,cls:'roc-required'},
                    {bind:'{dmgAgricultureForestry}',xtype:'textarea',fieldLabel: Core.Translate.i18nJSON('Harms in agriculture/forestry'),allowBlank:false,cls:'roc-required'},
                    {bind:'{dmgOther}',xtype:'textarea',fieldLabel: Core.Translate.i18nJSON('Other damages'),allowBlank:false,cls:'roc-required'}
            ]

       },
	   {
	    	xtype: 'fieldset',
	    	title: Core.Translate.i18nJSON('Weather Conditions'),
	        defaultType: 'textfield',
	        defaults: {
	             anchor: '100%'
	        },
	        items: [{bind:'{windDirection}',vtype:'extendedalphanum',fieldLabel: Core.Translate.i18nJSON('Direction of Wind (degrees from)'),allowBlank:false,cls:'roc-required'},
	                {bind:'{windSpeed}',vtype:'extendedalphanum',fieldLabel: Core.Translate.i18nJSON('Wind Speed (m/s)'),allowBlank:false,cls:'roc-required'},
	                {bind:'{temperature}',vtype:'extendedalphanum',fieldLabel: Core.Translate.i18nJSON('Temperature (degrees Celsius)'),allowBlank:false,cls:'roc-required'},
	                {bind:'{cloudiness}',vtype:'extendedalphanum',fieldLabel: Core.Translate.i18nJSON('Cloudiness %'),allowBlank:false,cls:'roc-required',emptyText:Core.Translate.i18nJSON('%(0/25/50/75/100)')},
	                {bind:'{rainfall}',vtype:'extendedalphanum',fieldLabel: Core.Translate.i18nJSON('Rainfall / Rain-snow / Quantity'),allowBlank:false,cls:'roc-required'},
	                {bind:'{forecast}',xtype:'textarea',fieldLabel: Core.Translate.i18nJSON('Forecast for the next 3-5 days'),allowBlank:false,cls:'roc-required'}
	        ]
	                
	   },
	   {
	    	xtype: 'fieldset',
	    	title: Core.Translate.i18nJSON('Ecological Parameters'),
	        defaultType: 'textfield',
	        defaults: {
	             anchor: '100%',
	             vtype:'simplealphanum'
	        },
	        items: [
	            {xtype: 'fieldset',
	                title: Core.Translate.i18nJSON('Quality of air (air pollution)'),
	                defaultType:'textfield',
	                items: [
	                    {bind:'{airCo2}',xtype: 'textfield',fieldLabel: 'CO<sub>2</sub>',allowBlank:false,cls:'roc-required'},
	                    {bind:'{airNox}',xtype: 'textfield',fieldLabel: 'NO<sub>x</sub>',allowBlank:false,cls:'roc-required'},
	                    {bind:'{airNo}',xtype: 'textfield',fieldLabel: 'NO',allowBlank:false,cls:'roc-required'},
	                    {bind:'{airNo2}',xtype: 'textfield',fieldLabel: 'NO<sub>2</sub>',allowBlank:false,cls:'roc-required'},
	                    {bind:'{airO3}',xtype: 'textfield',fieldLabel: 'O<sub>3</sub>',allowBlank:false,cls:'roc-required'},
	                    {bind:'{airCo}',xtype: 'textfield',fieldLabel: 'CO',allowBlank:false,cls:'roc-required'},
	                    {bind:'{airPm10}',xtype: 'textfield',fieldLabel: Core.Translate.i18nJSON('PM10'),allowBlank:false,cls:'roc-required'},
	                    {bind:'{airPm25}',xtype: 'textfield',fieldLabel: Core.Translate.i18nJSON('PM2.5'),allowBlank:false,cls:'roc-required'}
	                ]
	            },
	            {bind:'{waterQuality}',xtype: 'textarea',fieldLabel: Core.Translate.i18nJSON('Water quality (rivers, lakes)'),allowBlank:false,cls:'roc-required'},
	            {bind:'{other}',xtype: 'textarea',fieldLabel: Core.Translate.i18nJSON('Other environmental parameters (soil, etc.)'),allowBlank:false,cls:'roc-required'},
	            {bind:'{reportOnEnvironmentalMonitoring}',xtype: 'textarea',fieldLabel: Core.Translate.i18nJSON('Report on environmental monitoring, food and feed'),allowBlank:false,cls:'roc-required'}
	        ]
	   },
	    {
	    	xtype: 'fieldset',
	        defaultType: 'textfield',
	        defaults: {
	             anchor: '100%',
     	        vtype:'simplealphanum'
	        },
	        items: [
	        		{bind:'{initialAssessmentEndangered}',xtype:'textarea',fieldLabel: Core.Translate.i18nJSON('Initial assessment of Endangered, Injured, Threatened'), allowBlank:false,cls:'roc-required'},
	        		{bind:'{initialAssessmentSituation}', xtype:'textarea',fieldLabel: Core.Translate.i18nJSON('An initial assessment of the development of the situation for the next 24/48/72 hours'), allowBlank:false,cls:'roc-required'},
	        		{bind:'{measuresTaken}',xtype:'textarea',fieldLabel: Core.Translate.i18nJSON('Measures Taken'), allowBlank:false,cls:'roc-required'},
	        		{bind:'{resourcesUsed}',xtype:'textarea',fieldLabel: Core.Translate.i18nJSON('Resources used by Institutions'), allowBlank:false,cls:'roc-required'},
	        		{bind:'{materialTechnical}',xtype:'textarea',fieldLabel: Core.Translate.i18nJSON('Material - technical'), allowBlank:false,cls:'roc-required'},
	        		{bind:'{human}',xtype:'textarea',fieldLabel: Core.Translate.i18nJSON('Human'), allowBlank:false,cls:'roc-required'},
	                {bind:'{careNoOfPeople}',xtype:'textfield',fieldLabel: Core.Translate.i18nJSON('Care (number of persons)'), allowBlank:false,cls:'roc-required'},
	                {bind:'{evacuation}',xtype:'textarea',fieldLabel: Core.Translate.i18nJSON('Evacuation (number of persons, km / radius, reception centers, etc.)'), allowBlank:false,cls:'roc-required'},
	                {bind:'{theRest}',xtype:'textarea',fieldLabel: Core.Translate.i18nJSON('The Rest'), allowBlank:false,cls:'roc-required'},
	                {bind:'{needHelp}',vtype:'extendedalphanum',fieldLabel: Core.Translate.i18nJSON('Need help to overcome the consequences'), allowBlank:false,cls:'roc-required'},
	                {bind:'{teams}',vtype:'extendedalphanum',fieldLabel: Core.Translate.i18nJSON('Teams'), allowBlank:false,cls:'roc-required'},
	                {bind:'{materials}',vtype:'extendedalphanum',fieldLabel: Core.Translate.i18nJSON('Materials'), allowBlank:false,cls:'roc-required'},
	                {bind:'{experts}',vtype:'extendedalphanum',fieldLabel: Core.Translate.i18nJSON('Experts'), allowBlank:false,cls:'roc-required'},
	                {bind:'{otherRelevantData}',xtype:'textarea',fieldLabel: Core.Translate.i18nJSON('Other relevant data'), allowBlank:false,cls:'roc-required'},
	                {bind:'{contactDetails}',xtype:'textarea',fieldLabel: Core.Translate.i18nJSON('Contact details'), allowBlank:false,cls:'roc-required', emptyText:Core.Translate.i18nJSON('24/7, fax, e-mail, web, etc')}
	        ]
	               
	   },
	   {
	    	xtype: 'fieldset',
	        defaultType: 'textfield',
	        defaults: {
	             anchor: '100%'
	        },
	        items: [/*{bind:'{email}',vtype:'emaillist',xtype: 'textarea',fieldLabel: Core.Translate.i18nJSON('Email (comma separated)')},
	                {bind:'{simplifiedEmail}',xtype: 'checkboxfield', boxLabel: Core.Translate.i18nJSON('Simplified Email'),id: 'simplifiedEmail',checked:true },*/
	                {bind:'{comments}',vtype:'extendedalphanum',xtype: 'textarea',fieldLabel: Core.Translate.i18nJSON('Comments')},
	                {bind:'{reportBy}',vtype:'simplealphanum',fieldLabel: Core.Translate.i18nJSON('Report By')}
	        ]
	   },
	 ] ,
	 buttons: [
	{
		text: Core.Translate.i18nJSON('Submit'),
		reference: 'submitButton',
	    handler: 'submitForm',
	     formBind: true, //only enabled once the form is valid
	     disabled: true
	},{
		text: Core.Translate.i18nJSON('Reset'),
		reference: 'resetButton',
		handler: 'clearForm'
	},{
		text: Core.Translate.i18nJSON('Cancel'),
		reference: 'cancelButton',
		handler: 'cancelForm'
	}]
		 	
	 	
	});
});
