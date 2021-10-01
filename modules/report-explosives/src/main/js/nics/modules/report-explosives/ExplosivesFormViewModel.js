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

    var uxoTypes = [{
        label: 'Dropped',
        name: 'Dropped'
    },{
        label: 'Projected',
        name: 'Projected'
    },{
        label: 'Placed',
        name: 'Placed'
    },{
        label: 'Possible IED',
        name: 'Possible IED'
    },{
        label: 'Thrown',
        name: 'Thrown'
    }];

    var priorities = [{
        label: 'Immediate',
        name: 'Immediate'
    }, {
        label: 'Indirect',
        name: 'Indirect'
    }, {
        label: 'Minor',
        name: 'Minor'
    },{
        label: 'No Threat',
        name: 'No Threat'
    }];

    return Ext.define('modules.report-explosives.ExplosivesFormViewModel', {
        extend: 'Ext.app.ViewModel',

        alias: 'viewmodel.explosives', // connects to viewModel

        formulas: {
            /*
            report: function(get){
                var report = {};
                if (get('reportingUnit'))
                    report["ur-reportingunit"] = get('reportingUnit');
                if (get('reportingLocation'))
                    report["ur-reportinglocation"] = get('reportingLocation');
                if (get('longitude'))
                    report["ur-longitude"] = get('longitude');
                if (get('latitude'))
                    report["ur-latitude"] = get('latitude');
                if (get('contactInfo'))
                    report["ur-contactinfo"] = get('contactInfo');
                if (get('uxoTypeValue'))
                    report["ur-uxotype"] = get('uxoTypeValue');
                if (get('size'))
                    report["ur-size"] = get('size');
                if (get('shape'))
                    report["ur-shape"] = get('shape');
                if (get('color'))
                    report["ur-color"] = get('color');
                if (get('condition'))
                    report["ur-condition"] = get('condition');
                if (get('cbrnContamination'))
                    report["ur-cbrncontamination"] = get('cbrnContamination');
                if (get('resourceThreatened'))
                    report["ur-resourcethreatened"] = get('resourceThreatened');
                if (get('impactOnMission'))
                    report["ur-impactonmission"] = get('impactOnMission');
                if (get('protectiveMeasures'))
                    report["ur-protectivemeasures"] = get('protectiveMeasures');
                if (get('priorityValue'))
                    report["ur-recommendedpriority"] = get('priorityValue');

                return report;
            }
            */
        },

        stores: {
            priority: {
                model: 'Properties',
                data: priorities
            },
            uxoType: {
                model: 'Properties',
                data: uxoTypes
            }
        }
    });
});