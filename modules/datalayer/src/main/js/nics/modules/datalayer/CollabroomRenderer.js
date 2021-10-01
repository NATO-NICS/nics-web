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

    return Ext.define('modules.datalayer.collabroomrenderer', {

      constructor: function() {
        MapModule.getClickListener().addRenderer(this);
//        MapModule.getHoverListener().addRenderer(this);

        this.getStyle = this.getStyle.bind(this);
      },

      setLabelsVisible: function(visible) {
        this.showLabels = visible;
      },

      /**
       * This is a read-only version of the collabroom style to be used for WFS layers of collabrooms.
       * @param feature
       * @param resolution
       * @param selected
       * @returns {*[]}
       */
      getStyle: function(feature, resolution, selected) {
        var geometry = feature.getGeometry();
        var featType = feature.get('type');
        var styles = [];

        var strokeColor = feature.get('strokecolor'),
            strokeWidth = feature.get('strokewidth') || 1.25,
            fillColor = feature.get('fillcolor') || strokeColor, // default to stroke color if no fill color defined
            opacity = parseFloat(feature.get('opacity'));

        var fill = new ol.style.Fill({
          color: fillColor
        });
        var stroke = new ol.style.Stroke({
          color: strokeColor,
          width: parseFloat(strokeWidth),
          fill: fill
        });

        var style = null;

        if (featType === 'marker') {
          // handle markers
          var graphic = feature.get('graphic') || 'images/drawmenu/markers/default_marker.png',
            rotation = feature.get('rotation') || 0;

          // Update graphic with symbology path if it's not the default
          if(graphic.indexOf("markers/default_marker.png") === -1) {
            graphic = Ext.String.format("../{0}/{1}",
                Core.Config.getProperty("endpoint.symbology"),
                graphic);
          }

          styles.push(new ol.style.Style({
            geometry: geometry,
            image: new ol.style.Icon({
              src: graphic,
              anchor: [0.75, 0.5],
              rotateWithView: true,
              rotation: parseFloat(rotation)
            })
          }));
        } else if (featType === 'label') {
          // handle labels
          var labelText = feature.get('labeltext'),
              labelSize = feature.get('labelsize'),
              rotation = feature.get('rotation') || 0;

          // default
          strokeColor = 'white';

          styles.push(new ol.style.Style({
            text: new ol.style.Text({
              text: labelText,
              rotation: parseFloat(rotation),
              fill: new ol.style.Fill({
                color: fillColor
              }),
              stroke: new ol.style.Stroke({
                color: strokeColor,
                width: strokeWidth
              }),
              scale: 1,
              font: labelSize + 'px arial'
            })
          }));

        } else if (featType === 'sketch' || featType === 'polygon' || featType === 'circle'
                    ||featType === 'triangle' || featType === 'square' || featType === 'hexagon') {

          // check if we have a fireline
          var dashStyle = feature.get('dashstyle');
          feature.set('dashStyle', dashStyle); // property keys differ in camelCase from WFS and database.
          feature.set('strokeColor', strokeColor);
          feature.set('strokeWidth', parseFloat(strokeWidth));
          feature.set('fillColor', fillColor);
          if (dashStyle && (dashStyle === 'primary-fire-line' ||
                            dashStyle === 'secondary-fire-line' ||
                            dashStyle === 'action-point' ||
                            dashStyle === 'completed-dozer-line' ||
                            dashStyle === 'proposed-dozer-line' ||
                            dashStyle === 'fire-edge-line')) {
            style = MapModule.getMapStyle().getStyle(feature, resolution, selected);
          } else {
            if (dashStyle === "dashed") {
              stroke.setLineDash([12, 12]);
            }

            style = new ol.style.Style({
              stroke: stroke,
              fill: fill
            });

            if (opacity !== 1 && fillColor != undefined) {
              var rgba = MapModule.getMapStyle().getRGBComponents(fillColor);
              style.getFill().setColor(rgba.concat(opacity));
            }
          }
        } else {
          style = MapModule.getMapStyle().getStyle(feature, resolution, selected);
        }

        if (style) {
          if (style.constructor === Array) {
            styles = style;
          } else {
            styles.push(style);
          }
        }

        return styles;
      },

      render: function(container, feature) {},

      isRenderer: function(url){}
    });
  });
