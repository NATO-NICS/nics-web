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
define(["ol",'ext', 'iweb/CoreModule','iweb/modules/MapModule'],
    function(ol, Ext, Core, MapModule){

        return Ext.define('modules.datalayer.NMKDCOVIDFeatureServiceRenderer', {

            constructor: function() {
                MapModule.getClickListener().addRenderer(this);
            },

            getStyle: function(feature, resolution, selected) {
                var style;
                if(feature.getGeometry().getFlatCoordinates().length == 2){
                    var properties = feature.getProperties();
                    if(properties["Total"] &&
                        properties["Total"] > 0) {
                        style = new ol.style.Style({
                            image: new ol.style.Circle({
                                radius: 10,
                                fill: new ol.style.Fill({
                                    color: 'rgba(255, 0, 0, 255)'
                                }),
                                stroke: new ol.style.Stroke({
                                    color: 'rgba(0, 0, 0, 255)'
                                })
                            })
                        });
                    }else{
                        style = new ol.style.Style({
                            image: new ol.style.Circle({
                                radius: 10,
                                fill: new ol.style.Fill({
                                    color: 'rgba(51, 102, 255, .5)'
                                }),
                                stroke: new ol.style.Stroke({
                                    color: 'rgba(0, 0, 0, 255)'
                                })
                            })
                        });
                    }
                }else{
                    style = new ol.style.Style({
                        fill: new ol.style.Fill({
                            color: 'rgba(110, 110, 110, 255)'
                        }),
                        stroke: new ol.style.Stroke({
                            color: 'rgba(110, 110, 110, 255)',
                            width: 0.4
                        })
                    });
                }
                return style;
            },

            render: function(container, feature) {
                var props = feature.getProperties();
                if(props["Gradovi_NAME"]) {
                    for (var property in props) {
                        var type = typeof props[property];
                        if (type != "object") {
                            var value = props[property] ? props[property] : "";

                            //Replace null string with empty value
                            if (value == "null") {
                                value = "";
                            }

                            // check if property contains the time
                            if (property === 'timestamp' && value !== "") {
                                var zulu = new Date(value);
                                var local = new Date(zulu + ' UTC');
                                value = local.toISOString();
                            }

                            if (property.indexOf("OBJECTID") == -1 &&
                                property.indexOf("area") == -1) {

                                container.add(new Ext.form.field.Display({
                                    fieldLabel: Core.Translate.i18nJSON(property),
                                    value: value
                                }));
                            }
                        }
                    }
                }
                return true;
            }
        });

    });