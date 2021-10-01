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
define(['ext', 'iweb/CoreModule', 'nics/modules/UserProfileModule', './IncidentTypeViewModel', './IncidentTypeView',
    './IncidentTypeFormTypeView'],
    function(Ext, Core, UserProfile, IncidentTypeViewModel, IncidentTypeView, IncidentTypeFormTypeView) {

        return Ext.define('modules.administration.IncidentTypeController', {
            extend: 'Ext.app.ViewController',

            alias: 'controller.incidenttypecontroller',
            
            defaultTypes: true,
            
            topic: "iweb.NICS.orgincidenttypes.{0}.update",
            
            init: function() {
                this.mediator = Core.Mediator.getInstance();
                this.bindEvents();

            },
            
            bindEvents: function() {
                //Bind UI Elements
                this.getView().getFirstGrid().getView().on('drop', this.activateIncidentType, this);
                this.getView().getSecondGrid().getView().on('drop', this.deactivateIncidentType, this);
            },

            //onOrgChange
            loadIncidentTypes: function(evt, orgId) {
            	//Remove existing listeners
                if(this.updateTopic && this.updateHandler){
                	this.mediator.unsubscribe(this.updateTopic);
                	Core.EventManager.removeListener(this.updateTopic, this.updateHandler);
                }
                
                this.orgId = orgId;
                
                this.updateTopic = Ext.String.format(this.topic, this.orgId);
                
                this.updateHandler = this.updateIncidentTypeData.bind(this);
                
                this.mediator.subscribe(this.updateTopic);
                
                Core.EventManager.addListener(this.updateTopic, this.updateHandler);
                
                this.loadIncidentTypeData();
            },
            
            //Boolean indicating whether this organization has default types (true)
            //Or has custom types (false)
            setDefaultTypes: function(defaultTypes){
            	this.defaultTypes = defaultTypes;
            },
            
            //Handler for updates to this organization's incidentTypes
            updateIncidentTypeData: function(evt, response){
            	this.getView().clearGrids();
            	
            	this.updateGridView(this.getView().getFirstGrid(), //Active Grid
            						this.getView().getSecondGrid(), //Inactive Grid
            						response.entity);
            	this.setDefaultTypes(false);
            },
            
            //Update both grids with new active/inactive data
            updateGridView: function(activeGrid, inactiveGrid, response){
                var incidentTypes = [];

                if(response.activeIncidentTypes && response.activeIncidentTypes.length > 0){
                    for(var i=0; i<response.activeIncidentTypes.length; i++){
                        var orgincidenttype = response.activeIncidentTypes[i];
                        incidentTypes.push({
                            defaultType: orgincidenttype.defaulttype,
                            incidentTypeName: orgincidenttype.incidenttype.incidentTypeName,
                            orgIncidenttypeid: orgincidenttype.orgIncidenttypeid,
                            incidentTypeId: orgincidenttype.incidenttypeid
                        });
                    }
                }else{
                    incidentTypes = response.defaultIncidentTypes;
                }

            	activeGrid.getStore().add(incidentTypes);
            	
            	if(response.inactiveIncidentTypes && response.inactiveIncidentTypes.length >0){
            		inactiveGrid.getStore().add(response.inactiveIncidentTypes);
            	}
            },

            //Refresh the grids with that organization's information
            loadIncidentTypeData: function() {

                this.getView().clearGrids();
            	
                var topic = Core.Util.generateUUID();
                var activeGrid = this.getView().getFirstGrid();
                var inactiveGrid = this.getView().getSecondGrid();
                
                var _this = this;
                Core.EventManager.createCallbackHandler(topic, this,
                    function(activeGrid, inactiveGrid, evt, response) {
	                	_this.updateGridView(activeGrid, inactiveGrid, response);
	                	_this.setDefaultTypes(response.defaultIncidentTypes != null 
	                			&& response.defaultIncidentTypes.length > 0);
                	},[activeGrid, inactiveGrid]);

                var url = Ext.String.format('{0}/orgs/{1}/incidenttype/{2}',
                    Core.Config.getProperty(UserProfile.REST_ENDPOINT),
                    UserProfile.getWorkspaceId(), this.orgId);

                this.mediator.sendRequestMessage(url, topic);

            },

            //An update to the active grid
            activateIncidentType: function(node, data, dropRec, dropPosition) {
            	if(!this.defaultTypes){
            		var list = this.buildIncidentTypeList(node, data, dropRec, dropPosition);
            		this.updateIncidentType("add", list);
            	}else{
            		this.setInitialIncidentTypes();
            	}
            },

            //An update to the inactive grid
            deactivateIncidentType: function(node, data, dropRec, dropPosition) {
            	if(!this.defaultTypes){
            		var list = this.buildIncidentTypeList(node, data, dropRec, dropPosition);
            		this.updateIncidentType("remove", list);
            	}else{
            		this.setInitialIncidentTypes();
            	}
            },
            
            /** Add initial set of incident types to org_incidenttype table
             * No need to "remove" because the organization has no types set yet
            */
            setInitialIncidentTypes: function(){
            	var activeData = this.getView().getFirstGrid().getStore().getData();
                
            	var incidentTypeIds = [];
                activeData.each(function(record){
                	incidentTypeIds.push(record.data.incidentTypeId);
                });
                
                this.updateIncidentType("add", incidentTypeIds);
            },

            persistDefaultTypes: function(){
                var activeData = this.getView().getFirstGrid().getStore().getData();
                activeData.each(function(record){
                    if(record.data.defaultType) {
                        this.onDefaultChange(this.getView().getFirstGrid(),
                            -1, record.data.defaultType, record);
                    }
                });
            },
            
            //Send update message
            updateIncidentType: function(type, incidentTypeList){
            	var topic = Core.Util.generateUUID();
            	
            	var _this = this;
                Core.EventManager.createCallbackHandler(topic, this,
                    function(evt, response) {
                		if(response.message != "OK"){
                			//TODO: Translate
                			Ext.MessageBox.alert("Incident Type", response.message);
                		}
                		//Successfully completed update, set to false
                		else if(this.defaultTypes){
                			this.defaultTypes = false;
                			this.persistDefaultTypes();
                		}
                	});
                
                var url = Ext.String.format('{0}/orgs/{1}/incidenttype/{2}/{3}',
                    Core.Config.getProperty(UserProfile.REST_ENDPOINT),
                    UserProfile.getWorkspaceId(), type, this.orgId);

                this.mediator.sendPostMessage(url, topic, incidentTypeList);
            },

            onDefaultChange: function(column, rowIndex){

                if(this.defaultTypes){
                    this.setInitialIncidentTypes();
                }else {
                    var store = this.getView().getFirstGrid().getStore();

                    if(store) {
                        var record = store.getData().getAt(rowIndex);

                        var topic = Core.Util.generateUUID();

                        Core.EventManager.createCallbackHandler(topic, this,
                            function (evt, response) {
                                if (response.message != "OK") {
                                    //TODO: Translate
                                    Ext.MessageBox.alert("Incident Type", response.message);
                                }
                            });

                        var url = Ext.String.format('{0}/orgs/{1}/incidenttype/default/{2}',
                            Core.Config.getProperty(UserProfile.REST_ENDPOINT),
                            UserProfile.getWorkspaceId(), this.orgId);

                        var orgIncidentType = {
                            orgIncidenttypeid: record.data.orgIncidenttypeid,
                            defaulttype: record.data.defaultType
                        };

                        this.mediator.sendPostMessage(url, topic, orgIncidentType);
                    }
                }
            },

            //Build an incident list from dropped view item
            buildIncidentTypeList: function(node, data, dropRec, dropPosition) {
                var incidentTypeList = [];
                for (var i = 0; i < data.records.length; i++) {
                    var record = data.records[i];
                    incidentTypeList.push(data.records[i].data.incidentTypeId);
                }

                return incidentTypeList;
            },

            addIncidentType: function(eOpts) {
                //Make grid editable
                var grid = this.getView().getSecondGrid(),
                    store = grid.getStore(),
                    rowEditPlugin = grid.getPlugin('rowediting');

                var records = store.insert(0, {
                    incidentTypeName: '', incidentTypeId: ''
                });
                rowEditPlugin.startEdit(records[0], 0);
            },

            onGridEdit: function(editor, context, eOpts) {

                var _grid = editor.grid;

                var incidentType = {
                    incidentTypeName: context.record.data.incidentTypeName
                };
                if(_grid.getStore().getNewRecords().length == 0){
                    incidentType.incidentTypeId = context.record.data.incidentTypeId;
                }
                var topic = Core.Util.generateUUID();
                Core.EventManager.createCallbackHandler(topic, this,
                    function(evt, response){
                        var newRecord = _grid.getStore().getNewRecords()[0];
                        if(response.message == "OK") {
                            if(newRecord) {
                                if(response.incidentTypes && response.incidentTypes[0]){
                                    newRecord.set("incidentTypeId", response.incidentTypes[0].incidentTypeId);
                                    newRecord.commit();
                                    grid.getSelectionModel().deselect(newRecord);
                                }else{
                                    Ext.MessageBox.alert("NICS",
                                        "There was an error creating a new incident type");
                                    newRecord.store.remove(newRecord);
                                }
                            }else{
                                var selection = _grid.getSelection();
                                if(selection[0]){
                                    selection[0].commit();
                                    _grid.getSelectionModel().deselect(selection[0]);
                                }
                            }
                        }else{
                            Ext.MessageBox.alert("NICS", response.message);
                            //Handle the "new record" or "not committed"
                            if(newRecord){
                                newRecord.store.remove(newRecord);
                            }
                        }
                    }
                );

                if(incidentType.incidentTypeId){
                    //PUT /incidents/{workspaceId}/incidenttypes/{incidentTypeId}
                    var url = Ext.String.format('{0}/incidents/{1}/incidenttypes/{2}',
                        Core.Config.getProperty(UserProfile.REST_ENDPOINT),
                        UserProfile.getWorkspaceId(),
                        incidentType.incidentTypeId);

                    this.mediator.sendPutMessage(url, topic, incidentType);
                }else{
                    //POST /incidents/{workspaceId}/incidenttypes where the body is an IncidentType
                    var url = Ext.String.format('{0}/incidents/{1}/incidenttypes',
                        Core.Config.getProperty(UserProfile.REST_ENDPOINT),
                        UserProfile.getWorkspaceId());

                    this.mediator.sendPostMessage(url, topic, incidentType);
                }
            },

            showManageReportTypesView: function() {

                // TODO:itft implement admin UI elsewhere?
                Ext.MessageBox.alert("TODO", "Implement alternative admin UI");

                /*if(!this.incidentTypeFormTypeWindow) {
                    this.incidentTypeFormTypeWindow = new IncidentTypeFormTypeView({
                        callback: {fnc: this.addIncidentType, scope: this} // TODO:itft use correct callback
                    });
                }

                this.incidentTypeFormTypeWindow.show();*/
            },

            addIncidentTypeFormTypes: function(incidentTypeFormTypes) {

            }
        });
    });
