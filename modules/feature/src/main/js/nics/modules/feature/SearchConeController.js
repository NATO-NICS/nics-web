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
define(["ext", "ol", "proj4", "iweb/modules/MapModule", "iweb/modules/drawmenu/Interactions"],
	function(Ext, ol, proj4mod, MapModule, Interactions) {
	const proj4 = proj4mod.default;

	return Ext.define("modules.feature.SearchConeController", {
		extend: 'Ext.app.ViewController',
		
		alias: 'controller.feature.searchconecontroller',
	
		/**
		 * Called when we are initialized with a view
		 */
		init: function() {

		},
		
		/**
		 * Fired on window close
		 */
		onWindowClose: function() {
			this.removeInteraction();
			this.removeLayer();
		},
		
		onAddToRoomClick: function() {
			this.removeLayer();

			var features = this.buildFeatures();
			if (features) {
				MapModule.getMapController().getSource().addFeatures(features);
			}
		},

		onDrawClick: function() {
			this.removeLayer();

			var features = this.buildFeatures();
			if (features) {
				this.getLayer().getSource().addFeatures(features);
			}
		},

		onClearClick: function() {
			this.removeLayer();
			this.removeInteraction();
		},

		verifyFields: function() {
			var crs = this.getSelectedCRS();
			if (!crs) {
				Ext.Msg.alert('Search Cone', 'CRS is required');
				return false;
			}

			var lng = parseFloat(this.lookupReference('lng').getValue());
			if (lng == null) {
				Ext.Msg.alert('Search Cone', 'Longitude is required');
				return false;
			}

			var lat = parseFloat(this.lookupReference('lat').getValue());
			if (lat == null) {
				Ext.Msg.alert('Search Cone', 'Latitude is required');
				return false;
			}

			var azimuthDegrees = parseFloat(this.lookupReference('azimuth').getValue());
			if (azimuthDegrees == null) {
				Ext.Msg.alert('Search Cone', 'Azimuth is required');
				return false;
			}

			var deltaDegrees = parseFloat(this.lookupReference('delta').getValue());
			if (deltaDegrees == null || deltaDegrees == 0) {
				Ext.Msg.alert('Search Cone', 'Delta is required');
				return false;
			}

			var radiusKM = parseFloat(this.lookupReference('radius').getValue());
			if (radiusKM == null || radiusKM == 0) {
				Ext.Msg.alert('Search Cone', 'Radius is required');
				return false;
			}

			return {
				lng: lng,
				lat: lat,
				azimuthDegrees: azimuthDegrees,
				deltaDegrees: deltaDegrees,
				radiusKM: radiusKM
			};
		},

		buildFeatureDescription: function(fields) {
			return fields.radiusKM + "KM radius " + fields.azimuthDegrees + "° +/-" + fields.deltaDegrees + "°";
		},


		buildFeatures: function() {
			var fields = this.verifyFields();
			if (!fields) {
				return;
			}

			var features = [];
			features.push(this.buildRadiusFeature(fields));
			features.push(this.buildSquareFeature(fields));
			features.push(this.buildCircleFeature(fields));
			features.push(this.buildCircleSegmentFeature(fields));			
			return features;
		},

		buildRadiusFeature: function(fields) {
			var mapProjection = MapModule.getMap().getView().getProjection();
			var crs = this.getProjection();
			var radiusM = fields.radiusKM * 1000;

			var coords = ol.proj.transform([fields.lng, fields.lat], crs, "EPSG:4326");
			var radiusPt = this.offset(coords, radiusM, this.toRadians(fields.azimuthDegrees));
			var radiusLine = new ol.geom.LineString([coords, radiusPt]);
			radiusLine.transform("EPSG:4326", mapProjection);
			var feature = new ol.Feature({ geometry: radiusLine });
			feature.setProperties({
				type: 'sketch',
				strokeWidth: 1,
				strokeColor: "#FF0000",
				attributes: {
					description: "Radius length " + fields.radiusKM + "KM"
				}
			});
			return feature;
		},

		buildSquareFeature: function(fields) {
			var mapProjection = MapModule.getMap().getView().getProjection();
			var crs = this.getProjection();
			var radiusM = fields.radiusKM * 1000;

			var coords = ol.proj.transform([fields.lng, fields.lat], crs, "EPSG:4326");

			var outRadius = Math.sqrt(2 * radiusM * radiusM);
			var squareLine = this.makeSquareLineString(coords, outRadius, fields.azimuthDegrees);
			squareLine.transform("EPSG:4326", mapProjection);
			var feature = new ol.Feature({ geometry: squareLine });
			feature.setProperties({
				type: 'sketch',
				dashStyle: 'dashed',
				strokeWidth: 1,
				strokeColor: "#000000",
				opacity: 0.4,
				attributes: {
					description: "Square with sides " + fields.radiusKM + "KM"
				}
			});
			return feature;
		},

		buildCircleFeature: function(fields) {
			var mapProjection = MapModule.getMap().getView().getProjection();
			var crs = this.getProjection();
			var radiusM = fields.radiusKM * 1000;

			var coords = ol.proj.transform([fields.lng, fields.lat], crs, "EPSG:4326");
			var circlePoly = ol.geom.Polygon.circular(coords, radiusM);
			circlePoly.transform("EPSG:4326", mapProjection);
			var feature = new ol.Feature({ geometry: circlePoly });
			feature.setProperties({
				type: 'polygon',
				strokeWidth: 1,
				strokeColor: "#000000",
				fillColor: "#000000",
				opacity: 0,
				attributes: {
					description: "Circle with radius " + fields.radiusKM + "KM"
				}
			});
			return feature;
		},

		buildCircleSegmentFeature: function(fields) {
			var mapProjection = MapModule.getMap().getView().getProjection();
			var crs = this.getProjection();
			var radiusM = fields.radiusKM * 1000;

			var coords = ol.proj.transform([fields.lng, fields.lat], crs, "EPSG:4326");
			var conePoly = this.makeCircleSegmentPoly(coords, radiusM,
				fields.azimuthDegrees, fields.deltaDegrees);
			conePoly.transform("EPSG:4326", mapProjection);
			var feature = new ol.Feature({ geometry: conePoly });
			feature.setProperties({
				type: 'polygon',
				strokeWidth: 1,
				strokeColor: "#000000",
				fillColor: "#000000",
				opacity: 0.2,
				attributes: {
					description: this.buildFeatureDescription(fields)
				}
			});
			return feature;
		},

		makeCircleSegmentPoly: function(coord, radiusM, azimuthDegrees, deltaDegrees) {
			var totalDegrees = (deltaDegrees * 2);
			var stepSize = Math.pow(10, Math.floor( Math.log10(totalDegrees) ) - 1);
			var steps = totalDegrees / stepSize;
			
			var flatcoords = [];
			flatcoords = flatcoords.concat(coord);

			var degrees = azimuthDegrees - deltaDegrees;
			for (var i = 0; i <= steps; i += 1) {
				flatcoords = flatcoords.concat(this.offset(coord, radiusM, this.toRadians(degrees)));
				degrees += stepSize;
			}
			flatcoords.push(flatcoords[0], flatcoords[1]);

			return new ol.geom.Polygon(flatcoords, "XY", [flatcoords.length]);
		},

		makeSquareLineString: function(coord, radiusM, azimuthDegrees) {	
			var flatcoords = [];

			var degrees = azimuthDegrees + 45;
			for (var i = 0; i < 4; i += 1) {
				flatcoords = flatcoords.concat(this.offset(coord, radiusM, this.toRadians(degrees)));
				degrees += 90;
			}
			flatcoords.push(flatcoords[0], flatcoords[1]);

			return new ol.geom.LineString(flatcoords, "XY", [flatcoords.length]);
		},


		removeInteraction: function() {
			if (this.previousInteractions) {
				MapModule.getMapController().setInteractions(this.previousInteractions);
				this.previousInteractions = null;
			}
		},

		onLocateToggle: function(btn, state) {
			if (!state) {
				this.removeInteraction();
				return;
			}

			this.previousInteractions = MapModule.getMapController().getInteractions();

			var formProjection = this.getSelectedCRS();
			if (!formProjection) {
				Ext.Msg.alert('Locate', 'Locate requires a projection');
				this.untoggleLocate();
				return;
			}
			
			var style = this.buildStyle();
			var interaction = Interactions.drawPoint(null, style);
			interaction.on("drawend", this.onDrawEnd.bind(this));
			MapModule.getMapController().setInteractions([interaction]);
		},

		untoggleLocate: function() {
			this.lookupReference('locateButton').toggle(false);
		},

		onDrawEnd: function(drawEvent) {
			this.untoggleLocate();

			var formProjection = this.getProjection();
			if (!formProjection) {
				return;
			}

			var mapProjection = MapModule.getMap().getView().getProjection();

			var feature = drawEvent.feature;
			var clone = feature.getGeometry().clone()
				.transform(mapProjection, formProjection);
			var coord = clone.getCoordinates();
			this.setCoordinate(coord);
			
		},

		/**
		 * Get the currently selected CRS data
		 * @returns The CRS Object or null if none selected
		 */
		getSelectedCRS: function() {
			var combo = this.lookupReference('crs');
			var record = combo.getSelectedRecord();
			if (!record) {
				return null;
			}
			return record.getData();
		},

		/**
		 * Construct an openlayers/proj4 projection from a code and definition
		 * @returns the projection or null if there was a failure
		 */
		buildProjection: function(code, proj4def) {
			var newProjCode = 'EPSG:' + code;
			proj4.defs(newProjCode, proj4def);

			ol.proj.proj4.register(proj4);

			return ol.proj.get(newProjCode);
		},

		/**
		 * Get the projection for this panel.
		 * @returns The currently selected projection or null if none selected
		 */
		getProjection: function() {
			var crs = this.getSelectedCRS();
			if (!crs) {
				return null;
			}
			return this.buildProjection(crs.code, crs.proj4);
		},

		setCoordinate: function(coord) {
			var lng = coord[0].toString();
			this.lookupReference('lng').setValue(lng);
			
			var lat = coord[1].toString();
			this.lookupReference('lat').setValue(lat);
		},

		buildStyle: function() {
			var fill = new ol.style.Fill({
				color: 'rgba(255, 204, 51, 0.6)'
			});
			var stroke = new ol.style.Stroke({
				color: 'black',
				width: 1
			});
			return new ol.style.Style({
				fill: fill,
				storke: stroke,
				image: new ol.style.Circle({
					radius: 7,
					fill: fill,
					stroke: stroke
				})
			});
		},

		getLayer: function() {
			if (!this.activeLayer) {
				this.activeLayer = new ol.layer.Vector({
					source: new ol.source.Vector(),
					style: MapModule.getMapController().getStyle
				});
				MapModule.getMapController().addLayer(this.activeLayer);
			}
			return this.activeLayer;
		},
		
		plotFeature: function(feature){
			this.getLayer().getSource().addFeature(feature);
		},
		
		removeLayer: function() {
			if (this.activeLayer) {
				MapModule.getMapController().removeLayer(this.activeLayer);
				this.activeLayer = null;
			}
		},

		/**
		 * Converts radians to to degrees.
		 *
		 * @param {number} angleInRadians Angle in radians.
		 * @return {number} Angle in degrees.
		 */
		toDegrees: function(angleInRadians) {
			return angleInRadians * 180 / Math.PI;
		},
  
		/**
		 * Converts degrees to radians.
		 *
		 * @param {number} angleInDegrees Angle in degrees.
		 * @return {number} Angle in radians.
		 */
		toRadians: function(angleInDegrees) {
			return angleInDegrees * Math.PI / 180;
		},

		/**
		 * Copied from OL because it was a non-api method so not available in the bundle.
		 * 
		 * Returns the coordinate at the given distance and bearing from `c1`.
		 *
		 * @param {import("./coordinate.js").Coordinate} c1 The origin point (`[lon, lat]` in degrees).
		 * @param {number} distance The great-circle distance between the origin
		 *     point and the target point.
		 * @param {number} bearing The bearing (in radians).
		 * @param {number=} opt_radius The sphere radius to use.  Defaults to the Earth's
		 *     mean radius using the WGS84 ellipsoid.
		 * @return {import("./coordinate.js").Coordinate} The target point.
		 */
		offset: function(c1, distance, bearing, opt_radius) {
			var radius = 6371008.8;
			var lat1 = this.toRadians(c1[1]);
			var lon1 = this.toRadians(c1[0]);
			var dByR = distance / radius;
			var lat = Math.asin(
			  Math.sin(lat1) * Math.cos(dByR) +
				Math.cos(lat1) * Math.sin(dByR) * Math.cos(bearing));
			var lon = lon1 + Math.atan2(
			  Math.sin(bearing) * Math.sin(dByR) * Math.cos(lat1),
			  Math.cos(dByR) - Math.sin(lat1) * Math.sin(lat));
			return [this.toDegrees(lon), this.toDegrees(lat)];
		  }
	});

});
