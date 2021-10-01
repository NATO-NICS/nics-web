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
define(['iweb/CoreModule', 'nics/modules/UserProfileModule',
	'nics/modules/report/common/ReportTableController'], 

	function(Core, UserProfile){
	
		return Ext.define('modules.whiteboard.ChatReportController', {
			extend : 'Ext.app.ViewController',
			
			alias: 'controller.chatreportcontroller',
			
			orgCaps: [],

			init : function(args) {
				this.mediator = Core.Mediator.getInstance();

				this.bindEvents();
			},

			bindEvents : function() {
				// Bind UI Elements
				Core.EventManager.addListener("nics.incident.join", this.onJoinIncident.bind(this));
				Core.EventManager.addListener("nics.incident.close", this.onCloseIncident.bind(this));
				Core.EventManager.addListener("nics.user.profile.loaded", this.updateOrgCapsListener.bind(this));
				Core.EventManager.addListener("nics.userorg.change", this.onChangeUserOrg.bind(this));
				Core.EventManager.addListener(this.loadEvt, this.onLoadReports.bind(this));
				
				Core.EventManager.fireEvent("nics.report.add", {
					title : this.reportTitle,
					orgCap: this.reportType,
					component : this.getView()
				});
				
				this.bindOrgCapUpdate = this.orgCapUpdate.bind(this);
			},
			
			onChangeUserOrg: function(evt){
				Core.EventManager.fireEvent("nics.report.remove", {
					component : this.getView()
				});
			},
			
			updateOrgCapsListener: function(evt, data){
				
				if(this.currentOrg){
					this.mediator.unsubscribe("iweb.nics.orgcaps." + this.currentOrg + "." + this.reportType);
					Core.EventManager.removeListener("iweb.nics.orgcaps." + this.currentOrg + "." + this.reportType, this.bindOrgCapUpdate);
				}
				
				this.currentOrg = UserProfile.getOrgId();
				
				var orgCapInArray = false;
				
				for(var i = 0; i < this.orgCaps.length; i++){
					if(this.orgCaps[i].currentOrg == this.currentOrg && this.orgCaps[i].reportType == this.reportType){
						orgCapInArray = true;
					}
				}
				
				if(!orgCapInArray){
					Core.EventManager.addListener("iweb.nics.orgcaps." + this.currentOrg + "." + this.reportType, this.bindOrgCapUpdate);
					this.orgCaps.push({ 'orgId': this.currentOrg , 'reportType': this.reportType });
				}
				
				this.mediator.subscribe("iweb.nics.orgcaps." + this.currentOrg + "." + this.reportType);

			},
			
			orgCapUpdate: function(evt, orgcap){

				if(orgcap.activeWeb){
					this.getView().enable();
				}
				else{
					this.getView().disable();
				}
			
				UserProfile.setOrgCap(orgcap.cap.name,orgcap.activeWeb);
			
			},
			
			onJoinIncident : function(e, incident) {
				this.incidentId = incident.id;

				if(UserProfile.isOrgCapEnabled(this.reportType)){
					this.getView().enable();
				}
				else{
					this.getView().disable();
				}

				this.mediator.sendRequestMessage(Core.Config
						.getProperty(UserProfile.REST_ENDPOINT)
						+ "/reports/" + this.incidentId + '/' + this.reportType,
						this.loadEvt);

				this.newTopic = Ext.String.format(
						"iweb.NICS.incident.{0}.report.{1}.new", this.incidentId,
						this.reportType);
				this.mediator.subscribe(this.newTopic);
				this.newHandler = this.onLoadReports.bind(this);
				Core.EventManager.addListener(this.newTopic, this.newHandler);
			},

			onCloseIncident : function(e, incidentId) {
				this.mediator.unsubscribe(this.newTopic);

				Core.EventManager.removeListener(this.newTopic, this.newHandler);
				
				this.view.lookupReference("chatPanel").getStore().removeAll();
				this.view.lookupReference("chatPanel").view.refresh();

				this.getView().disable();
			},
			
			onLoadReports: function(e, response){
				var reports = [];
				if(response.reports){
					for(var i=0; i<response.reports.length; i++){
						reports.push(JSON.parse(response.reports[i].message));
					}
				}else if(response.message){
					reports.push(JSON.parse(response.message));
				}
				this.view.lookupReference("chatPanel").getStore().loadData(reports, true);
			},
			
			onRowDblClick: function(grid, record, tr, rowIndex, e, eOpts){
				if(record.data.text){
					Ext.MessageBox.alert("Chat Message", record.data.text);
				}
			},
			
			openChatRoom: function(){
				var panel = this.view.lookupReference("chatPanel");
				var selected = panel.getSelection();
				if(selected && selected.length == 1){
					var room = selected[0].data.collabRoomName;
					if(room && room != "SIMPOST"){
						Core.EventManager.fireEvent("nics.request.collabroom.open", selected[0].data.collabRoomName);
					}
				}
			},
			
			onPlotButtonClick: function(){}
		});
});
