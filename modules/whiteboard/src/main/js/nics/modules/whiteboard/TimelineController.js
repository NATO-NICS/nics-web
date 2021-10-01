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
define(['ext', 'iweb/CoreModule', 'ol'],
    function(Ext, Core, ol) {

        return Ext.define('modules.whiteboard.TimelineController', {
            extend : 'Ext.app.ViewController',

            alias: 'controller.timelinecontroller',

            init: function() {
                this.mediator = Core.Mediator.getInstance();

                Core.EventManager.addListener("nics.collabroom.activate", this.onActivateCollabRoom.bind(this));
                Core.EventManager.addListener("nics.collabroom.open", this.onOpenCollabRoom.bind(this));
                Core.EventManager.addListener("nics.collabroom.close", this.onCloseCollabRoom.bind(this));
                Core.EventManager.addListener("nics.collabroom.update", this.onUpdateCollabRoom.bind(this));

                this.resetTimeline();

                // XXX: Commented out till notifications are required or not
                // this.addNotificationTool();
                this.view = this.getView();
            },

            resetTimeline: function() {
                this.maxSliderPosition = 0;
                this.sliderMap = null;
                this.activeRoomId = null;
                this.currentSliderPosition = null;
                this.timeMap = null;
                this.timePosMap = null;
            },

            onPanelLayout: function() {
                //calling mask before the panel is expanded causes bad placement
                if (!this.activeRoomId && !this.isMasked()) {
                    this.mask();
                }
            },

            getLayer: function(collabId) {
                var map = Core.Ext.Map.getMap();
                var retLayer = null;

                map.getLayers().forEach(function(layer){
                    var id = layer.get('collabId');
                    if (collabId === id) {
                        retLayer = layer;
                        return;
                    }
                });

                return retLayer;
            },

            setFeatureHidden: function(features, isHidden) {
                for (var feat in features) {
                    var f = features[feat];
                    if (f !== undefined) {
                        f.persistChange = false; // prevent calling update feature api
                        if (!f.setStyle) {
                            console.log(features);
                            console.log(feat);
                            console.log(f);
                            console.exception('Bad feature');
                        }
                        if (isHidden)
                            f.setStyle(new ol.style.Style({}));
                        else
                            f.setStyle(null);
                    }
                }
            },

            updateVisibleFeatures: function(newPosition) {
                if (!this.sliderMap || !this.maxSliderPosition) return;

                // update values for all slider positions
                for (var i = 0; i <= this.maxSliderPosition; i++) {
                    var features = this.sliderMap[i]; // get features at time position
                    if (features) {
                        var isHidden = false;
                        if (i > newPosition) {
                            isHidden = true;
                        }

                        this.setFeatureHidden(features, isHidden);
                    }
                }
            },

            updateLabelText: function() {
                var label = this.getTimelineLabel();
                if (label && this.currentSliderPosition && this.timeMap) {
                    var curTime = this.timeMap[this.currentSliderPosition - 1]; // account for 0 based array
                    if (curTime)
                        label.setText(this.generateTimelineText(curTime));
                }
            },

            onSliderChange: function(slider, newVal, thumb, opts) {
                // if (!newVal) return;
                this.currentSliderPosition = newVal;
                this.updateVisibleFeatures(newVal);

                this.updateLabelText();
            },

            updateSliderMap: function(roomId, moveSlider) {
                if (roomId === null || roomId === undefined || !roomId) {
                    this.mask();
                    return;
                }

                if (roomId !== this.activeRoomId) {
                    this.resetTimeline();
                }
                this.activeRoomId = roomId;

                // create feature time map
                var timeMap = {};
                var timePosMap = {};
                var sliderMap = {
                    0: []
                };
                // var times = [];
                var times = [0];

                var layer = this.getLayer(roomId);
                if (layer) {
                    // add features to map based on time
                    layer.getSource().getFeatures().forEach(function(feature) {
                        var time = feature.get('timestamp') || feature.get('lastupdate');
                        if (!timeMap[time])
                            timeMap[time] = []; // array to hold all features

                        timeMap[time].push(feature);
                        times.push(time);
                    });

                    var count = 1;
                    for (var i in timeMap) {
                        sliderMap[count] = timeMap[i];
                        timePosMap[i] = count;
                        count++;
                    }
                }

                // update view with new time map
                var len = Object.keys(sliderMap).length - 1; // ignore '0' entry defined above
                var slider = this.getSlider();
                slider.setMaxValue(len);

                this.maxSliderPosition = len;
                this.sliderMap = sliderMap;
                this.timeMap = times;
                this.timePosMap = timePosMap;
                // move slider if we were at latest position
                if (moveSlider || (!moveSlider && (slider.getValue() === this.maxSliderPosition)))
                {
                    slider.setValue(len);
                    this.currentSliderPosition = len;
                } else if (slider.getValue() !== this.currentSliderPosition) {
                    // save old position
                    var curTime = this.timeMap[this.currentSliderPosition];
                    // console.log(curTime);
                    var newPos = timePosMap[curTime];
                    // this.currentSliderPosition = newPos;
                    slider.setValue(newPos);
                }

                this.updateLabelText();

                this.toggleDisableTimeline(false);
                this.unmask();
            },

            onOpenCollabRoom: function(e, menuItem) {
                var name = menuItem.name;
                var roomId = menuItem.collabRoomId;

                // this.updateSliderMap(roomId);
                Ext.Function.defer(this.updateSliderMap, 1000, this, [roomId, true]);
            },

            onCloseCollabRoom: function(e, menuItem) {
                var collabRoomId = menuItem.collabRoomId;

                if (this.activeRoomId === collabRoomId) {
                    this.activeRoomId = null;
                    this.toggleDisableTimeline(true);
                    this.mask();
                }
            },

            /**
             * New feature has been added/modified to the current collabroom. Also triggered when
             * changing feature properties
             * @param e
             * @param collabRoomId
             */
            onUpdateCollabRoom: function(e, collabRoomId) {
                if (collabRoomId !== this.activeRoomId) {
                    return;
                }
                this.updateSliderMap(collabRoomId, false);
                // Ext.Function.defer(this.updateSliderMap, 1000, this, [collabRoomId, false]);
            },

            onActivateCollabRoom: function(e, collabRoomId, readOnly) {
                if (! (collabRoomId == 'myMap')) {
                    this.activeRoomId = collabRoomId;
                    this.toggleDisableTimeline(false);
                    this.unmask();
                    this.updateSliderMap(collabRoomId, true);

                }
            },

            toggleDisableTimeline: function(disabled) {
                this.lookupReference('timelineSlider').setDisabled(disabled);
            },

            getActiveStore: function() {
                return this.sliderMap;
            },

            setActiveStore: function(store) {
                // this.lookupReference('chatLog').setStore(store);
                // this.activeStore = store;
            },

            moveSlider: function(pos) {
                this.getSlider().setValue(pos);
                // this.currentSliderPosition = pos;
            },

            onNextBtnHandler: function() {
                var pos = this.getSlider().getValue();
                if (pos < this.maxSliderPosition) {
                    this.moveSlider(pos + 1);
                }
            },

            onPrevBtnHandler: function() {
                var pos = this.getSlider().getValue();
                if (pos > 0) {
                    this.moveSlider(pos - 1);
                }
            },

            /**
             * generate timeline string for position
             * @param val
             */
            generateTimelineText: function(val) {
                var dateStr;
                if (!val) {
                    dateStr = '0';
                } else {
                    var date = new Date(val);
                    if (date)
                        dateStr = date.toISOString();
                }

                return Ext.String.format('{0}: {1}', Core.Translate.i18nJSON('Viewing layer at time'), dateStr);
            },

            getTimelineLabel: function() {
                return this.view.getLabel();
            },

            mask: function() {
                // if (this.view && this.view.mask)
                //     this.view.mask(Core.Translate.i18nJSON("Choose a Collaboration Room to use the Whiteboard Timeline"), "chat-nonloading-mask");
            },

            unmask: function() {
                // if (this.view && this.view.unmask && !this.isMasked())
                //     this.view.unmask();
            },

            isMasked: function() {
                // if (this.view && this.view.isMasked)
                //     return this.view.isMasked();
                // else
                    return false;
            },

            getSlider: function() {
                return this.view.getSlider();
            },

            getStoreId: function(collabRoomId) {
                return Ext.String.format('whiteboard-timeline-{0}', collabRoomId);
            }

        });
    });
