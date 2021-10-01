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
	
	return Ext.define('modules.datalayer.avlbreadcrumbrenderer', {
		
		constructor: function(){
			this.showLabels = false;
			this.sources = Core.Config.getProperty("datalayer.avl.source");
			MapModule.getClickListener().addRenderer(this);
//			MapModule.getHoverListener().addRenderer(this);

			this.getStyle = this.getStyle.bind(this);
			MapModule.getMapStyle().addStyleFunction(this.getStyle);

			this.segmentStyle = false;
		},
		
		setLabelsVisible: function(visible) {
			this.showLabels = visible;
		},

		setStyleIcon: function(icon){
			this.styleIcon = icon;
		},

		setSegmentStyle: function(segmentStyle){
			this.segmentStyle = segmentStyle;
		},
		
		getStyle: function(feature, resolution, selected){
			if(feature && (typeof feature.getId() != 'string'
				|| (feature.getId().indexOf('nics_breadcrumbs') == -1))){
				return;
			}

			var color = this.generateColor(feature);

			var styles = [];

			var geometry = feature.getGeometry();

			//Add lines to track
			if(this.segmentStyle) {
				styles.push(
					// linestring
					new ol.style.Style({
						stroke: new ol.style.Stroke({
							color: color,
							width: 2
						})
					})
				);
			}

			//Add points and arrows
	        if(this.styleIcon && geometry.forEachSegment) {
				var _styleIcon = this.styleIcon;

				geometry.forEachSegment(function(start, end) {
					// arrows
					var dx = end[0] - start[0];
					var dy = end[1] - start[1];
					var rotation = Math.atan2(dy, dx);

					//Point and no line
					if(_styleIcon.indexOf("point") != -1 &&
						!this.segmentStyle){

						var stroke = new ol.style.Stroke({
							color: '#000000',
							width: 1.25
						});
						var fill = new ol.style.Fill({
							color: color
						});

						styles.push(new ol.style.Style({
							geometry: new ol.geom.Point(end),

							image: new ol.style.Circle({
								fill: fill,
								stroke: stroke,
								radius: 5
							})
						}));
					}
					//Arrow (w or w/o a line) and points on lines
					else {
						styles.push(new ol.style.Style({
							geometry: new ol.geom.Point(end),

							image: new ol.style.Icon({
								src: _styleIcon,
								anchor: [0.75, 0.5],
								rotateWithView: true,
								rotation: -rotation
							})
						}));
					}
				});
			}

	        return styles;
		},
		
		render: function(container, feature) {
			//check for feature.get('course')
			if(feature && typeof feature.getId() == 'string'
				&& (feature.getId().indexOf('nics_breadcrumbs') != -1)) {

				// check for origin layer
				var originLayer = feature.get('origin_layer');
				if (originLayer) {
					var layerField = new Ext.form.field.Display({
						fieldLabel: Core.Translate.i18nJSON('Origin Layer'),
						value: originLayer
					});
					container.add(layerField);
				}

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
							fieldLabel: property,
							value: value
						}));
					}
				}

				// display coordinates in WKT
				if (feature.getGeometry()) {
					// set coordinates
					var view = MapModule.getMap().getView();
					var clone = feature.getGeometry().clone().transform(view.getProjection(), ol.proj.get('EPSG:4326'));
					var coords = clone.getCoordinates();
					if (coords && coords.length == 3) {
						var format = Ext.String.format('{0}, {1}', coords[1], coords[0]);
						var coordsField = new Ext.form.field.Display({
							fieldLabel: Core.Translate.i18nJSON('Coordinates'),
							value: format
						});
						container.add(coordsField);
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

		generateColor: function(feature){
			if(feature && feature.getProperties() &&
				feature.getProperties().username){

				var username = feature.getProperties().username;
				var hash = 0;

				for (var i = 0; i < username.length; i++) {
					hash = username.charCodeAt(i) + ((hash << 5) - hash);
				}

				var c = (hash & 0x00FFFFFF)
					.toString(16)
					.toUpperCase();

				return '#' + "00000".substring(0, 6 - c.length) + c;
			}else{
				return '#4d78ff';
			}
		}
	});

});
