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
define(['iweb/CoreModule', "nics/modules/UserProfileModule", './CbrneReportView',  './CbrneFormView','./CbrneFormModel'],

	function(Core, UserProfile, CbrneReportView, CbrneFormView , CbrneFormModel ){
	
		
	
		Ext.define('modules.report-cbrne.CbrneFormController', {
			extend : 'Ext.app.ViewController',
			
			alias: 'controller.cbrneformcontroller',
			
			init : function(args) {
			
				this.mediator = Core.Mediator.getInstance();
				Core.EventManager.addListener("EmailCBRNEReport", this.emailCBRNE.bind(this));
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
			    	
			    	Ext.getCmp('printCBRNE').enable();
			    	Ext.getCmp('updateCBRNE').enable();
			    	Ext.getCmp('finalizeCBRNE').enable();
			    	Ext.getCmp('viewCBRNE').enable();
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

					emailMessage = "<html><body><h2>" + Core.Translate.i18nJSON('RBC');
                    emailMessage += "<br/><br/>" + Core.Translate.i18nJSON('Incident Name/Number') + ": " + data.incidentName + "/" + data.incidentId ;
                    emailMessage += "<br/>" + Core.Translate.i18nJSON('Start Date/Time') + ": " + this.formatDate(data.date) + " @ "  + this.formatTime(data.starttime);
                    emailMessage += "<ul style='list-style-type: none; font-weight: normal'>";
                    emailMessage += "<li><strong>" + Core.Translate.i18nJSON('Report Type') + ":</strong> " + data.reportType + "</li>";

                    emailMessage += "<li><strong>" + Core.Translate.i18nJSON('Date') + ":</strong> " + this.formatDate(data.date) + "</li>";
                    emailMessage += "<li><strong>" + Core.Translate.i18nJSON('Time') + ":</strong> " + this.formatTime(data.starttime) + "</li>";
                    emailMessage += "<li><strong>" + Core.Translate.i18nJSON('Date and time of the event / occurrence locally and by GMT') + ":</strong> " + data.dateTimeOfEvent + "</li>";
                    emailMessage += "<li><strong>" + Core.Translate.i18nJSON('Location affected area (City / district / district and geographic coordinates)') + ":</strong> " + data.location + "</li>";

                    emailMessage += "<li><strong>" + Core.Translate.i18nJSON('Radiological, Biological or Chemical Contamination') + ":</strong><ul>";
                    emailMessage += "<li><strong>" + Core.Translate.i18nJSON('Type (substance, properties and quantity) of RBC contamination and measured parameters') + ":</strong> " + data.typeRbc + "</li>";
                    emailMessage += "<li><strong>" + Core.Translate.i18nJSON('Event description (short and analytical)') + ":</strong> " + data.description + "</li>";
                    emailMessage += "<li><strong>" + Core.Translate.i18nJSON('Number of human casualties/injuries') + ":</strong> " + data.numCasualties + "</li>";
                    emailMessage += "<li><strong>" + Core.Translate.i18nJSON('Material Damage') + ":</strong> " + data.materialDamage + "</li></ul>";

                    emailMessage   += "</ul>";

				    //if(typeof(data.comments) != "undefined" && data.comments != ""){emailMessage  += "<li>" + data.comments  + "</li>"}
				    if(typeof(data.comments) != "undefined" && data.comments != "")emailMessage +="<br/><strong>" + Core.Translate.i18nJSON('Comments') + ":</strong> " + data.comments;

				}
				else { 
					
					try {

                        emailMessage = "<html><body><h2>" + Core.Translate.i18nJSON('RBC');
                        emailMessage += "<br/><br/>" + Core.Translate.i18nJSON('Incident Name/Number') + ": " + data.incidentName + "/" + data.incidentId ;
                        emailMessage += "<br/>" + Core.Translate.i18nJSON('Start Date/Time') + ": " + this.formatDate(data.date) + " @ "  + this.formatTime(data.starttime);
                        emailMessage += "<ul style='list-style-type: none; font-weight: normal'>";
                        emailMessage += "<li><strong>" + Core.Translate.i18nJSON('Report Type') + ":</strong> " + data.reportType + "</li>";

                        emailMessage += "<li><strong>" + Core.Translate.i18nJSON('Date') + ":</strong> " + this.formatDate(data.date) + "</li>";
                        emailMessage += "<li><strong>" + Core.Translate.i18nJSON('Time') + ":</strong> " + this.formatTime(data.starttime) + "</li>";
                        emailMessage += "<li><strong>" + Core.Translate.i18nJSON('Date and time of the event / occurrence locally and by GMT') + ":</strong> " + data.dateTimeOfEvent + "</li>";
                        emailMessage += "<li><strong>" + Core.Translate.i18nJSON('Location affected area (City / district / district and geographic coordinates)') + ":</strong> " + data.location + "</li>";

                        emailMessage += "<li><strong>" + Core.Translate.i18nJSON('Radiological, Biological or Chemical Contamination') + ":</strong><ul>";
                        emailMessage += "<li><strong>" + Core.Translate.i18nJSON('Type (substance, properties and quantity) of RBC contamination and measured parameters') + ":</strong> " + data.typeRbc + "</li>";
                        emailMessage += "<li><strong>" + Core.Translate.i18nJSON('Event description (short and analytical)') + ":</strong> " + data.description + "</li>";
                        emailMessage += "<li><strong>" + Core.Translate.i18nJSON('Number of human casualties/injuries') + ":</strong> " + data.numCasualties + "</li>";
                        emailMessage += "<li><strong>" + Core.Translate.i18nJSON('Material Damage') + ":</strong> " + data.materialDamage + "</li>";

                        emailMessage += "<li><strong>" + Core.Translate.i18nJSON('Weather Conditions') + ":</strong><ul>";
                        emailMessage += "<li><strong>" + Core.Translate.i18nJSON('Direction of Wind (degrees from)') + ":</strong> " + data.windDirection + "</li>";
                        emailMessage += "<li><strong>" + Core.Translate.i18nJSON('Wind Speed (m/s)') + ":</strong> " + data.windSpeed + "</li>";
                        emailMessage += "<li><strong>" + Core.Translate.i18nJSON('Temperature (degrees Celsius)') + ":</strong> " + data.temperature + "</li>";
                        emailMessage += "<li><strong>" + Core.Translate.i18nJSON('Cloudiness %') + ":</strong> " + data.cloudiness + "</li>";
                        emailMessage += "<li><strong>" + Core.Translate.i18nJSON('Rainfall / Rain-snow / Quantity') + ":</strong> " + data.rainfall + "</li>";
                        emailMessage += "<li><strong>" + Core.Translate.i18nJSON('Forecast for the next 3-5 days') + ":</strong> " + data.forecast + "</li></ul>";
                        emailMessage += "</li>";

                        emailMessage += "<li><strong>" + Core.Translate.i18nJSON('Ecological Parameters') + ":</strong><ul>";
                        emailMessage += "<li><strong>" + Core.Translate.i18nJSON('Quality of air (air pollution)') + ":</strong><ul>";
                        emailMessage += "<li><strong>" + Core.Translate.i18nJSON('CO<sub>2</sub>') + ":</strong> " + data.airCo2 + "</li>";
                        emailMessage += "<li><strong>" + Core.Translate.i18nJSON('NO<sub>x</sub>') + ":</strong> " + data.airNox + "</li>";
                        emailMessage += "<li><strong>" + Core.Translate.i18nJSON('NO') + ":</strong> " + data.airNo + "</li>";
                        emailMessage += "<li><strong>" + Core.Translate.i18nJSON('NO<sub>2</sub>') + ":</strong> " + data.airNo2 + "</li>";
                        emailMessage += "<li><strong>" + Core.Translate.i18nJSON('O<sub>3</sub>') + ":</strong> " + data.airO3 + "</li>";
                        emailMessage += "<li><strong>" + Core.Translate.i18nJSON('CO') + ":</strong> " + data.airCo + "</li>";
                        emailMessage += "<li><strong>" + Core.Translate.i18nJSON('PM10') + ":</strong> " + data.airPm10 + "</li>";
                        emailMessage += "<li><strong>" + Core.Translate.i18nJSON('PM2.5') + ":</strong> " + data.airPm25 + "</li></ul>";
                        emailMessage += "<li><strong>" + Core.Translate.i18nJSON('Water quality (rivers, lakes)') + ":</strong> " + data.waterQuality + "</li>";
                        emailMessage += "<li><strong>" + Core.Translate.i18nJSON('Other environmental parameters (soil, etc.)') + ":</strong> " + data.other + "</li>";
                        emailMessage += "<li><strong>" + Core.Translate.i18nJSON('Report on environmental monitoring, food and feed') + ":</strong> " + data.reportOnEnvironmentalMonitoring + "</li></ul>";
                        emailMessage += "</li>";

                        emailMessage += "<li><strong>" + Core.Translate.i18nJSON('Initial assessment of Endangered, Injured, Threatened') + ":</strong> " + data.initialAssessmentEndangered + "</li>";
                        emailMessage += "<li><strong>" + Core.Translate.i18nJSON('An initial assessment of the development of the situation for the next 24/48/72 hours') + ":</strong> " + data.initialAssessmentSituation + "</li>";
                        emailMessage += "<li><strong>" + Core.Translate.i18nJSON('Measures Taken') + ":</strong> " + data.measuresTaken + "</li>";
                        emailMessage += "<li><strong>" + Core.Translate.i18nJSON('Resources used By Institutions)') + ":</strong> " + data.resourcesUsed + "</li>";
                        emailMessage += "<li><strong>" + Core.Translate.i18nJSON('Material - technical') + ":</strong> " + data.materialTechnical + "</li>";
                        emailMessage += "<li><strong>" + Core.Translate.i18nJSON('Human') + ":</strong> " + data.human + "</li>";
                        emailMessage += "<li><strong>" + Core.Translate.i18nJSON('Decontamination (persons, tangible assets, soil and water)') + ":</strong> " + data.decontamination + "</li>";
                        emailMessage += "<li><strong>" + Core.Translate.i18nJSON('Care (number of persons)') + ":</strong> " + data.careNoOfPeople + "</li>";
                        emailMessage += "<li><strong>" + Core.Translate.i18nJSON('Evacuation (number of persons, km / radius, reception centers, etc.)') + ":</strong> " + data.evacuation + "</li>";
                        emailMessage += "<li><strong>" + Core.Translate.i18nJSON('Removing / storing RBC sources of contamination') + ":</strong> " + data.removingStoringRbc + "</li>";
                        emailMessage += "<li><strong>" + Core.Translate.i18nJSON('Others') + ":</strong> " + data.othersrbc + "</li>";
                        emailMessage += "<li><strong>" + Core.Translate.i18nJSON('Need help to overcome the consequences') + ":</strong> " + data.needHelp + "</li>";
                        emailMessage += "<li><strong>" + Core.Translate.i18nJSON('Teams') + ":</strong> " + data.teams + "</li>";
                        emailMessage += "<li><strong>" + Core.Translate.i18nJSON('Materials') + ":</strong> " + data.materials + "</li>";
                        emailMessage += "<li><strong>" + Core.Translate.i18nJSON('Experts') + ":</strong> " + data.experts + "</li>";
                        emailMessage += "<li><strong>" + Core.Translate.i18nJSON('Other relevant data') + ":</strong> " + data.otherRelevantData + "</li>";
                        emailMessage += "<li><strong>" + Core.Translate.i18nJSON('Contact details') + ":</strong> " + data.contactDetails + "</li>";
                        emailMessage += "</ul>";

                        emailMessage += "</ul>";

                        if(typeof(data.comments) != "undefined" && data.comments != "")emailMessage +="<strong>" + Core.Translate.i18nJSON('Comments') + ":</strong> " + data.comments + "<br/>";
                         emailMessage += "<br/><strong>Reported By " + data.reportBy + "</strong>";
                        }
					catch(e) {
						alert(e);
					}
				}
				
			    if (reportType == 'print'){
			    	 emailMessage += "</html></body >"; 
			    	Core.EventManager.fireEvent("PrintCBRNEReport",emailMessage);
			    }
			  else if (reportType == 'email'){
				  	emailMessage += "<p style='font-size:.8em;'>This e-mail was sent automatically by the Next Generation Incident Command System (NICS).Do not reply.</p></html></body >";
				    var subject  = "RBC Report";
				    var emailResponse = {emailList: data.email, subject: subject, emailBody: emailMessage};
			    	Core.EventManager.fireEvent("EmailCBRNEReport",emailResponse);

				 
			    } 
			//	return emailMessage;
				
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
	    		form.formtypeid = formView.data.formTypeId; //this is always a CBRNE
	    		form.usersessionid = UserProfile.getUserSessionId();
	    		form.distributed = false;
	    		form.message = JSON.stringify(message);
	    		
				var url = Ext.String.format('{0}/reports/{1}/{2}', 
						Core.Config.getProperty(UserProfile.REST_ENDPOINT),
						formView.data.incidentId, 'CBRNE');
	    		
				
				var topic = Ext.String.format("iweb.NICS.incident.{0}.report.{1}.#", formView.data.incidentId, 'CBRNE');
				
				this.mediator.sendPostMessage(url, topic, form);
				this.setFormReadOnly();
				this.newTopic = Ext.String.format(
						"iweb.NICS.incident.{0}.report.{1}.new", form.incidentid,
						'CBRNE');
				Core.EventManager.fireEvent(this.newTopic);
				//Build  email message
	    		//Add incident Name and Id to pass to email/print report
	    		message.report.incidentId = formView.data.incidentId;
	    		message.report.incidentName = formView.data.incidentName;
	    		this.buildReport(message.report, formView.data.simplifiedEmail, 'email');
			
				
	    	},
	    	emailCBRNE: function(e, response){
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
	    		Core.EventManager.fireEvent("CancelCBRNEReport");
		    		
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