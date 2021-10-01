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
define(['./SecureRoomController', 'nics/modules/administration/UserModel', 'nics/modules/administration/DDGridView', 'iweb/CoreModule'],
		function(SecureRoomController, UserModel, DDGridView, Core) {
	
	var GRID_REF = 'secureRoomGrid';
	var FIRST_GRID_REF = "firstGrid";
	var SECOND_GRID_REF = "secondGrid";
	var THIRD_GRID_REF = "thirdGrid";
	var FOURTH_GRID_REF = "fourthGrid";

	return Ext.define('modules.administration.SecureRoomView', {
	 
	 	extend: 'Ext.Panel',
	 	
	 	referenceHolder: true,

	 	controller: 'secureroomcontroller',
	 	
	 	reference: "managePermissions",
	 	
	 	 dockedItems: [{
            xtype: 'toolbar',
            dock: 'top',
            layout: {
            	pack: 'start'
            },
            items: [{
            	xtype: 'button',
            	text: Core.Translate.i18nJSON('Lookup Users'),
                handler: 'onLookupUsersButtonClick'
            }]
        }],
	        
	 
	 	initComponent: function(){
			this.callParent();
			
			this.add(new DDGridView({
			    reference: GRID_REF,
			    region: 'center',
				columns: [
			        {text: Core.Translate.i18nJSON("User Name"), flex: 1, sortable: true, dataIndex: 'username'}
			    ],
			    dataModel: UserModel,
			    grids: [
				  {
					  title:Core.Translate.i18nJSON('All Users'),
					  ref: FIRST_GRID_REF,
					  dragGroup: 'dragDropGroup',
					  dropGroup: 'dragDropGroup'
				   },{
					  title:Core.Translate.i18nJSON('Read Only Users'),
					  ref: SECOND_GRID_REF,
					  dragGroup: 'dragDropGroup',
					  dropGroup: 'dragDropGroup'
				   },{
					  title:Core.Translate.i18nJSON('Read/Write Users'),
					  ref: THIRD_GRID_REF,
					  dragGroup: 'dragDropGroup',
					  dropGroup: 'dragDropGroup'
				   },{
					  title:Core.Translate.i18nJSON('Admin Users'),
					  ref: FOURTH_GRID_REF,
					  dragGroup: 'dragDropGroup',
					  dropGroup: 'dragDropGroup'
				   }
				],
				height: 400
			}));
			
			this.add({
	        	xtype: 'panel',
	        	html: Core.Translate.i18nJSON('Drag and drop a username to allow specific permissions in this room.') + '<br/>' + Core.Translate.i18nJSON('To multi-select rows, hold down the control key while selecting.'), 
	        	bodyStyle: 'padding:5px;font-size:12px'
			});
	 	},
	 	
	 	config: {
	 		autoWidth: true,
	 		autoHeight: true,
	 		layout: {
	            type: 'vbox',
	            align: 'stretch'
	        },
	        title: Core.Translate.i18nJSON('Secure Collaboration Room')
	 	},
	 	
	 	getUsersPanel: function(){
			return this.lookupReference(GRID_REF);
		},
		
		getFirstGrid: function(){
			return this.lookupReference(FIRST_GRID_REF);
		},
		
		getSecondGrid: function(){
			return this.lookupReference(SECOND_GRID_REF);
		},
		
		getThirdGrid: function(){
			return this.lookupReference(THIRD_GRID_REF);
		},
		
		getFourthGrid: function(){
			return this.lookupReference(FOURTH_GRID_REF);
		}
	 });
});
