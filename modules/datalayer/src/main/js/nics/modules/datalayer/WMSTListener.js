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
/**
 * - Handles auto refresh via refresh layer manager
 * - Handles leaving slider on max position to keep up with latest
 * - Handles current layer value running off the end of the slider
 * - Handles playing / looping
 */
define(["ext", "ol", "iweb/CoreModule"], function(Ext, ol, Core) {
  "use strict";

  var WMSTListener = function() {};

  WMSTListener.prototype.init = function() {

    this.onMapLayerAdded = this.onMapLayerAdded.bind(this);
    Core.EventManager.addListener("map-layer-add", this.onMapLayerAdded);
    Core.EventManager.addListener("layerVisible", this.onMapLayerAdded);

    this.onMapLayerRemoved = this.onMapLayerRemoved.bind(this);
    Core.EventManager.addListener("map-layer-remove", this.onMapLayerRemoved);
    Core.EventManager.addListener("layerInvisible", this.onMapLayerRemoved);

    this.onSourceChange = this.onSourceChange.bind(this);

    Core.View.getMainContentComponent().on('resize', this.onMainComponentResize.bind(this));
  };

  WMSTListener.prototype.onMainComponentResize = function() {
    if (this.sliderWindow) {
      this.sliderWindow.mixins.positionable.alignTo.call(
        this.sliderWindow,
        Core.View.getMainContentComponent(),
        'b-b', [80, -10]
      );
    }
  };

  WMSTListener.prototype.onMapLayerRemoved = function(evt, layer) {
    var source = layer.getSource();
    if (this.isWMSSource(source) && this.sliderWindow) {
      this.stopPlayAnimation();
      source.un('change', this.onSourceChange);
      this.layer = null;
      this.getSliderWindow().destroy();
      this.sliderWindow = null;
    }
  };

  WMSTListener.prototype.onMapLayerAdded = function(evt, layer) {
    var source = layer.getSource();
    if (this.isWMSSource(source) && !this.sliderWindow) {
        this.handleLayer(layer)
          .then(function(resp){
            if(resp) {
              source.on('change', this.onSourceChange);
            }
          }.bind(this));
    }
  };

  WMSTListener.prototype.isWMSSource = function(source) {
    return (source && source instanceof ol.source.TileWMS);
  };

  WMSTListener.prototype.onSourceChange = function(evt) {
    var source = evt.target;
    if (!source.ignore && source == this.layer.getSource()) {
      this.handleLayer(this.layer);
    }
  };

  WMSTListener.prototype.handleLayer = function(layer) {
    var source = layer.getSource();
    var url = source.getUrls()[0];
    return this.fetchWMSCapabilities(url)
      .then(function(capabilities) {
        var layerDef = this.getCapabilitiesLayer(
          capabilities.Capability.Layer.Layer, source.getParams()['LAYERS']);
        if (layerDef) {
            var timeDimension = this.getCapabilitiesTime(layerDef);
            if (timeDimension) {
                return this.handleLayerTime(layer, timeDimension);
            }
        }
        return false;
      }.bind(this))
      .otherwise(function(reason) {
        console.error(reason);
      });
  };

  WMSTListener.prototype.rangeRegex = /^([^,\/]*?)[,\/]?([^,\/]*?)[,\/]?([^,\/]*?)$/;
  WMSTListener.prototype.handleLayerTime = function(olLayer, timeDimension) {
    var timeValues = timeDimension.values.split(",");
    var splitValues = timeValues.map(function(val) {
      return this.rangeRegex.exec(val);
    }.bind(this));

    if (splitValues.length) {
        var firstRange = splitValues[0];
        var startDate = Date.parse(firstRange[1]);
        var endDate = Date.parse(firstRange[2]);
        var durationMS = this.parseISODurationMS(firstRange[3]);

        this.getSliderWindow();
        this.updateSliderTitle(olLayer.get('name'));
        var source = olLayer.getSource();

        //use the layers current time if set, otherwise max
        var value = endDate;
        if (source.getParams()['TIME']) {
          value = Date.parse(source.getParams()['TIME']);
        }

        //if the layers value is running off the end, bump it
        if (value > endDate) {
          value = endDate;
          this.onSliderValueChange(value);
        }

        //if the layers value is running off the begining, bump it
        if (value < startDate) {
          value = endDate;
          this.onSliderValueChange(value);
        }


        this.updateSliderRange(startDate, endDate, durationMS);
        this.updateSliderValue(value);
        this.layer = olLayer;

        return true;
    }
    return false;
  };

  WMSTListener.prototype.durationRegex = /^P(?=\d|T\d)(?:(\d+)Y)?(?:(\d+)M)?(?:(\d+)([DW]))?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?)?$/;
  WMSTListener.prototype.parseISODurationMS = function(isoDuration) {
    var matches = this.durationRegex.exec(isoDuration);
    var ms = 0;
    //years
    if (matches[1]) {
      ms += matches[1] * 3.154e+10;
    }
    //months
    if (matches[2]) {
      ms +=  matches[2] * 2.628e+9;
    }
    //weeks
    if (matches[3] && matches[4] === "W") {
      ms +=  matches[3] * 6.048e+8;
    }
    //days
    if (matches[3] && matches[4] === "D") {
      ms +=  matches[3] * 8.64e+7;
    }
    //hours
    if (matches[5]) {
      ms +=  matches[5] * 3.6e+6;
    }
    //minutes
    if (matches[6]) {
      ms +=  matches[6] * 60000;
    }
    //seconds
    if (matches[7]) {
      ms +=  matches[7] * 1000;
    }

    return ms;
  };

  WMSTListener.prototype.getCapabilitiesLayer = function(capLayers, layerName) {
    var lowerName = layerName.toLowerCase();
    return capLayers.find(function(item){
        return item.Name && item.Name.toLowerCase() == lowerName ;
    });
  };

  WMSTListener.prototype.getCapabilitiesTime = function(capLayer) {
    return capLayer.Dimension && capLayer.Dimension.find(function(item){
        return item.name && item.name.toLowerCase() === 'time';
    });
  };

  WMSTListener.prototype.fetchWMSCapabilities = function(url) {
    var capabilitiesUrl = Ext.String.format(
      "{0}?service=WMS&request=GetCapabilities", url);
    return Ext.Ajax.request({
      url: window.location.protocol + "//" + window.location.host + "/nics/proxy",
      method: "GET",
      params: {
        url: capabilitiesUrl
      }
    }).then(function(response) {
      //parse the capabilities document
      return new ol.format.WMSCapabilities().read(response.responseText);
    });
  };

  WMSTListener.prototype.onSliderValueChange = function(newValue) {
    var slider = this.sliderWindow.getComponent('slider');
    var max = slider.maxValue;

    //if the new value is the max, we remove the TIME param,
    //to have it automatically show latest
    var source = this.layer.getSource();
    source.ignore = true;
    source.updateParams({
      'TIME': (newValue === max) ? null : new Date(newValue).toISOString()
    });
    delete source.ignore;

    this.updateSliderValue(newValue);
  };

  WMSTListener.prototype.onPlayToggle = function(btn, pressed) {
    if (pressed) {
      this.onStartPlayAnimation();
    } else {
      this.onStopPlayAnimation();
    }
  };

  WMSTListener.prototype.onPlayTimeChange = function(ms) {
    if (this.isAnimating()) {
      this.onStartPlayAnimation();
    }
  };

  WMSTListener.prototype.startPlayAnimation = function() {
    this.onStartPlayAnimation();
    var container = this.sliderWindow.getComponent('container');
    container.getComponent('playbtn').toggle(true);
  };

  WMSTListener.prototype.stopPlayAnimation = function() {
    this.onStopPlayAnimation();
    var container = this.sliderWindow.getComponent('container');
    container.getComponent('playbtn').toggle(false);
  };

  WMSTListener.prototype.onStartPlayAnimation = function() {
    this.onStopPlayAnimation();

    var container = this.sliderWindow.getComponent('container');
    var ms = container.getComponent('playTime').getValue();
    this.intervalID = window.setInterval(this.onIntervalTick.bind(this), ms);
  };

  WMSTListener.prototype.onStopPlayAnimation = function() {
    if (this.intervalID) {
      window.clearInterval(this.intervalID);
      this.intervalID = null;
    }
  };

  WMSTListener.prototype.isAnimating = function() {
    return this.intervalID != null;
  };


  WMSTListener.prototype.onIntervalTick = function() {
    var slider = this.sliderWindow.getComponent('slider');
    var min = slider.minValue;
    var max = slider.maxValue;
    var val = slider.getValue();
    var step = slider.increment;

    var newValue = val + step;
    if (val === max) {
      newValue = min;
    }
    if (newValue > max) {
      newValue = max;
    }
    this.updateSliderValue(newValue);
    this.onSliderValueChange(newValue);
  };

  WMSTListener.prototype.updateSliderValue = function(value) {
    var slider = this.sliderWindow.getComponent('slider');
    slider.setValue(value);

    var container = this.sliderWindow.getComponent('container');
    var label = container.getComponent('label');
    label.setValue(Ext.Date.format(new Date(value), 'n/j/y g:i A'));
  };
  WMSTListener.prototype.updateSliderRange = function(start, end, step) {
    var slider = this.sliderWindow.getComponent('slider');
    // round values down to closest minute
    slider.setMinValue(Math.floor(start / 60000) * 60000);
    slider.setMaxValue(Math.floor(end / 60000) * 60000);
    slider.increment = step;

    var container = this.sliderWindow.getComponent('labelcontainer');
    var startlabel = container.getComponent('startlabel');
    startlabel.setText(Ext.Date.format(new Date(start), 'n/j/y g:i A'));

    var endlabel = container.getComponent('endlabel');
    endlabel.setText(Ext.Date.format(new Date(end), 'n/j/y g:i A'));
  };

  WMSTListener.prototype.updateSliderTitle = function(layerName) {
    this.sliderWindow.setTitle(layerName + ' Layer Time Selection');
  };

  WMSTListener.prototype.getSliderWindow = function() {
    if (this.sliderWindow) {
      return this.sliderWindow;
    }

    var self = this;
    this.sliderWindow = new Ext.window.Window({
      title: 'Layer Time Selection',
      id: 'WMSTSlider',
      width: 460,
      height: 110,
      resizable: false,
      closable: false,
      bodyPadding: 5,
      layout: {
        type: 'vbox',
        align: 'stretch'
      },
      items: [{
        xtype: 'container',
        itemId: 'container',
        layout: {
          type: 'hbox'
        },
        items: [{
          xtype: 'displayfield',
          flex: 3,
          fieldLabel: 'Showing time',
          itemId: 'label',
          value: ''
        }, {
          xtype: 'button',
          itemId: 'playbtn',
          flex: 1,
          text: '► Play',
          enableToggle: true,
          tooltip: 'Start/Stop auto-playing',
          toggleHandler: function(btn, pressed) {
            self.onPlayToggle(btn, pressed);
          }
        }, {
          xtype: 'segmentedbutton',
          itemId: 'playTime',
          flex: 1,
          value: 5000,
          items: [{
               text: '1s',
               value: 1000,
               tooltip: 'Play Speed: advance once every second'
          },{
               text: '2s',
               value: 2000,
               tooltip: 'Play Speed: advance once every 2 seconds'
          },{
               text: '5s',
               value: 5000,
               tooltip: 'Play Speed: advance once every 5 seconds'
          }],
          listeners: {
            toggle: function(container, button, pressed) {
              self.onPlayTimeChange(container.getValue());
            }
          }
        }]
      }, {
        itemId: 'slider',
        xtype: 'slider',
        value: 5,
        increment: 1,
        minValue: 0,
        maxValue: 10,
        tipText: function(thumb) {
          return Ext.Date.format(new Date(thumb.value), 'n/j/y g:i A');
        },

        listeners: {
          changecomplete: function(slider, newVal) {
            self.onSliderValueChange(newVal);
          }
        }
      },{
        xtype: 'container',
        itemId: 'labelcontainer',
        layout: {
          type: 'hbox'
        },
        items: [{
          xtype: 'label',
          itemId: 'startlabel',
          flex: 1
        }, {
          xtype: 'label',
          itemId: 'endlabel',
          flex: 1,
          style: {
            textAlign: 'right'
          }
        }]
      }]
    });
    this.sliderWindow.show();
    this.sliderWindow.mixins.positionable.alignTo.call(
      this.sliderWindow,
      Core.View.getMainContentComponent(),
      'b-b', [80, -10]
    );

    return this.sliderWindow;
  };

  return WMSTListener;
});
