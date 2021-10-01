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
define(['iweb/CoreModule', 'ol', "nics/modules/UserProfileModule"],

    function(Core, ol, UserProfile) {

        var format = new ol.format.WKT();

        Ext.define('modules.report-explosives.ExplosivesFormController', {
            extend: 'Ext.app.ViewController',

            alias: 'controller.explosivesformcontroller',

            init: function() {
                this.mediator = Core.Mediator.getInstance();

                this.destinations = [];
                this.customFields = [];
                this.locCount = 0;
                this.readOnly = false;

                var source = new ol.source.Vector();
                this.vectorLayer = new ol.layer.Vector({
                    source: source
                });

                Core.Ext.Map.addLayer(this.vectorLayer);
                this.vectorLayer.setVisible(true);

                //this.interaction = this.drawPolygon(source, Core.Ext.Map.getStyle);

                //this.interaction.on("drawend", this.onDrawEnd.bind(this));

                Core.EventManager.addListener("nics.incident.join", this.onJoinIncident.bind(this));
            },

            setReadOnly: function(readOnly){
                this.readOnly = readOnly;
            },

            onJoinIncident: function(e, incident) {
                this.incidentName = incident.name;
                this.incidentId = incident.id;
            },

            onClose: function(){
                Core.Ext.Map.removeLayer(this.vectorLayer);
            },

            cancelForm: function(){
                this.view.findParentByType('window').close();
            },

            submitForm: function() {

                var form = {};
                var message = {};

                var viewModel = this.view.viewModel;

                //Required Data
                message.report = {};
                if (viewModel.get('reportingUnit'))
                    message.report["ur-reportingunit"] = viewModel.get('reportingUnit');
                if (viewModel.get('reportingLocation'))
                    message.report["ur-reportinglocation"] = viewModel.get('reportingLocation');
                if (viewModel.get('latitude'))
                    message.report["ur-latitude"] = viewModel.get('latitude');
                if (viewModel.get('longitude'))
                    message.report["ur-longitude"] = viewModel.get('longitude');
                if (viewModel.get('contactInfo'))
                    message.report["ur-contactinfo"] = viewModel.get('contactInfo');
                if (viewModel.get('uxoTypeValue'))
                    message.report["ur-uxotype"] = viewModel.get('uxoTypeValue');
                if (viewModel.get('size'))
                    message.report["ur-size"] = viewModel.get('size');
                if (viewModel.get('shape'))
                    message.report["ur-shape"] = viewModel.get('shape');
                if (viewModel.get('color'))
                    message.report["ur-color"] = viewModel.get('color');
                if (viewModel.get('condition'))
                    message.report["ur-condition"] = viewModel.get('condition');
                if (viewModel.get('cbrnContamination'))
                    message.report["ur-cbrncontamination"] = viewModel.get('cbrnContamination');
                if (viewModel.get('resourceThreatened'))
                    message.report["ur-resourcethreatened"] = viewModel.get('resourceThreatened');
                if (viewModel.get('impactOnMission'))
                    message.report["ur-impactonmission"] = viewModel.get('impactOnMission');
                if (viewModel.get('protectiveMeasures'))
                    message.report["ur-protectivemeasures"] = viewModel.get('protectiveMeasures');
                if (viewModel.get('priorityValue'))
                    message.report["ur-recommendedpriority"] = viewModel.get('priorityValue');

                message.report.user = UserProfile.getUsername();
                message.report.userfull = UserProfile.getFirstName() + " " + UserProfile.getLastName();

                var time = Core.Util.getUTCTimestamp();
                message.datecreated = time;
                message.dateupdated = time;

                //Populate form properties
                form.incidentid = this.view.incidentId;
                form.incidentname = this.view.incidentName;
                form.formtypeid = this.view.formTypeId;
                form.usersessionid = UserProfile.getUserSessionId();
                form.distributed = false;
                form.message = JSON.stringify(message.report);
                form.seqtime = new Date().getTime();

                var url = Ext.String.format('{0}/reports/{1}/{2}',
                    Core.Config.getProperty(UserProfile.REST_ENDPOINT),
                    this.getView().incidentId, 'UXO');

                var topic = Ext.String.format("iweb.NICS.incident.{0}.report.{1}.#", this.getView().incidentId, 'UXO');

                this.mediator.sendPostMessage(url, topic, form);

                this.view.findParentByType('window').close();
            }
        });
    });