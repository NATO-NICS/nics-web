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
define(['ext', 'iweb/CoreModule',], function(Ext, Core) {
	
	return Ext.define('modules.administration.DDOneGridView', {
	 
	 	extend: 'Ext.panel.Panel',

	 	autoHeight: true,
	 	
	 	autoWidth: true,
	 	
	 	border: false,
	 	
	 	initComponent: function(){
	 		this.callParent();
	 		
	 		this.loadGrids();
	 	},
	 	
	 	loadGrids: function(){
	 		if(this.grids != null){

		 			var grid = this.grids[0];

			 	    var store = Ext.create('Ext.data.Store', {
			 	        model: this.dataModel
			 	    });

			 	    this.add(this.buildGrid(grid.dragGroup, grid.dropGroup,
			 	     		store, this.columns, grid.title, grid.ref));
                    this.add(this.buildTree(grid.dragGroup,grid.treetitle, grid.treeref));


		 		}


	 	},

	 	config: {
	 		layout: {
	            type: 'hbox',
	            align: 'stretch'
	        },
	        defaults: { flex: 2 } //auto stretch
	    },

	 	buildGrid: function(dragGroup, dropGroup, store, columns, title, reference){
	 		var config =  {
	 			multiSelect: false,
	 	        viewConfig: {
	 	            plugins: {
	 	                ptype: 'gridviewdragdrop',
	 	                ddGroup: dragGroup,
	 	            }
	 	        },
	 	        store: store,
	 	        columns: columns,
	 	        stripeRows: true,
	 	        reference: reference,
	 	        hideHeaders:true
	 	    };
	 		
	 		if(title){
	 			config.title = title;
	 		}else{
	 			config.header = false;
	 		}

	 		return Ext.create('Ext.grid.Panel', config);
	 	},
 	    buildTree: function(ddGroup,  title, reference){
	 		var config =  {
	 	        viewConfig: {
	 	            plugins: {
                       ptype: 'treeviewdragdrop',
                       ddGroup: ddGroup,
                       dragGroup: ddGroup,
                       dropGroup: ddGroup,
                       appendOnly: false,
                       enableDrop:true,
                       containerScroll: true
                   }
	 	        },

	 	        border: false,
                autoHeight: true,
                autoWidth: true,
                rootVisible:true,
                useArrows: true,
                flex:2,
	 	        stripeRows: true,
	 	        reference: reference,
	 	        hideHeaders:true,
                listeners: {
                   itemcontextmenu: "onItemContextMenu"
                },
                root: {
                            text: Core.Translate.i18nJSON(title),
                            expanded: true
                        },
                folderSort: true,
                    sorters: [{
                        property: 'text',
                        direction: 'DESC'
                }]
	 	    };





            if(title){
            	 			config.title = title;
            	 		}else{
            	 			config.header = false;
            	 		}
	 		return Ext.create('Ext.tree.Panel', config);
	 	},



     	 });
});
