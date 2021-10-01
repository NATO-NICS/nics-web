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
 define(['iweb/CoreModule', 
         './MitamFormViewModel',
         './MitamFormController'], function(Core) {
	Ext.define('modules.report-mitam.MitamForm', {
	    
		extend: 'Ext.form.Panel',
		    	    
	    controller: 'mitamformcontroller',
	    
	    buttonAlign: 'center',
	
	    viewModel: {
	       type: 'mitam'
	    },
	    
	    autoHeight: true,
	    autoWidth: true,
	    
	    defaults: {
    	    scrollable: true,
            bodyPadding: 5,
            border: false
	    },
	    
	    listeners: {
	    	beforedestroy: 'onClose'
	    },
	    
	    layout: 'border',
	    
	    referenceHolder: true,
	    
	    setReadOnly: function() {
	    	this.getForm().getFields().each (function(field) {
	    		field.setReadOnly(true);
	    	});
	    	
	    	Ext.Array.forEach(this.query("button"), function(button){
	    		if(button.text == "Submit"){
	    			button.hide();
	    		}else if(button.text != "Cancel"){
	    			button.disable();
	    		} 
	    	});
	    	this.controller.setReadOnly(true);
	    },
	    
	    dockedItems: [{
            xtype: 'toolbar',
            dock: 'top',
            layout: {
            	pack: 'start'
	    },
            items: [{
            		text: 'Submit',
            		handler: 'submitForm'
        		},{
        			text: 'Cancel',
        			handler: 'cancelForm'
    	     }]
        }],
	    

    	/*buttons: [{
        	text: 'Submit',
	        handler: 'submitForm'
    		},{
        	text: 'Cancel',
	        handler: 'cancelForm'
	     }],*/
	    
	    items:[{
		    xtype: 'container',
	    	region: 'center',
		    defaultType: 'textfield',
		    reference: 'mitamForm',
            margin: '5 5 5 5',
		    items: [{
            	xtype: 'fieldset',
            	title: 'MITAM',
            	items: [{
		            xtype: 'fieldcontainer',
            		layout: 'hbox',
            		items:[{
			        	xtype: 'textfield',
			        	fieldLabel: 'Mission #',
			            labelWidth: 160,
			        	bind: '{mission}'
			        }, {
			        	margin    : '0 15 0 15',
			        	xtype	  : 'checkboxfield',
			            boxLabel  : 'Single Operation',
			            bind	  : '{single}'
			        }, {
			        	xtype	  : 'checkboxfield',
			            boxLabel  : 'Multi Operation',
			            bind	  : '{multi}'
			        }]
            	
            	},{
		        	xtype: 'combobox',
		            editable: false,
		            displayField: 'label',
		            margin: '0 5 5 0',
		            valueField: 'name',
		            labelWidth: 160,
		            queryMode: 'local',
	            	bind: {
		                store: '{priority}',
		                value: '{priorityValue}'
				        },
		            fieldLabel: 'Priority'
		    	},{
		        	xtype: 'combobox',
		            editable: false,
		            displayField: 'label',
		            valueField: 'name',
		            queryMode: 'local',
		            margin: '0 5 5 0',
	            	bind: {
		                store: '{mitamStatus}',
		                value: '{mitamStatusValue}'
		            },
		        	fieldLabel: 'Status',
		            labelWidth: 160
		        },{
		        	xtype: 'textarea',
		        	bind: '{objective}',
		        	fieldLabel: 'Objective',
			        labelWidth: 160
		        }]
            },{
		        xtype: 'fieldset',
		        title: 'When',
		        reference: 'whenFields', 
		            layout: {
			        type: 'vbox'
		            },
		            items: [
		                {
						xtype: 'fieldcontainer',
						layout: 'hbox',
						items:[{
							xtype: 'label',
							text: 'Request',
							margin: '10 6 5 5'
		                }, {
							xtype: 'textfield',
							reference: 'requestDate',
							bind: "{requestDate}",
							margin: '5 5 5 5'
		                }, {
							xtype:'button',
							text: '...',
							reference: 'request',
							handler: 'showPicker',
							margin: '5 5 5 5'
		                }, {
							xtype: 'timefield',
							reference: 'reqTime',
							bind: "{requestTime}",
							increment: 30,
							margin: '5 5 5 5'
						}]
		                }, {
						xtype: 'fieldcontainer',
						layout: 'hbox',
						items:[{
		                	xtype: 'label',
		                	text: 'Deadline',
		                	margin: '10 5 5 5'
		                }, {
		                	xtype: 'textfield',
		                	reference: 'deadlineDate',
		                	bind: "{deadlineDate}",
		                	margin: '5 5 5 5'
		                }, {
		                	xtype:'button',
		                	text: '...',
		                	reference: 'deadline',
		                	handler: 'showPicker',
		                	margin: '5 5 5 5'
		                }, {
		                	xtype: 'timefield',
		                	reference: 'deadTime',
		                	bind: "{deadlineTime}",
		                	increment: 30,
		                	margin: '5 5 5 5'
		                }]
		                }
		            ]
		    },{
		        xtype: 'fieldset',
		        title: 'Who',
		        reference: 'whoFields', 
		        items: [{
		        	xtype: 'textfield',
		        	fieldLabel: 'Requestor',
		        	bind: '{requestor}',
		        	labelWidth: 160
		        },{
		        	 xtype: 'combobox',
		        	 margin: '0 5 5 0',
		        	 forceSelection: true,
		        	 editable: false,
		        	 displayField: 'label',
		        	 valueField: 'name',
		        	 triggerAction: 'all',
		        	 queryMode: 'local',
		        	 bind: {
		        	     store: '{requestorType}',
		        	     value: '{requestorTypeValue}'
		        },
		        	 fieldLabel: 'Requestor Type',
			         labelWidth: 160
		        },{
		            xtype: 'fieldcontainer',
		        	layout: 'hbox',
		        	items: [{
			        	 /*xtype: 'combobox',
			        	 margin: '0 5 5 0',
			        	 forceSelection: true,
			            editable: false,
			            displayField: 'label',
			            valueField: 'name',
			        	 triggerAction: 'all',
	    	            queryMode: 'local',
			        	 bind: {
			        	     store: '{dodApproved}',
			        	     value: '{dodApprovedValue}'
		            },
			        	 fieldLabel: 'Approved by (DoD)',*/
		        		 xtype: 'textfield',
			        	 fieldLabel: 'Approved by (DoD)',
			        	 bind: '{dodApprovedValue}',
				         labelWidth: 160
			        	},{
			        	 xtype: 'combobox',
			        	 margin: '0 5 5 5',
			        	 forceSelection: true,
			        	 editable: false,
			        	 displayField: 'label',
			        	 valueField: 'name',
			        	 triggerAction: 'all',
			        	 queryMode: 'local',
			        	 bind: {
			        	     store: '{dodStatus}',
			        	     value: '{dodStatusValue}'
			        	 },
			        	 fieldLabel: 'Status',
				         labelWidth: 50,
				         labelPad: 10
			        }]
		        },{
		        	xtype: 'fieldcontainer',
		        	layout: 'hbox',
		            items:[{
			        	 /*xtype: 'combobox',
			        	 margin: '0 5 5 0',
			        	 forceSelection: true,
			        	 editable: false,
			        	 displayField: 'label',
			        	 valueField: 'name',
			        	 triggerAction: 'all',
			        	 queryMode: 'local',
		            	bind: {
			        	     store: '{ofdaApproved}',
			        	     value: '{ofdaApprovedValue}'
			            },
			        	 fieldLabel: 'Approved by (OFDA)',*/
		        		 xtype: 'textfield',
			        	 fieldLabel: 'Approved by (OFDA)',
			        	 bind: '{ofdaApprovedValue}',
				         labelWidth: 160
			        },{
			        	 xtype: 'combobox',
			        	 margin: '0 5 5 5',
			        	 forceSelection: true,
			        	 editable: false,
			        	 displayField: 'label',
			        	 valueField: 'name',
			        	 triggerAction: 'all',
			        	 queryMode: 'local',
			            bind: {
			        	     store: '{ofdaStatus}',
			        	     value: '{ofdaStatusValue}'
			            },
			        	 fieldLabel: 'Status',
				         labelWidth: 50,
				         labelPad: 10
			        }]
			        },{
			        	xtype: 'fieldcontainer',
			        	layout: 'hbox',
			        	items: [{
				        	 /*xtype: 'combobox',
				        	 margin: '0 5 5 0',
				        	 forceSelection: true,
				        	 editable: false,
				        	 displayField: 'label',
				        	 valueField: 'name',
				        	 triggerAction: 'all',
				        	 queryMode: 'local',
			            bind: {
				        	     store: '{assignedLead}',
				        	     value: '{assignedLeadValue}'
			            },
				        	 fieldLabel: 'Assigned Lead',*/
			        		 xtype: 'textfield',
				        	 fieldLabel: 'Assigned Lead',
				        	 bind: '{assignedLeadValue}',
					         labelWidth: 160
			        },{
				        	 xtype: 'combobox',
				        	 margin: '0 0 5 5',
				        	 forceSelection: true,
				        	 editable: false,
				        	 displayField: 'label',
				        	 valueField: 'name',
				        	 triggerAction: 'all',
				        	 queryMode: 'local',
			            bind: {
				        	     store: '{leadStatus}',
				        	     value: '{leadStatusValue}'
			            },
				        	 fieldLabel: 'Status',
					         labelWidth: 50,
					         labelPad: 10
				        	}]
			        }]
		        },{
		        	xtype: 'fieldset',
		        title: 'What',
		        reference: 'whatFields', 
		        items: [{
					xtype: 'combobox',
				    editable: false,
				    displayField: 'label',
				    valueField: 'name',
				    labelWidth: 160,
				    queryMode: 'local',
					bind: {
				        store: '{serviceType}',
				        value: '{serviceTypeValue}'
				    },
				    fieldLabel: 'Service Type',
				    listeners: {
				    	change: 'onServiceTypeChange'
				    }
				},{
					xtype: 'gridpanel',
					minHeight: 120,
					header: false,
					border: false,
					viewConfig: {
			            emptyText: 'Click on the Add button to create an entry',
			            deferEmptyText: false,
			            markDirty: false
			        },
					plugins: [{
						ptype: 'rowediting',
						pluginId: 'rowediting',
						clicksToEdit: 1
					}],
					listeners: {
						'beforeedit': 'onGridBeforeEdit',
						'canceledit': 'onGridCancelEdit'
					},
					reference: 'taskgrid',
					buttonAlign: 'center', 
					buttons: [{ text: 'Add', handler: 'addTask' }],
					columns:  [
			          { text: '#', dataIndex: 'task', editor: {}, width: 50},
			          { text: 'What', dataIndex: 'what', editor: {} },
			          { text: 'Weight', dataIndex: 'weight', editor: {} },
			          { text: 'Volume', dataIndex: 'volume', editor: {} },
			          { text: 'HAZMAT', dataIndex: 'hazmat', editor: {} },
			          { text: 'Special', dataIndex: 'special', editor: {} }
			        ],
			        store: {
						model: 'Task'
					}
				}]
		    },{
		    	xtype: 'fieldset',
		    	title: 'Where', 
		        	items: [{
			        	xtype: 'panel',
			        	border: false,
			        	margin: '10 20 10 20',
			        	header: false,
			        	dockedItems: [{
			                xtype: 'toolbar',
			                dock: 'top',
			                layout: {
			                	pack: 'start'
			                },
			                items: [{
				        		xtype: 'button',
				        		text: 'Add',
				        		handler: 'addDestination'
				        	},{
				        		xtype: 'button',
				        		text: 'Locate',
			                	enableToggle: true,
			                	reference: 'locateButton',
			                	listeners: {
			                		toggle: 'locateArea'
			                	}
				        	},{
				        		xtype: 'button',
				        		text: 'Delete',
				        		handler: 'deleteDestination'
				        	},{
				        		xtype: 'button',
				        		text: 'Zoom',
				        		reference: 'zoomButton',
				        		handler: 'zoomToDestination',
				        		disabled: true
				        	}]
			            }],
			        	items: [{
	        	        	xtype: 'gridpanel',
	    		        	reference: 'destinations',
		    	        	columns: [{ text: 'Title', dataIndex: 'title', flex: 1 }],
	        	            bind: {
	        	                store: '{destination}'
	        	            },
	        	            listeners: {
	        	            	selectionchange: 'onSelectionChange',
	        	            },
	        	            selModel: {
	    	        	          selType: 'checkboxmodel',
	    	        	          showHeaderCheckbox: false,
	    	        	          mode: 'single'
	    	        	    }
		        },{
	        	        	xtype: 'fieldset',
		            		layout: 'vbox',
		            		title: 'Origin',
		            		items: [{
	    		        	    	   xtype:'textfield',
					        	fieldLabel: 'Origin',
					        	bind: '{origin}',
					        	labelWidth: 75,
					        	margin: '5 5 5 5'
	    		        	       },{
	    		        	    	   xtype:'textfield',
					        	fieldLabel: 'Lat',
					        	bind: '{origLat}',
					        	labelWidth: 75,
					        	margin: '5 5 5 5'
					        },{
		            			xtype: 'textfield',
					        	fieldLabel: 'Lon',
					        	bind: '{origLon}',
					        	labelWidth: 75,
					        	margin: '5 5 5 5'
	    		        	       },{
	    		        	    	   xtype: 'button',
					        	text: 'Locate',
								reference: 'orig',
								toggleHandler: 'onLocateToggle',
								enableToggle: true,
					        	margin: '5 5 5 5'
		        }]
		     },{
		            		xtype: 'fieldset',
		            		layout: 'vbox',
		            		title: 'Destination',
    		    items:[{
		            			xtype: 'textfield',
					        	fieldLabel: 'Destination',
					        	bind: '{destinationLoc}',
					        	labelWidth: 75,
					        	margin: '5 5 5 5'
    	    	},{
		            			xtype: 'textfield',
					        	fieldLabel: 'Lat',
					        	bind: '{destLat}',
					        	labelWidth: 75,
					        	margin: '5 5 5 5'
    	        },{
		            			xtype: 'textfield',
					        	fieldLabel: 'Lon',
					        	bind: '{destLon}',
					        	labelWidth: 75,
					        	margin: '5 5 5 5'
    	        },{
					        	xtype: 'button',
					        	text: 'Locate',
								reference: 'dest',
								toggleHandler: 'onLocateToggle',
								enableToggle: true,
					        	margin: '5 5 5 5'
    	        	}]
    	        }]
		    	}]
		    }]
		     }]
	     });
});