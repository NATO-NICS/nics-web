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
define(['iweb/CoreModule', './MkMediaFormController', './MkMediaFormModel' , 'iweb/core/FormVTypes'],
       
function(Core, MkMediaFormController, MkMediaFormModel ) {

	return Ext.define('modules.report-mk-media.MkMediaFormView', {
		extend: 'Ext.form.Panel',
		
	 	controller: 'mkmediaformcontroller',
	 	 viewModel: {
		       type: 'mkmedia'
		    },
		   
	 	buttonAlign: 'center',
	 	autoHeight: true,
	 	defaults: { padding:'5'},
		reference: "mkmediaReportForm",
        title: 'Media Report',
        defaultType: 'textfield',
        bodyPadding: 10,
		referenceHolder: true,
	    items:[
	    { 
	    	 xtype: 'fieldset',
	         title: Core.Translate.i18nJSON('Necessary information for operation of the Crisis Situation Media Centre'),
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
	    	 	        //{bind:'{mkmediaDisplayName}',vtype:'simplealphanum',fieldLabel: Core.Translate.i18nJSON('Media Display Name'),allowBlank:false,cls:'roc-required'},
	    	 	        // TODO: label with wording on form?
	    	 	        {bind: '{date}',xtype: 'datefield',fieldLabel: Core.Translate.i18nJSON('Date'),format: 'm/d/y',cls:'roc-required',allowBlank:false},
	    	 	        {bind: '{starttime}',xtype: 'timefield',fieldLabel: Core.Translate.i18nJSON('Time'),format: 'H:i',hideTrigger:true,allowBlank:false,cls:'roc-required',
	    	 	        	listeners: {beforequery : function() { return false;  }}},
	    	 	        {bind: '{whenCrisis}',vtype:'extendedalphanum',fieldLabel: Core.Translate.i18nJSON('When did crisis take place?'),allowBlank:false,cls:'roc-required', emptyText: Core.Translate.i18nJSON('The exact time of event.')},
	    	 	        {bind: '{typeOfCrisis}',vtype:'extendedalphanum',fieldLabel: Core.Translate.i18nJSON('Type of crisis'),allowBlank:false,cls:'roc-required', emptyText: Core.Translate.i18nJSON('Flood, fire, earthquake, epidemic...')}

	    	]
	    },
	    
	    {
	    	xtype: 'fieldset',
	    	title: Core.Translate.i18nJSON('Information about possible reason leading to the crisis'),
	        defaultType: 'textfield',
	        defaults: {
	             anchor: '100%'
	        },
	        items: [{bind:'{crisisArea}',xtype:'textarea',fieldLabel: Core.Translate.i18nJSON('Where is the crisis area?'),allowBlank:false,cls:'roc-required', emptyText: Core.Translate.i18nJSON('A short geographical description of where the affected area is and number of population in the affected area')},
	                {bind:'{victimsInjured}',xtype:'textarea',fieldLabel: Core.Translate.i18nJSON('Are there any victims, injured and people in peril in the crisis area?'),allowBlank:false,cls:'roc-required', emptyText:Core.Translate.i18nJSON('Number of possible victims, injured and people in peril. Where have they been accommodated and evacuated?')},
	                {bind:'{teams}',xtype:'textarea',fieldLabel: Core.Translate.i18nJSON('What teams have gone out on the field to manage the crisis?'),allowBlank:false,cls:'roc-required',emptyText:Core.Translate.i18nJSON('Number of rescue teams and institution members')},
	                {bind:'{resources}',xtype:'textarea',fieldLabel: Core.Translate.i18nJSON('What resources are at the disposal of the crisis management teams?'),allowBlank:false,cls:'roc-required',emptyText:Core.Translate.i18nJSON('Type of mechanization and material-technical devices')},
	                {bind:'{addInfo}',xtype:'textarea',fieldLabel: Core.Translate.i18nJSON('Additional information on the development of crisis situation'),allowBlank:false,cls:'roc-required',emptyText:Core.Translate.i18nJSON('Needs, rescue actions, problems of the persons managing the crisis etc.')},
	                {bind:'{historyOfArea}',xtype:'textarea',fieldLabel: Core.Translate.i18nJSON('History of the area where the crisis took place'),allowBlank:false,cls:'roc-required',emptyText:Core.Translate.i18nJSON('Has there been a crisis in the past in the same area and what was the reaction of institutions and what were the consequences.')}
	        ]
	   },

	   {
	    	xtype: 'fieldset',
	        defaultType: 'textfield',
	        defaults: {
	             anchor: '100%'
	        },
	        items: [/*{bind:'{email}',vtype:'emaillist',xtype: 'textarea',fieldLabel: Core.Translate.i18nJSON('Email (comma separated)')},
	                {bind:'{simplifiedEmail}',xtype: 'checkboxfield', boxLabel: Core.Translate.i18nJSON('Simplified Email'),id: 'simplifiedEmail',checked:true },
	                {bind:'{comments}',vtype:'extendedalphanum',xtype: 'textarea',fieldLabel: Core.Translate.i18nJSON('General Comments')},*/
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
