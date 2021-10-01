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
define([
    "ext",
    "ol",
    "iweb/CoreModule",
    "nics/modules/UserProfileModule",
    "./ArcGISSessionManager",
], function(Ext, ol, Core, UserProfile, SessionManager) {
    return Ext.define("modules.datalayer.ArcGISDatasourceImportController", {
        extend: "Ext.app.ViewController",

        alias: "controller.datalayer.arcgisdatasourceimportcontroller",

        orgListTopic: "nics.fileimport.orgs",

        init: function() {
            this.dataSourceType = this.getView().dataSourceType;
            this.capabilitiesFormat = this.getView().capabilitiesFormat;
            this.workspaceId = this.getView().workspaceId;

            this.mediator = Core.Mediator.getInstance();

            this.updateGridTitle();
            this.bindEvents();

            this.loadDataSources();

            this.folders = [];

            var treeview = this.getView().lookupReference("grid").getView();
            treeview.on("afteritemexpand", this.onItemExpanded, this);
        },

        bindEvents: function() {
            //Bind UI Elements
            Core.EventManager.addListener(
                UserProfile.PROFILE_LOADED,
                this.onLoadUserProfile.bind(this)
            );
            Core.EventManager.addListener(
                this.orgListTopic,
                this.onLoadOrgs.bind(this)
            );
            Core.EventManager.addListener(
                "nics.data.loaddatasources." + this.dataSourceType,
                this.onLoadDataSources.bind(this)
            );
            Core.EventManager.addListener(
                "nics.data.adddatasource." + this.dataSourceType,
                this.onAddDatasource.bind(this)
            );
            Core.EventManager.addListener(
                "nics.data.adddatalayer." + this.dataSourceType,
                this.onAddDatalayer.bind(this)
            );
            Core.EventManager.addListener(
                "nics.incident.join",
                this.onJoinIncident.bind(this)
            );
            Core.EventManager.addListener(
                "nics.incident.close",
                this.onCloseIncident.bind(this)
            );
            Core.EventManager.addListener(
                "nics.collabroom.load",
                this.onLoadCollabRooms.bind(this)
            );
            Core.EventManager.addListener(
                "nics.folders.load",
                this.onLoadFolders.bind(this));
            Core.EventManager.addListener(
                "nics.folders.remove",
                this.onRemoveFolder.bind(this));
            Core.EventManager.addListener(
                "nics.folders.update",
                this.onUpdateFolder.bind(this));

        },

        onRemoveFolder: function(e, folderids){
            var folderCombo = this.getView().lookupReference('folderCombo');
            Ext.Array.forEach(folderids, function(folderId) {
                var index = folderCombo.store.find("folderid", folderId);
                if (index != -1) {
                    folderCombo.store.removeAt(index);
                }
            });
        },

        onUpdateFolder: function(e, folderId, foldername){
            var folderCombo = this.getView().lookupReference('folderCombo');
            var record = folderCombo.getStore().findRecord("folderid",folderId);
            if(record){
                if(record.get("foldername") != foldername) {
                    record.set("foldername", foldername);
                }
            }
        },

        onLoadFolders: function(e, folders){
            var folderCombo = this.getView().lookupReference('folderCombo');
            if(folderCombo.store.getCount() == 0) {
                folderCombo.store.insert(0, {folderid: 'none', name: '&nbsp;'});
            }
            folderCombo.store.loadData(folders, true);
            folderCombo.store.autoSync = false;
        },

        onLoadUserProfile: function(e) {
            var url = Ext.String.format(
                "{0}/orgs/{1}?userId={2}",
                Core.Config.getProperty(UserProfile.REST_ENDPOINT),
                UserProfile.getWorkspaceId(),
                UserProfile.getUserId()
            );

            this.mediator.sendRequestMessage(url, this.orgListTopic);
        },

        onLoadOrgs: function(evt, response) {
            if (response && response.organizations) {
                var orgCombo = this.getView().getOrgCombo();
                orgCombo.store.loadData(response.organizations);
                orgCombo.store.autoSync = false;
                orgCombo.store.insert(0, { orgId: "none", name: "&nbsp;" });
            }
        },

        onJoinIncident: function(evt, incident) {
            // Send a request for the list of collab rooms for this incident
            this.mediator.sendRequestMessage(
                this.getLoadCollabRoomUrl(incident.id, UserProfile.getUserId()),
                "nics.collabroom.load"
            );
        },

        onCloseIncident: function(evt, incidentId) {
            // Clear and disable the collab room selector,
            // since the user is no longer in the incident
            this.getView().getCollabroomCombo().clearValue();
        },

        onLoadCollabRooms: function(evt, response) {
            if (response) {
                var rooms = response.results;
                var roomCombo = this.getView().getCollabroomCombo();
                // Populate the collab room selector
                roomCombo.store.loadData(rooms);
                roomCombo.store.autoSync = false;
                roomCombo.store.insert(0, { collabroomId: "none", name: "&nbsp;" });
            }
        },

        updateGridTitle: function() {
            var panelTitle = this.getView().getTitle();

            var grid = this.getView().getGrid();
            var gridTitle = grid.getTitle();
            grid.setTitle(panelTitle + " " + gridTitle);
        },

        loadDataSources: function() {
            var url = Ext.String.format(
                "{0}/datalayer/{1}/sources/{2}",
                Core.Config.getProperty(UserProfile.REST_ENDPOINT),
                UserProfile.getWorkspaceId(),
                this.dataSourceType
            );
            this.mediator.sendRequestMessage(
                url,
                "nics.data.loaddatasources." + this.dataSourceType
            );
        },

        onLoadDataSources: function(evt, data) {
            //this.getView().getGrid().getStore().loadRawData(rawData);

            var root = this.lookupReference("grid").getRootNode();
            data.datasources &&
                data.datasources.forEach(function(ds) {
                    var url = ds.internalurl;
                    root.appendChild({
                        datasourceid: ds.datasourceid,
                        displayname: ds.displayname,
                        secure: ds.secure,
                        internalurl: url,
                        leaf: url.endsWith("FeatureServer/") || url.endsWith("MapServer/"),
                        lazyLoaded: false,
                    });
                });
        },

        isNewRoot: function(record) {
            return record.phantom && record.parentNode && record.parentNode.isRoot();
        },

        onAddDataSourceClick: function() {
            var grid = this.getView().getGrid(),
                store = grid.getStore(),
                rowEditPlugin = grid.getPlugin("rowediting");

            var newRecords = store.getNewRecords();
            if (newRecords && newRecords.length) {
                rowEditPlugin.startEdit(newRecords[0], 0);
            } else {
                var records = store.getRoot().insertChild(0, {});
                rowEditPlugin.startEdit(records, 0);
            }
        },

        onDeleteDataSourceClick: function() {
            var grid = this.getView().getGrid(),
                store = grid.getStore();

            var record = grid.getSelectionModel().getSelection()[0];
            if(record){

                Ext.MessageBox.confirm(
                    Core.Translate.i18nJSON('Delete Datasource?'),
                    Core.Translate.i18nJSON('Are you sure you want delete this datasource?'),
                    function(btn){
                        if (btn !== 'yes') {
                            return;
                        }
                        var topic = Core.Util.generateUUID();

                        Core.EventManager.createCallbackHandler(topic, this,
                            function(evt, response){
                                if(response.count != 1){
                                    Ext.MessageBox.alert(Core.Translate.i18nJSON("Data Source Error"),
                                        Core.Translate.i18nJSON(response.message));
                                }else{
                                    store.remove(record);
                                }
                            });

                        var url = Ext.String.format("{0}/datalayer/{1}/datasource/{2}",
                            Core.Config.getProperty(UserProfile.REST_ENDPOINT),
                            UserProfile.getWorkspaceId(), record.data.datasourceid);

                        this.mediator.sendDeleteMessage(url, topic);
                    }, this);
            }else{
                Ext.MessageBox.alert(Core.Translate.i18nJSON("NICS"),
                    Core.Translate.i18nJSON("Please select a datasource."));
            }
        },

        onGridBeforeEdit: function(editor, context, eOpts) {
            var record = context.record;
            //only allow editing phantom records
            return this.isNewRoot(record);
        },

        onGridCancelEdit: function(editor, context, eOpts) {
            var grid = this.getView().getGrid(),
                store = grid.getStore();

            var record = context.record;
            //remove phantom on cancel edit
            store.getRoot().removeChild(record);
        },

        onGridEdit: function(editor, context, eOpts) {
            var record = context.record;

            Ext.Msg.show({
                title: Core.Translate.i18nJSON("Secure"),
                message: Core.Translate.i18nJSON(
                    "Would you like to secure the datasource?"
                ),
                buttons: Ext.Msg.YESNO,
                icon: Ext.Msg.QUESTION,
                fn: function(btn) {
                    if (btn === "yes") {
                        record.set('secure', true);
                    }

                    this.getAuthenticatedCapabilities(record)
                        .then(function() {
                            this.storeDatasource(record);
                        }.bind(this))
                        .catch(function() {
                            var rowEditPlugin = this.getView()
                                .getGrid()
                                .getPlugin("rowediting");
                            rowEditPlugin.startEdit(record, 0);
                        }.bind(this));
                },
                scope: this
            });
        },

        /**
         * Add a slash to the end of a url, safely preserving the query string
         * @param {*} urlString 
         * @returns The urlString with a trailing slash added if necessary
         */
        addTrailingURLSlash: function(urlString) {
            if (!urlString.length) {
                return urlString;
            }
            var url = new URL(urlString);
            if (!url.pathname.endsWith("/")) {
                url.pathname += "/";
            }
            return url.toString();
        },
        
        /**
         * Add a slash to the end of a url, safely preserving the query string
         * @param {*} urlString 
         * @returns The urlString with a trailing slash added if necessary
         */
        addTrailingSlash: function(url) {
            if (url.length && !url.endsWith("/")) {
                url += "/";
            }
            return url;
        },

        storeDatasource: function(record) {
            var values = {
                displayname: record.get("displayname"),
                internalurl: this.addTrailingURLSlash(record.get("internalurl")),
                legend: record.get("legend"),
            };

            if (record.get("secure")) {
                values.username = "true";
                values.password = "true";
            }

            var url = Ext.String.format(
                "{0}/datalayer/{1}/sources/{2}",
                Core.Config.getProperty(UserProfile.REST_ENDPOINT),
                UserProfile.getWorkspaceId(),
                this.dataSourceType
            );
            this.mediator.sendPostMessage(
                url,
                "nics.data.adddatasource." + this.dataSourceType,
                values
            );
        },

        onAddDatasource: function(evt, response) {
            var newSources = response.datasources;
            if (newSources.length) {
                var grid = this.getView().getGrid();
                var newRecord = grid.getStore().getNewRecords()[0];
                if (newRecord) {
                    var session = SessionManager.getSession(newRecord.getId());
                    SessionManager.removeSession(newRecord.getId());

                    newRecord.set(newSources[0]);
                    newRecord.commit();

                    //update session id in session manager
                    SessionManager.addSession(newRecord.getId(), session);
                }
                

                this.getView().getGrid().getSelectionModel().deselect(newRecord);
            } else {
                Ext.Msg.show({
                    title: Core.Translate.i18nJSON("Data Source"),
                    message: Core.Translate.i18nJSON(
                        "There was a problem saving the datasource"
                    ),
                    buttons: Ext.Msg.OK,
                    icon: Ext.Msg.ERROR,
                });
            }
        },

        getAuthenticatedCapabilities: function(record) {
            record.set("loading", true);
            var promise = Promise.resolve(null);

            var parentRoot = this.getParentDatasourceNode(record);
            if (parentRoot.get('secure')) {
                promise = SessionManager.getRequestSession(parentRoot.getId());
            }

            return promise
                .then(function(session) {
                    return this.getCapabilities(record, session);
                }.bind(this))
                .then(function() {
                    record.set("loading", false);
                });
        },

        getCapabilities: function(record, session) {
            var capsUrl = new URL(record.get("internalurl"));
            capsUrl.pathname = this.addTrailingSlash(capsUrl.pathname);
            capsUrl.searchParams.set('f', 'json');
            if (session && session.token) {
                capsUrl.searchParams.set('token', session.token);
            }

            record.set("loading", true);

            var dataSourceType = this.dataSourceType;

            return this.proxyCapabilityRequest(capsUrl.toString())
                .then(function(response) {
                    record.set("loading", false);
                    record.set("lazyLoaded", true);
                    var caps = this.capabilitiesFormat.read(response.responseText);
                    if (!caps || (!caps.layers && !caps.services && !caps.folders)) {
                        throw new Error("Failed to parse capabilities");
                    }

                    var layers = caps.layers,
                        services = caps.services,
                        folders = caps.folders,
                        version = caps.version;

                    //ensure every layer has a title to display
                    if (folders && folders.length) {
                        record.set("expanded", true);
                        folders.forEach(function(fldr) {
                            var url = new URL(capsUrl);
                            url.pathname += fldr;
                            var newRec = record.appendChild({
                                displayname: fldr,
                                internalurl: url.toString(),
                                folder: fldr + "/",
                                leaf: false
                            });
                            newRec.phantom = false;
                        });
                        record.set("leaf", false);
                    }

                    if (services && services.length) {
                        record.set("expanded", true);
                        services.forEach(function(svc) {
                            if (svc.type == "FeatureServer" || svc.type == "MapServer") {
                                var url;
                                if (svc.url) {
                                    url = svc.url + capsUrl.search;
                                } else {
                                    //services sometimes repeat their folder prefix
                                    var folder = record.get("folder");
                                    if (folder && svc.name.startsWith(folder)) {
                                        svc.name = svc.name.replace(folder, "");
                                    }
                                    var rooturl = new URL(capsUrl);
                                    rooturl.pathname += svc.name + "/" + svc.type;
                                    url = rooturl.toString();
                                }

                                var newRec = record.appendChild({
                                    displayname: svc.name,
                                    internalurl: url,
                                    leaf: true
                                });
                                newRec.phantom = false;
                            }
                        });
                        record.set("leaf", false);
                    }

                    //ensure every layer has a title to display
                    if (layers && layers.length) {
                        layers.forEach(function(layer) {
                            if (!layer.Title && layer.Name) {
                                layer.Title = layer.Name;
                            }
                            if (dataSourceType == "arcgisrest" || dataSourceType == "arcfs") {
                                layer.Title = layer.name;
                                layer.Name = layer.id;
                            }
                        });
                        record.set("layers", layers, { silent: true });
                    }
                    record.set("version", version, { silent: true });
                }.bind(this))
                .catch(function(error) {
                    record.set("loading", false);
                    record.set("lazyLoaded", true);
                    record.set("layers", [], { silent: true });
                    Ext.Msg.show({
                        title: Core.Translate.i18nJSON("Data Source"),
                        message: Core.Translate.i18nJSON(
                            "Failed to retrieve service capabilities"
                        ),
                        buttons: Ext.Msg.OK,
                        icon: Ext.Msg.ERROR,
                    });
                }.bind(this));
        },

        proxyCapabilityRequest: function(url) {
            return new Promise(function(resolve, reject) {
                Ext.Ajax.request({
                    url:
                        window.location.protocol +
                        "//" +
                        window.location.host +
                        "/nics/proxy",
                    method: "GET",
                    params: {
                        url: url,
                    },
                    success: resolve,
                    failure: reject,
                });
            });
        },

        onGridSelectionChange: function(store, selected, eOpts) {
            this.setFormDisabled(true);

            var record = selected.length && selected[0];
            if (record) {
                this.focusOnRecord(record);
            }
        },

        onItemExpanded: function(record) {
            this.focusOnRecord(record);
        },

        focusOnRecord: function(record) {
            var lazyLoaded = record.get("lazyLoaded");
            var loading = record.get("loading");
            if (!loading && !lazyLoaded && !this.isNewRoot(record)) {
                this.getAuthenticatedCapabilities(record)
                    .then(function() {
                        this.focusOnRecord(record);
                    }.bind(this));
                return;
            }

            var layers = record.get("layers");
            if (layers != null) {
                this.getView().getLayerCombo().getStore().loadData(layers);
                this.setFormDisabled(false);
                this.resetDatalayerForm();
            }
        },

        onComboChange: function(combo, newValue, oldValue, eOpts) {
            //default the display name to the combo display value
            var input = this.getView().getLabelInput();
            input.setValue(combo.getRawValue());
        },

        onFormValidityChange: function(field, valid, eOpts) {
            var combo = this.getView().getLayerCombo(),
                input = this.getView().getLabelInput();

            var bothValid = combo.isValid() && input.isValid();
            this.getView().getImportButton().setDisabled(!bothValid);
        },

        getParentDatasourceNode: function(record) {
            var rec = record;
            while (rec.parentNode && !rec.parentNode.isRoot()) {
                rec = rec.parentNode;
            }
            return rec;
        },

        getSubPath: function(path, rootPath) {
            return path.substring(rootPath.length);
        },

        removeQueryStr: function(urlString) {
            if (!urlString.length) {
                return urlString;
            }
            var url = new URL(urlString);
            url.search = "";
            return url.toString();
        },

        onImportClick: function() {
            var grid = this.getView().getGrid(),
                combo = this.getView().getLayerCombo(),
                input = this.getView().getLabelInput(),
                legend = this.getView().getLegendInput(),
                refreshRate = this.getView().getRefreshRateCombo(),
                orgCombo = this.getView().getOrgCombo(),
                collabroomCombo = this.getView().getCollabroomCombo();

            var record = grid.getSelectionModel().getSelection()[0];
            var rootParent = this.getParentDatasourceNode(record);
            var datasourceid = rootParent.getId();
            var userSessionId = UserProfile.getUserSessionId();

            // tokens will be respected/preserved on the datasource url, not on the datalayersource
            var parentPath = this.addTrailingSlash(this.removeQueryStr(rootParent.get("internalurl")));
            var subpath = this.getSubPath(this.removeQueryStr(record.get("internalurl")), parentPath);
            subpath = this.addTrailingSlash(subpath);

            var values = {
                displayname: input.getValue(),
                baselayer: false,
                usersessionid: userSessionId,
                datalayersource: {
                    layername: subpath + combo.getValue(),
                    usersessionid: userSessionId,
                    refreshrate: refreshRate.getValue(),
                },
                legend: legend.getValue(),
            };

            if (orgCombo.getValue()) {
                values.datalayerOrgs = [
                    {
                        orgid: orgCombo.getValue(),
                    },
                ];
            }

            if (collabroomCombo.getValue()) {
                values.collabroomDatalayers = [
                    {
                        collabroomid: collabroomCombo.getValue(),
                    },
                ];
            }

            var version = record.get("version");
            if (version) {
                values.datalayersource.attributes = JSON.stringify({
                    version: version,
                });
            }

            var url = Ext.String.format(
                "{0}/datalayer/{1}/sources/{2}/layer",
                Core.Config.getProperty(UserProfile.REST_ENDPOINT),
                UserProfile.getWorkspaceId(),
                datasourceid);

            var folderCombo = this.getView().lookupReference('folderCombo');
            if(folderCombo && !Ext.isEmpty(folderCombo.getValue())){
                url = Ext.String.format("{0}?folderId={1}",
                    url, folderCombo.getValue());
            }

            this.mediator.sendPostMessage(
                url,
                "nics.data.adddatalayer." + this.dataSourceType,
                values
            );
        },

        onAddDatalayer: function(evt, response) {
            var newLayers = response.datalayers;
            if (response.message == "OK") {
                Ext.Msg.show({
                    title: Core.Translate.i18nJSON("Data Layer"),
                    message: Core.Translate.i18nJSON(
                        "Your new data layer has been created"
                    ),
                    buttons: Ext.Msg.OK,
                    icon: Ext.Msg.INFO,
                });
                this.resetDatalayerForm();
            } else {
                Ext.Msg.show({
                    title: Core.Translate.i18nJSON("Data Layer"),
                    message: Core.Translate.i18nJSON(
                        "There was a problem saving the datasource"
                    ),
                    buttons: Ext.Msg.OK,
                    icon: Ext.Msg.ERROR,
                });
            }
        },

        resetDatalayerForm: function() {
            this.getView().getLabelInput().setValue("");
            this.getView().getLayerCombo().reset();
            this.getView().getImportButton().disable();
            this.getView().getLegendInput().reset();
            this.getView().getRefreshRateCombo().reset();
            this.getView().getOrgCombo().reset();
            this.getView().getCollabroomCombo().reset();
        },

        /**
         * Sets whether all out form elements should be disabled or not
         *
         * Necessary because fieldset.disable also mask all our inputs
         */
        setFormDisabled: function(disabled) {
            this.getView().getLabelInput().setDisabled(disabled);
            this.getView().getLayerCombo().setDisabled(disabled);
            this.getView().getImportButton().setDisabled(disabled);
            this.getView().getLegendInput().setDisabled(disabled);
            this.getView().getRefreshRateCombo().setDisabled(disabled);
            this.getView().getOrgCombo().setDisabled(disabled);
            this.getView().getCollabroomCombo().setDisabled(disabled);
            this.getView().lookupReference("folderCombo").setDisabled(disabled);
        },

        getLoadCollabRoomUrl: function(incidentId, userid) {
            return Ext.String.format(
                "{0}/collabroom/{1}?userId={2}",
                Core.Config.getProperty(UserProfile.REST_ENDPOINT),
                incidentId,
                userid
            );
        },
    });
});
