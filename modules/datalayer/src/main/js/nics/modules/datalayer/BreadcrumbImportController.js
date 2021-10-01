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
define(['ext', 'ol', "iweb/CoreModule", "iweb/modules/MapModule",
		"nics/modules/UserProfileModule", "nics/modules/user/UserLookupView"],
	function(Ext, ol, Core, MapModule, UserProfile, UserLookupView){
	
		return Ext.define('modules.datalayer.BreadcrumbImportController', {
			extend : 'Ext.app.ViewController',
			
			alias: 'controller.datalayer.breadcrumbimportcontroller',
			
			intervalLayername: '{0}&viewparams=username:{1};interval:{2}',
			
			dateRangeLayername: '{0}&viewparams=username:{1};start:{2};end:{3}',

			teamLayername: '{0}&viewparams=username:{1};workspaceid:{2}',
			
			singleUser: true,
			
			init: function() {
				this.mediator = Core.Mediator.getInstance();
				this.lookupWindow = new UserLookupView({
					callback: { fnc: this.addUsers, scope: this}
				});
			},
			
			lookupSingleUser: function(){
				this.singleUser = true;
				this.showLookup();
			},
			
			addMobileUser: function(){
				this.singleUser = false;
				this.showLookup();
			},
			
			showLookup: function(){
				this.lookupWindow.controller.clearGrid();
				this.lookupWindow.show();
			},
			
			addUsers: function(selected) {
				if(selected && selected[0]){
					if(this.singleUser){
						this.lookupReference('breadcrumbsUser').setValue(selected[0].data.username);
					}else{
						this.lookupReference('mobileUsers').getStore().loadData(selected);
					}
				}
				this.lookupWindow.controller.clearGrid();
            },
            
            beforeUploadTeam: function(){
            	if(!Ext.isEmpty(this.lookupReference('trackingIcon').getValue())){
    				var form = this.lookupReference('trackingPanel').getForm();
    				var _this = this;
    				form.submit({
    					url: Ext.String.format('{0}/datalayer/{1}/icon', Core.Config.getProperty(UserProfile.REST_ENDPOINT), UserProfile.getWorkspaceId()),
    					waitMsg:  Core.Translate.i18nJSON('Uploading file...'),
    					success: function(fp, o) {
    						if(o && o.response && o.response.responseText){
    							var filename = JSON.parse(o.response.responseText).message;
    							_this.onUploadTeam(filename);
    						}
    					},
    					failure: function(fp, o) {
    						Ext.Msg.show({
    							title: Core.Translate.i18nJSON('File Import'),
    							message: Core.Translate.i18nJSON('Failed to upload your file.'),
    							buttons: Ext.Msg.OK,
    							icon: Ext.Msg.ERROR
    						});
    					}
    				});
            	}else{
            		this.onUploadTeam();
            	}
            },
            
            onUploadTeam: function(icon){
            	var datasourceid = Core.Config.getProperty("nics.track.datasourceid");
				var mobileGrid = this.lookupReference('mobileUsers');
				var mobileUsers = "";
				
				if(!datasourceid){
					Ext.MessageBox.alert(Core.Translate.i18nJSON("Tracking Layer"), 
							Core.Translate.i18nJSON("The datasource id for the tracking layer has not been configured."));
					return;
				}
				
				if(mobileGrid){
					var store = mobileGrid.getStore();
					if(store.getCount() == 1){
						mobileUsers = "'" + mobileGrid.getStore().getAt(0).data.username + "'";
					}else if(store.getCount() > 1){
						Ext.Array.forEach(store.getData().items, function(user){
							if(!Ext.isEmpty(mobileUsers)){
								mobileUsers += "%5C,";
							}
							mobileUsers += "'" + user.data.username + "'";
						});
					}
				}
				
				if(!Ext.isEmpty(mobileUsers)){
					var userSessionId = UserProfile.getUserSessionId();

					var layer = layer = Ext.String.format(this.teamLayername,
							Core.Config.getProperty("nics.track.team.layer"),
							mobileUsers, UserProfile.getWorkspaceId());
					
					var values = {
						displayname: this.lookupReference('displayname').getValue(),
						baselayer: false,
						usersessionid: userSessionId,
						datalayersource: {
							layername: layer,
							usersessionid: userSessionId,
							refreshrate: 30,
							stylepath: 'modules.datalayer.avltrackingrenderer'
						}
					};
					
					if(icon){
						values.datalayersource.styleicon =
							Ext.String.format("{0}/{1}", Core.Config.getProperty("nics.track.datalayer.icon.url"), icon);
					}
					
					var url = Ext.String.format('{0}/datalayer/{1}/sources/{2}/tracking/layer',
							Core.Config.getProperty(UserProfile.REST_ENDPOINT),
							UserProfile.getWorkspaceId(), datasourceid);
					
					this.mediator.sendPostMessage(url, 'nics.data.adddatalayer.wfs', values);
					return;
				}else{
					Ext.MessageBox.alert(Core.Translate.i18nJSON("Tracking Layer"), 
							Core.Translate.i18nJSON("Please select users to be added to the layer"));
					return;
				}
            },
           
			onUploadBreadcrumbs: function(){
				var trackLayer, layer;
				
				var datasourceid = Core.Config.getProperty("nics.track.datasourceid");
				var mobileUser = this.lookupReference('breadcrumbsUser').getValue();
				var segmentStyle = this.lookupReference('segmentStyle');
				var segmentCheckbox = this.lookupReference('segmentCheckbox');
				
				if(!Ext.isEmpty(mobileUser)){

					if(!Ext.isEmpty(this.lookupReference('hoursPast').getValue())){
						trackLayer = Core.Config.getProperty("nics.track.interval.layer");
						
						layer = Ext.String.format(this.intervalLayername, 
								trackLayer, mobileUser,
								this.lookupReference('hoursPast').getValue()
						);
					}else if(this.lookupReference('startDate').utcTime &&
						this.lookupReference('endDate').utcTime){
						trackLayer = Core.Config.getProperty("nics.track.date.layer");
						
						layer = Ext.String.format(this.dateRangeLayername, 
								trackLayer, mobileUser,
								this.lookupReference('startDate').utcTime,
								this.lookupReference('endDate').utcTime
						);
					}
					
					if(!trackLayer){
						Ext.MessageBox.alert(Core.Translate.i18nJSON("Tracking Layer"), 
								Core.Translate.i18nJSON("The tracking layer has not been configured. Please choose a time range or interval."));
						return;
					}
					
					if(!datasourceid){
						Ext.MessageBox.alert(Core.Translate.i18nJSON("Tracking Layer"), 
								Core.Translate.i18nJSON("The datasource id for the tracking layer has not been configured."));
						return;
					}

					var pointType = segmentStyle.getValue().type;
					
					var userSessionId = UserProfile.getUserSessionId();
					
					var values = {
						displayname: this.lookupReference('displayname').getValue(),
						baselayer: false,
						usersessionid: userSessionId,
						datalayersource: {
							layername: layer,
							usersessionid: userSessionId,
							refreshrate: 30,
							stylepath: 'modules.datalayer.avlbreadcrumbrenderer',
						}
					};

					if(pointType){
						values.datalayersource.styleicon =
							Ext.String.format("{0}/{1}", Core.Config.getProperty("nics.track.datalayer.icon.url"), pointType);
					}

					if(segmentCheckbox.checked){
						values.datalayersource.attributes = JSON.stringify({ segment: true });
					}

					if(!pointType && !segmentCheckbox.checked){
						//if no style is chosen use point
						values.datalayersource.styleicon =
							Ext.String.format("{0}/{1}", Core.Config.getProperty("nics.track.datalayer.icon.url"), "point.png");
					}
					
					var url = Ext.String.format('{0}/datalayer/{1}/sources/{2}/layer',
							Core.Config.getProperty(UserProfile.REST_ENDPOINT),
							UserProfile.getWorkspaceId(), datasourceid);
					
					this.mediator.sendPostMessage(url, 'nics.data.adddatalayer.wfs', values);
					
				}else{
					Ext.MessageBox.alert(Core.Translate.i18nJSON("Tracking Layer"), 
							Core.Translate.i18nJSON("Please select users to be added to the layer"));
					return;
				}
			},
			
			pickDate: function(dp, date){
				var datePicker = this.getDatePicker();
				
				if(!Ext.isEmpty(datePicker.getRefItems()[1].getValue())) {
					var time = datePicker.getRefItems()[1].getValue();

					date.setHours(time.getHours());
					date.setMinutes(time.getMinutes());
				}
				
				datePicker.inputBox.setValue(Ext.Date.format(date, 'Y-m-d h:i:ss'));
				datePicker.inputBox.utcTime = date.toISOString();
				datePicker.hide();
		    },
		    
		    showPicker: function(button){
		    	var picker = this.getDatePicker();
		    	picker.inputBox = this.lookupReference(button.reference + 'Date');
		    	this.getDatePicker().show();
		    },
			
			getDatePicker: function(){
		    	if(!this.datePicker){
		    		var handler = this.pickDate.bind(this);
					this.datePicker = Ext.create('Ext.Window', {
			 			layout: 'vbox',
			 			close: 'hide',
			 			items:[{
			 		        xtype: 'timefield',
			 		        increment: 15,
			                reference: 'timePicker',
			 		    },{
		                	xtype: 'datepicker',
		                	reference: 'datePicker',
		                	handler: handler
						}]
			 		});
		    	}
		    	return this.datePicker;
		    },
		    
		    clearDates: function(){
		    	var startDate = this.view.lookupReference('startDate');
				var endDate = this.view.lookupReference('endDate');
				
				startDate.setValue("");
				
				endDate.setValue("");
		    },
		    
		    clearMobileGrid: function(){
		    	this.lookupReference('mobileUsers').store.removeAll();
				this.lookupReference('mobileUsers').view.refresh();
		    },
		    
		    onTrackingExpand: function(){
		    	this.lookupReference('breadcrumbPanel').collapse();
		    },
		    
		    onBreadcrumbExpand: function(){
		    	this.lookupReference('trackingPanel').collapse();
		    },
		    
		    onHoursPast: function(checkbox, checked){
		    	this.lookupReference('startDate').setDisabled(checked);
		    	this.lookupReference('start').setDisabled(checked);
		    	this.lookupReference('endDate').setDisabled(checked);
		    	this.lookupReference('end').setDisabled(checked);
		    	this.lookupReference('hoursPast').setDisabled(!checked);
		    },

			onPointStyle: function(checkbox, checked){
				var styleRadioGroup = this.lookupReference('segmentStyle');
				styleRadioGroup.setDisabled(!checked);
				if(!checked){
					styleRadioGroup.reset();
				}
			}
		});
});
