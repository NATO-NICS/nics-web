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
define(['iweb/CoreModule', "nics/modules/UserProfileModule", './MkMediaReportView',  './MkMediaFormView','./MkMediaFormModel'],

	function(Core, UserProfile, MkMediaReportView, MkMediaFormView , MkMediaFormModel ){
	
		
	
		Ext.define('modules.report-mk-media.MkMediaFormController', {
			extend : 'Ext.app.ViewController',
			
			alias: 'controller.mkmediaformcontroller',
			
			init : function(args) {
			
				this.mediator = Core.Mediator.getInstance();
				Core.EventManager.addListener("EmailMKMEDIAReport", this.emailMKMEDIA.bind(this));
				this.callParent();
				
			},
			onJoinIncident: function(e, incident) {
				
				this.getView().enable();		
			},
			clearForm: function() {
				
			 var username  = UserProfile.getFirstName() + " " + UserProfile.getLastName();	
			 this.view.getForm().getFields().each (function(field) {
				 if (field.fieldLabel != 'Incident Number*' && field.fieldLabel != 'Incident Name*' && field.fieldLabel != 'Report Type' && !(field.isHidden()) )
					 field.setValue("");
		    	});
		    },

			    setFormReadOnly: function() {
			    	this.view.getForm().getFields().each (function(field) {
			    		field.setReadOnly(true);
			    	});
			    	this.view.lookupReference('submitButton').hide();
			    	this.view.lookupReference('cancelButton').hide();
			    	this.view.lookupReference('resetButton').hide();
			    	
			    	Ext.getCmp('printMKMEDIA').enable();
			    	Ext.getCmp('updateMKMEDIA').enable();
			    	Ext.getCmp('finalizeMKMEDIA').enable();
			    	Ext.getCmp('viewMKMEDIA').enable();
			    },
			    enableForm: function() {
			    	this.view.getForm().getFields().each (function(field) {
			    		field.setReadOnly(false);
			    	});
			    	this.view.lookupReference('submitButton').show();
			    	this.view.lookupReference('cancelButton').show();
			    	this.view.lookupReference('resetButton').show();
			    },

			    
		    buildReport: function(data, simple, reportType){			    	
			
		    	var emailMessage=null;
				  
				if (simple){
					
					emailMessage  = "<html><body><h1>" + Core.Translate.i18nJSON('Necessary information for operation of the Crisis Situation Media Centre') + "</h1>";
					emailMessage  += "Start Date/Time: " + this.formatDate(data.date) + " @ " + this.formatTime(data.starttime);
                    emailMessage += "<h2>" + Core.Translate.i18nJSON('Where is the crisis area?') + "</h2>" + data.crisisArea;
                    emailMessage += "<h2>" + Core.Translate.i18nJSON('Are there any victims, injured and people in peril in the crisis area?') + "</h2>" + data.victimsInjured;
                    emailMessage += "<h2>" + Core.Translate.i18nJSON('What teams have gone out on the field to manage the crisis?') + "</h2>" + data.teams;
                    emailMessage += "<h2>" + Core.Translate.i18nJSON('What resources are at the disposal of the crisis management teams?') + "</h2>" + data.resources;
                    emailMessage += "<h2>" + Core.Translate.i18nJSON('Additional information on the development of crisis situation') + "</h2>" + data.addInfo;
                    emailMessage += "<h2>" + Core.Translate.i18nJSON('History of the area where the crisis took place') + "</h2>" + data.historyOfArea;

				    if(typeof(data.comments) != "undefined" && data.comments != "") {
                        emailMessage  += "<h2>" + Core.Translate.i18nJSON('Comments') + "</h2>" + data.comments  + "<br/>";
                    }

                    emailMessage += "<br/><br/><strong>Reported By " + data.reportBy + "</strong>";
				}
				else { 
					
					try {
                        emailMessage = "<html><body><h1>" + Core.Translate.i18nJSON('Necessary information for operation of the Crisis Situation Media Centre') + "</h1>";
                        emailMessage += "<br/>Incident Name/Number: " + data.incidentName + "/" + data.incidentId ;
                        emailMessage += "<br/>Start Date/Time: " + this.formatDate(data.date) + " @ "  + this.formatTime(data.starttime);

                        emailMessage += "<h2>" + Core.Translate.i18nJSON('Where is the crisis area?') + "</h2>" + data.crisisArea;
                        emailMessage += "<h2>" + Core.Translate.i18nJSON('Are there any victims, injured and people in peril in the crisis area?') + "</h2>" + data.victimsInjured;
                        emailMessage += "<h2>" + Core.Translate.i18nJSON('What teams have gone out on the field to manage the crisis?') + "</h2>" + data.teams;
                        emailMessage += "<h2>" + Core.Translate.i18nJSON('What resources are at the disposal of the crisis management teams?') + "</h2>" + data.resources;
                        emailMessage += "<h2>" + Core.Translate.i18nJSON('Additional information on the development of crisis situation') + "</h2>" + data.addInfo;
                        emailMessage += "<h2>" + Core.Translate.i18nJSON('History of the area where the crisis took place') + "</h2>" + data.historyOfArea;

                        /*if(typeof(data.comments) != "undefined" && data.comments != "") {
                            emailMessage +="<strong>Comments:</strong> " + data.comments;
                        }*/

                        emailMessage += "<br/><br/><strong>Reported By " + data.reportBy + "</strong>";
					}
					catch(e) {
						alert(e);
					}
				}
				
			    if (reportType == 'print'){
			    	 emailMessage += "</html></body >"; 
			    	Core.EventManager.fireEvent("PrintMKMEDIAReport",emailMessage);
			    }
			  else if (reportType == 'email'){
				  	emailMessage += "<p style='font-size:.8em;'>This e-mail was sent automatically by the Next Generation Incident Command System (NICS).Do not reply.</p></html></body >";
				    var subject  = "Media Report";
				    var emailResponse = {emailList: data.email, subject: subject, emailBody: emailMessage};
			    	Core.EventManager.fireEvent("EmailMKMEDIAReport",emailResponse);
			  }
				
			},
	    	
	    	submitForm: function(){
	    		var form = {};
	    		var message = {};
	    		var report= {};
	    		
	    		
	    		var time = Core.Util.formatDateToString(new Date());
	    		 
	    		message.datecreated = time;
	    		
	    		var formView = this.view.viewModel;
	    		 		
	    		if (typeof(formView.data.simplifiedEmail) == "undefined" )  {formView.data.simplifiedEmail = true;}
    	
	    		if (formView.get('report') === null){
	    			//create the report from the data
	    		   for (item in formView.data){
	    			   //Don't capture the buttons, or the incident name and id in the report
	    			   var buttonRE = /button$/i;
	    			  // var isButton = buttonRE.test(item);
	    			   if (item != 'incidentId' && item != 'incidentName' && !(buttonRE.test(item)) )
	    					report[item] = formView.data[item];
	    		  }
	    		   message.report = report;
	    		   
	    		}else {
	    			//report has already been created
	    			message.report = formView.get('report');
	    		
	    		}
	    		
	    	
	    		//Populate form properties
	    		form.incidentid = formView.data.incidentId;
	    		form.incidentname = formView.data.incidentName;
	    		form.formtypeid = formView.data.formTypeId; //this is always a MKMEDIA
	    		form.usersessionid = UserProfile.getUserSessionId();
	    		form.distributed = false;
	    		form.message = JSON.stringify(message);
	    		
				var url = Ext.String.format('{0}/reports/{1}/{2}', 
						Core.Config.getProperty(UserProfile.REST_ENDPOINT),
						formView.data.incidentId, 'MKMEDIA');
	    		
				
				var topic = Ext.String.format("iweb.NICS.incident.{0}.report.{1}.#", formView.data.incidentId, 'MKMEDIA');
				
				this.mediator.sendPostMessage(url, topic, form);
				this.setFormReadOnly();
				this.newTopic = Ext.String.format(
						"iweb.NICS.incident.{0}.report.{1}.new", form.incidentid,
						'MKMEDIA');
				Core.EventManager.fireEvent(this.newTopic);
				//Build  email message
	    		//Add incident Name and Id to pass to email/print report
	    		message.report.incidentId = formView.data.incidentId;
	    		message.report.incidentName = formView.data.incidentName;
	    		this.buildReport(message.report, formView.data.simplifiedEmail, 'email');
			
				
	    	},
	    	emailMKMEDIA: function(e, response){
	    		//Now send the email 

	    		this.emailTopic = "iweb.nics.email.alert";
	    		var emailList = response.emailList;
	    		var subject  = response.subject;
	    		var msgBody= response.emailBody;
	    		
			var message = {
				      to: emailList,
				      from: UserProfile.getUsername(),
				      subject: subject,
				      body: msgBody
				}; 
			if (this.mediator && this.mediator.publishMessage)
			{
				this.mediator.publishMessage(this.emailTopic, message); 
			} 

		
    	},
	    	
	    	cancelForm: function(){
	    		Core.EventManager.fireEvent("CancelMKMEDIAReport");
		    		
	    	},
	    	
	    	formatTime: function(date)
	        {
	            var str =  date.getHours() + ":" + Core.Util.pad(date.getMinutes()) ;

	            return str;
	        },
	        formatDate: function(date)
	        {
	            var str = (date.getMonth() + 1) + "/"
	            + date.getDate() + "/"
	            + date.getFullYear();

	            return str;
	        }
			
		});
});