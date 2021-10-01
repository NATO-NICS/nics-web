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
define(['ext', 'iweb/CoreModule','nics/modules/UserProfileModule' ],
         function(Ext, Core, UserProfile){
             var orgContextMenu = new Ext.menu.Menu({});

	return Ext.define('modules.administration.ArchiveController', {
		extend : 'Ext.app.ViewController',

		alias: 'controller.archivecontroller',

        init: function(){

            this.mediator = Core.Mediator.getInstance();
            this.rootName = "Archives";
            this.rootId;
            this.bindEvents();
        },
        bindEvents: function(){
            this.getView().getFirstGrid().getView().on('drop', this.activateIncident, this);

            var treeview = this.getView().lookupReference("treepanel1").getView();
            treeview.on('drop', this.onArchiveDrop, this);
            treeview.on("beforedrop", this.onBeforeTreeNodeDrop, this);
            treeview.on("nodedragover", this.onTreeNodeDragOver, this);
            treeview.on('afteritemexpand', this.lazyLoadFolder, this);


            //local callback topics
            Core.EventManager.addListener("nics.data.loadfolder.Archives",this.onLoadArchivedIncidents.bind(this));
            Core.EventManager.addListener("nics.data.newfolder.Archives",this.reLoadArchivedIncidents.bind(this));
            Core.EventManager.addListener("nics.data.renamefolder.Archives",this.reLoadArchivedIncidents.bind(this));
            Core.EventManager.addListener("nics.data.deletefolder.Archives",this.reLoadArchivedIncidents.bind(this));
            Core.EventManager.addListener("nics.data.movefolder.Archives",this.reLoadArchivedIncidents.bind(this));
            Core.EventManager.addListener("nics.data.createtree.archive", this.onCreateTree.bind(this));
        },

        clearGrids: function(){
            this.getView().clearGrids();
        },

        loadIncidents: function(evt, orgId){
            this.currentOrgId = orgId;
            this.getView().clearGrids();
            this.getView().clearTree();

            this.loadIncidentData(this.getView().getFirstGrid(), 'active', orgId);
            this.loadIncidentArchiveData(this.getView().getArchiveTree(), 'archived', orgId);
        },
        reLoadArchivedIncidents: function(evt, data){
            this.loadIncidentArchiveData(this.getView().getArchiveTree(), 'archived', this.currentOrgId);
        },

        loadIncidentData: function(grid, type, orgId){
            var topic = Core.Util.generateUUID();

            //populate the user grids
            Core.EventManager.createCallbackHandler(topic, this,
                function(evt, response){
                    if(response.data){
                        var data = [];
                        for(var i=0; i<response.data.length;i++){
                            data.push({
                                incidentid: response.data[i].incidentid,
                                incidentname: response.data[i].incidentname
                            });
                        }
                        grid.getStore().loadData(data);
                    }
                }
            );

            var url = Ext.String.format('{0}/incidents/{1}/{2}/{3}',
            Core.Config.getProperty(UserProfile.REST_ENDPOINT),
            UserProfile.getWorkspaceId(), type, orgId);

            this.mediator.sendRequestMessage(url, topic);
        },


        activateIncident: function(node, data, dropRec, dropPosition){

            this.updateIncident(node, data, dropRec, dropPosition, "activate");
            return true;
        },

        onArchiveDrop: function(node, data, dropRec, dropPosition){
            //IF this is an incident, archive it

            if (data.records[0].data.leaf || data.records[0].data.incidentid){
                //this is not a folder
                this.archiveIncident(node, data, dropRec, dropPosition);
            }
            else {
                //This is an archive folder
                this.moveFolder(node, data, dropRec, dropPosition);
            }


        },
        archiveIncident: function(node, data, dropRec, dropPosition){

            var record = data.records[0];
            var incidentId;
            if (record.data.incidentid ){
                incidentId = record.data.incidentid;
            }
            else{
            //This is an already archived incident being moved
                incidentId = record.data.id;

            }

            var topic = Core.Util.generateUUID();

            var _this = this;
            ///populate the user grids
            Core.EventManager.createCallbackHandler(topic, this,
                function(evt, response){
                    this.loadIncidents(null, this.currentOrgId);
                }
            );

            var url = Ext.String.format('{0}/incidents/{1}/archive/{2}/{3}',
                Core.Config.getProperty(UserProfile.REST_ENDPOINT),
                UserProfile.getWorkspaceId(), incidentId,dropRec.id );

            this.mediator.sendPostMessage(url, topic, {});

        },

        updateIncident: function(node, data, dropRec, dropPosition, type){
            for(var i=0;i<data.records.length;i++){
                var record = data.records[i];

                var topic = Core.Util.generateUUID();

                var _this = this;
                ///populate the user grids
                Core.EventManager.createCallbackHandler(topic, this,
                    function(evt, response){
                        this.loadIncidents(null, this.currentOrgId);
                    }


                );

                var url = Ext.String.format('{0}/incidents/{1}/{2}/{3}',
                    Core.Config.getProperty(UserProfile.REST_ENDPOINT),
                    UserProfile.getWorkspaceId(), type, record.data.id);

                this.mediator.sendPostMessage(url, topic, {});
            }

        },


        loadIncidentArchiveData: function(tree, type, orgId){
            var topic ='nics.data.createtree.archive';

            //add drag and drop support
            var treeview = this.getView().getArchiveTree().getView();
            treeview.addPlugin({
                ptype: 'treeviewdragdrop',
                containerScroll: true
            });

            var url = Ext.String.format('{0}/folder/{1}/incident/archived/{2}',
                Core.Config.getProperty(UserProfile.REST_ENDPOINT),
                UserProfile.getWorkspaceId(), orgId);
            this.mediator.sendRequestMessage(url, topic);
        },


        onItemContextMenu: function(view, record, item, index, event) {
        event.stopEvent();
        //ensure the right clicked item is selectedItem
            view.setSelection(record);
            var isLeaf = record.data.leaf;
            var isRootChild = record.parentNode && record.parentNode.isRoot();
            var newMenuItem = [{
                text: Core.Translate.i18nJSON('New'),
                handler: 'newFolder',
                scope: this,

            }];
            var renameMenuItem = [{
                text: Core.Translate.i18nJSON('Rename'),
                handler: 'renameFolder',
                scope: this
            }];
            var deleteMenuItem = [{
                text: Core.Translate.i18nJSON('Delete'),
                handler: 'deleteFolder',
                scope: this
            }];

            //setup and show our shared menu
            orgContextMenu.removeAll();
            orgContextMenu.add(newMenuItem);
            //Only show rename on child items, not on the root
            if(record.id != this.rootId){
                orgContextMenu.add(renameMenuItem);
            }
            //Only show delete on empty items, and not on the root
            if(record.childNodes.length == 0 && (record.id != this.rootId)){
                orgContextMenu.add(deleteMenuItem);
            }
            orgContextMenu.showAt(event.getXY());

        },
        onCreateTree: function(evt, data){

            this.createRoot(data.rootId);
            this.rootId = data.rootId;
            this.onLoadArchivedIncidents(evt, data);

        },

        onLoadArchivedIncidents: function(evt, data){
            var store = this.getView().getArchiveTree().getStore();
            //Get Archive folder
            var folder = store.getNodeById(data.rootId);
            if (folder) {
                folder.lazyLoaded = true;
                folder.set("loading", false);
            }

            //load the incidents as leaves
            if (data.incidents.length >0){
                for (i = 0; i<data.incidents.length; i++){
                    folder.appendChild({
                        id: data.incidents[i].incidentid,
                        text: data.incidents[i].incidentname,
                        leaf: true
                    });
                }
            }
            //Load the folders as folders
            if (data.folders.length > 0){
                for (i = 0; i<data.folders.length; i++){
                    folder.appendChild({
                        id: data.folders[i].folderid,
                        text: data.folders[i].foldername,
                        leaf: false
                    });
                }
            }




        },
        createRoot: function(rootId) {
            this.getView().getArchiveTree().setRootNode({
                text: Core.Translate.i18nJSON('Archives'),
                id: rootId,
                expanded: true
             });
        },

        onTreeNodeDragOver: function(targetNode, position, dragData, e, eOpts) {
            //we are only allowing appending
            var dragNode = dragData.records[0];
            return true;
           },
        onBeforeTreeNodeDrop: function(node, data, overModel, dropPosition, dropHandlers, eOpts) {
            switch(dropPosition) {
                case "before":

                    newParent = overModel.parentNode;

                    break;
                case "after":

                    newParent = overModel.parentNode;

                    break;
                case "append":

                    //We only allow append


                    var record = data.records[0];
                    //If we don't do this, we get a jquery error.
                    if (record.store !== this.getStore()) {
                        // Record from the grid. Take a copy ourselves
                        // because the built-in copying messes it up.
                        var newItem = {children: []};


                        Ext.iterate(record.data,function(field,value){

                            newItem[field] = value;
                        });

                        data.records = [newItem];

                        // Uncomment this if you want to remove the record from the grid
                        //record.store.remove(record);
                    }

                    return true;
                    break;
           }

        },
        listenAndSubscribe: function(topic, callback) {
            this.mediator.subscribe(topic);
            Core.EventManager.addListener(topic, callback.bind(this));
        },
        onCallbackHandler: function(evt, response){
            if(response && response.message != "OK"){
                Ext.MessageBox.alert(Core.Translate.i18nJSON("Status"), Core.Translate.i18nJSON(response.message));
            }
        },

        newFolder: function() {
            var tree = this.getView().getArchiveTree(),
                    record = tree.getSelection()[0];

                    //add on non-folder adds to the parent
                if (record.get('id') === undefined) {
                    record = record.parentNode;
                }
            Ext.Msg.prompt(Core.Translate.i18nJSON('New Folder'), Core.Translate.i18nJSON('Please enter a new folder name:'),
                function(btn, name){
                    if (btn !== 'ok' || name.trim().length < 0) {
                        return;
                    }
                    var url = Ext.String.format("{0}/folder/{1}/create",
                            Core.Config.getProperty(UserProfile.REST_ENDPOINT),
                            UserProfile.getWorkspaceId()
                        );

                    var topic = 'nics.data.newfolder.' + this.rootName;
                   Core.EventManager.createCallbackHandler(topic, this, this.onCallbackHandler);

                    this.mediator.sendPostMessage(
                        url, topic, {
                            foldername: name,
                            parentfolderid: record.get('id'),

                        }
                    );
                }, this);
        },

        lazyLoadFolder: function(folder, opts){
            if(!folder.lazyLoaded){
                var url = Ext.String.format('{0}/folder/{1}/incident/{2}/{3}',
                    Core.Config.getProperty(UserProfile.REST_ENDPOINT),
                    UserProfile.getWorkspaceId(),folder.id,this.currentOrgId);


                this.mediator.sendRequestMessage(url, 'nics.data.loadfolder.' + this.rootName);

                folder.set("loading", true);
                folder.lazyLoaded = true;
            }
        },

        renameFolder: function() {
            var tree = this.getView().getArchiveTree(),
                    selection = tree.getSelection()[0];

            Ext.Msg.prompt(Core.Translate.i18nJSON('Rename Folder'), Core.Translate.i18nJSON('Please enter a new folder name:'),
                function(btn, name){
                    if (btn !== 'ok' || name.trim().length < 0) {
                        return;
                    }
                    var url = Ext.String.format("{0}/folder/{1}/update",
                            Core.Config.getProperty(UserProfile.REST_ENDPOINT),
                            UserProfile.getWorkspaceId()
                        );

                    var topic = 'nics.data.renamefolder.Archives';



                    this.mediator.sendPostMessage(
                        url, topic, {
                            foldername: name,
                            folderid: selection.get('id'),
                            parentfolderid: selection.parentNode.get('id'),
                            index: selection.get('folderindex'),
                        }
                    );
                }, this);
        },
        deleteFolder: function() {
            var tree = this.getView().getArchiveTree(),
                    selection = tree.getSelection()[0];

            Ext.MessageBox.confirm(
                    Core.Translate.i18nJSON('Delete Folder?'),
                    Core.Translate.i18nJSON('Folders must be empty to be deleted. Do you want to continue?'),
                function(btn){
                    if (btn !== 'yes') {
                        return;
                    }
                    var url = Ext.String.format("{0}/folder/{1}/{2}",
                            Core.Config.getProperty(UserProfile.REST_ENDPOINT),
                            UserProfile.getWorkspaceId(),
                            selection.get('id')
                        );

                    var topic = 'nics.data.deletefolder.' + this.rootName;


                    this.mediator.sendDeleteMessage(
                        url, topic);
                }, this);
        },
        moveFolder: function(node, data, dropRec, dropPosition) {
            //TODO add indexing
            var queryParams = {index : 0};
            var folderId = data.records[0].id;
            //When you "drop" the folder, it's parentId is automatically updated locally
            var newParentFolderId = data.records[0].parentNode.id;
            if (folderId) {
                queryParams.folderId = folderId;
            }
            var url = Ext.String.format("{0}/folder/{1}/move/{2}?{3}",
                Core.Config.getProperty(UserProfile.REST_ENDPOINT),
                UserProfile.getWorkspaceId(),
                newParentFolderId,
                Ext.Object.toQueryString(queryParams)
            );

            var topic = 'nics.data.movefolder.Archives';
            this.mediator.sendPostMessage(
                url, topic
            );

        },

    });
});
