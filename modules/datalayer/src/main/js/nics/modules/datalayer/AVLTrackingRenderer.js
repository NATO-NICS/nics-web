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
	
	return Ext.define('modules.datalayer.avltrackingrenderer', {
		
		constructor: function(){
			this.showLabels = false;
			this.sources = Core.Config.getProperty("datalayer.avl.source");
			this.featureIds = [];
			MapModule.getClickListener().addRenderer(this);
//			MapModule.getHoverListener().addRenderer(this);

			Core.EventManager.addListener("nics.datalayer.labels",
				this.onPliLabelsChange.bind(this));


			this.getStyle = this.avlGetStyle.bind(this);
			MapModule.getMapStyle().addStyleFunction(this.getStyle);
		},

		onPliLabelsChange: function(evt, checked){
			this.setLabelsVisible(checked);
		},
		
		setLabelsVisible: function(visible) {
			this.showLabels = visible;
		},
		
		setStyleIcon: function(icon){
			this.styleIcon = icon;
		},
		
		avlGetStyle: function(feature, resolution, selected){
			if(!feature.get('deviceid')){
				return;
			}

			if (this.featureIds) {
				if (!Ext.Array.contains(this.featureIds, feature.getId())) {
					if (selected) {
						return;
					}
					this.featureIds.push(feature.getId());
				}
			}

			var graphic;
			if(this.styleIcon){
				graphic = this.styleIcon;
			}else{ //default
			
				var course = feature.get('course') ? feature.get('course') : feature.get('Course');
				
				//TEMPORARY until San Diego changes "heading" to "course"
				if(!course){
					course = feature.get('heading') ? feature.get('heading') : feature.get('Heading');
				}
				
				//default to no direction - active - icon
				graphic = "images/avl/v0.png";
				
				//If a speed is associated then account for it
				if(feature.get('speed') && 
						feature.get('speed') < 1){
					graphic = "images/avl/v0.png";
				}
				
				//If age is associated then account for it
				else if(feature.get('age') && feature.get('age')>140){
					graphic = "images/avl/vstale.png";
				}
				
				else if(course != 0){
					if(course >= 337.5 && course <= 22.5){
						graphic = 'images/avl/vn.png';
					}else if(course >= 22.5 && course <= 67.5){
						graphic = "images/avl/vne.png";
					}else if(course>=67.5 && course <=112.5){
						graphic = "images/avl/ve.png";
					}else if(course >= 112.5 && course <= 157.5){
						graphic = "images/avl/vse.png";
					}else if(course>=157.5 && course<= 202.5){
						graphic = "images/avl/vs.png";
					}else if(course>=202.5 && course <=247.5){
						graphic = "images/avl/vsw.png";
					}else if(course >= 247.5 && course <= 292.5){
						graphic = "images/avl/vw.png";
					}else if(course >= 292.5 && course <= 337.5){
						graphic = "images/avl/vnw.png";
					}
				}
			}
			
			var style = [];
			
			style.push(new ol.style.Style({
				image: new ol.style.Icon({
					src: graphic/*,
					scale: 0.15*/
				})
			}));
			
			if (this.showLabels) {
				var label = feature.get('name') || feature.get('VehicleName') || feature.get('Unit');
				style.push(new ol.style.Style({
					text: new ol.style.Text({ // TODO: ideally we'd make these properties configurable
						font: '16px sans-serif',
						text: label,
						textAlign: 'center',
						fill: new ol.style.Fill({color: 'blue'}),
						stroke: new ol.style.Stroke({color: '#ffffff', width: 3}),
						//offsetX: 32,
						offsetY: -15
					})
				}));
			}
			
			if(selected){
				style.push(new ol.style.Style({
					image: new ol.style.Circle({
						radius: 10,
						fill: new ol.style.Fill({
							color: 'rgba(0, 255, 255, 0.4)'
						}),
						stroke: new ol.style.Stroke({
							color: 'rgb(0, 255, 255)'
						})
					})
				}));
			}

			return style;
		},
		
		render: function(container, feature) {

			//check for feature.get('course')
			if(feature && typeof feature.getId() == 'string'
				&& (feature.getId().startsWith('mobiledevicetrack')
				|| feature.getId().startsWith('mdt') ||
				//This included SIMPOSTs
				feature.getProperties()["deviceid"] != null)) {


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
							fieldLabel: Core.Translate.i18nJSON(property),
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
		}
	});

});
