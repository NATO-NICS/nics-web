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

        return Ext.define('modules.datalayer.mneweatherrenderer', {

            constructor: function(){
                this.sources = Core.Config.getProperty("datalayer.avl.source");
                MapModule.getClickListener().addRenderer(this);
//                MapModule.getHoverListener().addRenderer(this);


                this.getStyle = this.getStyle.bind(this);
                MapModule.getMapStyle().addStyleFunction(this.getStyle);
            },

            getStyle: function(feature, resolution, selected){
                if(!feature.get('windspeed')){
                    return;
                }

                var icon = Ext.String.format("images/raws/{0}",this.getIcon(feature));

                var style = [];
                if(icon) {
                    style.push(new ol.style.Style({
                        image: new ol.style.Icon({
                            src: icon,
                            scale: 0.15
                        })
                    }));
                }
                return style;
            },

            render: function(container, feature) {
                var labels = {
                    t2: 'Air Temperature',
                    windspeed: 'Wind Speed',
                    wd10: 'Wind Direction',
                    created: 'Date',
                    tcld: '% Cloud Coverage'
                };


                if(feature && feature.getProperties()["windspeed"] != null) {

                    var props = feature.getProperties();
                    for(var property in props){
                        var type = typeof props[property];
                        if(type != "object" && property != "description"){
                            var value = props[property] ? props[property] : "";

                            //Replace null string with empty value
                            if(value == "null"){
                                value = "";
                            }

                            // check if property contains the time
                            if (property === 'timestamp' && value !== "") {
                                var zulu = new Date(value);
                                var local = new Date(zulu + ' UTC');
                                value = local.toISOString();
                            }

                            container.add(new Ext.form.field.Display({
                                fieldLabel: labels[property] ? labels[property] : property,
                                value: value
                            }));
                        }
                    }
                    return true;
                }
            },

            isRenderer: function(url){
                for(var i=0; i<this.sources.length; i++){
                    if(this.sources[i] == url){
                        return true;
                    }
                }
            },

            getIcon: function(feature){
                var speed = feature.get('windspeed'); //windvel
                var direction = feature.get('wd10'); //winddir

                if(speed == 0 || speed<3){
                    return 'w0.png';
                }

                if(speed && direction) {
                    return Ext.String.format("w{0}{1}.png",
                        Math.min((Math.round(speed / 5) * 5), 80),
                        direction.toLowerCase().trim());
                }else{
                    return "w0.png";
                }
            }

        });

    });





