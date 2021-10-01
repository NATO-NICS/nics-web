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
define(['./DDOneGridView', 'iweb/CoreModule', './ArchiveController', './ArchiveModel', 'nics/modules/UserProfileModule', ],
		function(DDOneGridView,  Core, ArchiveController, ArchiveModel,  UserProfile) {
	

	var FIRST_GRID_REF = "firstGrid";
	var FIRST_TREE_REF = "treepanel1";

	return Ext.define('modules.administration.ArchiveView', {
	 
	 	extend: 'Ext.Panel',

	 	controller: 'archivecontroller',
	 	
	 	reference: 'archiveView',
	 	
	 	title: Core.Translate.i18nJSON('Incidents'),
	    
	    collapsible: true,
	    
	    autoWidth: true,
 		autoHeight: true,

	 
	 	initComponent: function(){
			this.callParent();
			 this.mediator = Core.Mediator.getInstance();
            //Request Root Folder Data

          /*  var url = Ext.String.format('{0}/folder/{1}/incident/archived/{2}',
                Core.Config.getProperty(UserProfile.REST_ENDPOINT),
                UserProfile.getWorkspaceId(),UserProfile.getOrgId());*/
            //this.mediator.sendRequestMessage(url , 'nics.data.createtree.archive');
			this.add(new DDOneGridView({
			    reference: 'adminIncidentGrid',
			    region: 'center',
				columns: [
			        { flex: 1, sortable: true, dataIndex: 'incidentname'}
			    ],
			    dataModel: ArchiveModel,
			    grids: [
				  {
					  title:Core.Translate.i18nJSON('Active Incidents'),
					  ref: FIRST_GRID_REF,
					  dragGroup: 'firstGridDDGroup',
					  dropGroup: 'firstGridDDGroup',
					  treetitle:Core.Translate.i18nJSON('Archives'),
                      treeref: FIRST_TREE_REF,

				   }
				],
				height: 400
			}));



			this.add({
	        	xtype: 'panel',
	        	html: Core.Translate.i18nJSON('Drag and drop an incident to archive/activate an incident.'),
			    bodyStyle: 'padding:5px;font-size:12px'
			});
		},
	 	
	 	getIncidentsPanel: function(){
			return this.lookupReference('adminIncidentGrid');
		},
		
		getFirstGrid: function(){
			return this.lookupReference(FIRST_GRID_REF);
		},
		
		
		getArchiveTree: function() {
			return this.lookupReference('treepanel1');
			},
        createRoot: function(rootId) {;
			  this.getTree().setRootNode({
                text: Core.Translate.i18nJSON('Archived'),
                id: rootId,
                expanded: true
            });
        },
        addChildNode: function(folderid, text, leaf){
        			var folder, root = this.getTree().getRootNode();

        			if(root.id == folderid){
        				folder = root;
        			} else {
        				folder = root.findChild("folderid", folderid, true);
        			}

        			if(folder){
        				var config = {
        					text: text,
        					leaf: leaf
        				};

        				if(leaf){
        					config.checked = false;
        					config.iconCls = 'datatree-no-icon';
        				}


        				return folder.appendChild(config);
        			}
        		},
		clearGrids: function(){
			var firstGrid = this.getFirstGrid();


			if(firstGrid.getStore().getCount() > 0){
				firstGrid.getStore().removeAll();
			}
			

		},
		clearTree: function(){
        			var tree = this.getArchiveTree();


        			if(tree.getStore().getCount() > 0){
        				tree.getStore().removeAll();
        			}


        		}
	 });
});
