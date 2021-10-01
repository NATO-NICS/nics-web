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
define(['ext','iweb/CoreModule'], function(Ext, Core) {
	 
	Ext.define('Properties', {
        extend: 'Ext.data.Model',
        fields: ['label', 'name']
    });
	
	Ext.define('Task', {
        extend: 'Ext.data.Model',
        fields: ['task', 'what', 'weight', 'volume', 'hazmat', 'special']
    });
	
	Ext.define('Destination', {
        extend: 'Ext.data.Model',
        fields: ['title', 'feature']
    });
	
	var statusProps = [{
			label: 'Submitted',
			name: 'Submitted'
		},{
			label: 'Ongoing',
			name: 'Ongoing'
		},{
			label: 'Completed',
			name: 'Completed'
		},{
			label: 'Canceled',
			name: 'Canceled'
		},{
			label: 'Anticipated',
			name: 'Anticipated'
		}];
	
	var roleProps = [{
			label: 'Role1',
			name: 'Role1'
		},{
			label: 'Role2',
			name: 'Role2'
		},{
			label: 'Role3',
			name: 'Role3'
		}];
	
	return Ext.define('modules.report-mitam.MitamFormViewModel', {
	    extend: 'Ext.app.ViewModel',
	
	    alias: 'viewmodel.mitam', // connects to viewModel
	    
	    formulas: {
	    	 /*report: function(get){
	    		 var report = {
	    				name: get('name'),
	    				org: get('org'),
	    				durationValue: get('durationValue'),
	    				priorityValue: get('priorityValue'),
	    				sizeOfEffortValue: get('sizeOfEffortValue'),
	    				hazardousMaterialsValue: get('hazardousMaterialsValue')
	    		};
	    		 
	    		return report;
	    	},*/
	    	
	    	optionalData: function(get){
	    		var report = {};
	    		if(get('mission')){
	    			report.mission= get('mission');
	    		}
	    		if(get('single')){
	    			report.single = true;
	    		}
	    		if(get('multi')){
	    			report.multi = true;
	    		}
	    		if(get('priorityValue')){
	    			report.priorityValue = get('priorityValue');
	    		}
	    		if(get('mitamStatusValue')){
	    			report.mitamStatusValue = get('mitamStatusValue');
	    		}
	    		if(get('objective')){
	    			report.object = get('objective');
	    		}
	    		if(get('deadlineDate')){
	    			report.deadlineDate = get('deadlineDate');
	    		}
	    		if(get('requestDate')){
	    			report.requestDate = get('requestDate');
	    		}
	    		if(get('requestor')){
	    			report.requestor= get('requestor');
	    		}
	    		if(get('dodApprovedValue')){
	    			report.dodApprovedValue = get('dodApprovedValue');
	    		}
	    		if(get('dodStatusValue')){
	    			report.dodSatusValue = get('dodStatusValue');
	    		}
	    		if(get('ofdaApprovedValue')){
	    			report.ofdaApprovedValue = get('ofdaApprovedValue');
	    		}
	    		if(get('ofdaStatusValue')){
	    			report.ofdaSatusValue = get('ofdaStatusValue');
	    		}
	    		if(get('dodStatusValue')){
	    			report.dodSatusValue = get('dodStatusValue');
	    		}
	    		if(get('assignedLeadValue')){
	    			report.assignedLeadValue = get('assignedLeadValue');
	    		}
	    		if(get('leadStatusValue')){
	    			report.leadStatusValue = get('leadStatusValue');
	    		}
	    		if(get('deadTime')){
	    			report.deadTime = get('deadTime');
	    		}
	    		if(get('reqTime')){
	    			report.reqTime = get('reqTime');
	    		}
	    		return report;
	    	}
	    },
	
		stores: {
            priority: {
                model: 'Properties',
                data: [
                    {
                        label: 'High',
                        name: 'High'
                    }, 
                    {
                        label: 'Medium',
                        name: 'Medium'
                    }, 
                    {
                        label: 'Low',
                        name: 'Low'
                    }
                  ]
            },
            serviceType: {
                model: 'Properties',
                data: [
                    {
                        label: 'Transport Materiel',
                        name: 'Transport Materiel'
                    }, 
                    {
                        label: 'Security',
                        name: 'Security'
                    }, 
                    {
                        label: 'Re-supply',
                        name: 'Re-supply'
	            },
                    {
                        label: 'Medical',
                        name: 'Medical'
                    }, 
                    {
                        label: 'Engineering',
                        name: 'Engineering'
                    }, 
                    {
                        label: 'Assessment',
                        name: 'Assessment'
                    }, 
                    {
                        label: 'Other',
                        name: 'Other'
                    }
                  ]
            },
            requestorType: {
            	model: 'Properties',
            	data: [{
            			label: 'UN',
            			name: 'UN'
            		},{
            			label: 'NGO/IO',
            			name: 'NGO/IO'
            		},{
            			label: 'DART',
            			name: 'DART'
            		},{
            			label: 'Other USG',
            			name: 'Other USG'
            		},{
            			label: 'Affected Nation Government',
            			name: 'Affected Nation Government'
            		},{
            			label: 'Affected Nation Military',
            			name: 'Affected Nation Military'
            		}
            	]
            },
            status: {
            	model: 'Properties',
            	data: statusProps
            },
            mitamStatus: {
            	model: 'Properties',
            	data: statusProps
            },
            dodStatus: {
            	model: 'Properties',
            	data: statusProps
            },
            ofdaStatus: {
            	model: 'Properties',
            	data: statusProps
            },
            leadStatus: {
            	model: 'Properties',
            	data: statusProps
            },
            dodApproved: {
            	model: 'Properties',
            	data: roleProps
            }, 
            ofdaApproved: {
            	model: 'Properties',
            	data: roleProps
            },
            assignedLead: {
            	model: 'Properties',
            	data: roleProps
            },
            task: {
            	model: 'Task'
            },
            destination: {
            	model: 'Destination'
            }
		}
	});
});