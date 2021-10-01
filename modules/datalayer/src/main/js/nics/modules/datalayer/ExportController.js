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
define(['ext', "ol", "iweb/CoreModule", 'iweb/modules/MapModule','nics/modules/UserProfileModule'],
	function(Ext, ol, Core, MapModule, UserProfile){
		Ext.define('modules.datalayer.js.ExportController', {
			extend : 'Ext.app.ViewController',

			alias: 'controller.exportcontroller',

			init: function(){
				Core.EventManager.addListener("nics.incident.join", this.onJoinIncident.bind(this));
				Core.EventManager.addListener("nics.incident.close", this.onCloseIncident.bind(this));
				Core.EventManager.addListener("nics.collabroom.activate", this.onActivateCollabRoom.bind(this));
			},

			onJoinIncident: function(e, incident){
				this.incidentId = incident.id;
			},

			onCloseIncident: function(e, incident){
				this.incidentId = null;
				this.collabRoomId = null;
			},
			onActivateCollabRoom: function(e, collabRoomId,readOnly, collabRoomName){
				if(collabRoomId != 'myMap'){
					this.collabRoomId = collabRoomId;
				}else{
					this.collabRoomId = null;
				}
				this.collabRoomName = collabRoomName;
			},

			onFormatSelect: function( combo, record, eOpts ){
				var typeCombo = this.view.lookupReference("exportType");
				if(record.data.formatType.indexOf("Capabilities") > -1){
					typeCombo.setDisabled(true);
				}else{
					// filter by name
					if(record.data.formatId === "gpx"){
						typeCombo.getStore().filterBy(function(rec){
							if(rec.data.featureType != "polygon"){
								return true;
							}
							return false;
						});
					}else{
						typeCombo.getStore().clearFilter();
					}

					typeCombo.setDisabled(false);
				}
			},

			exportRoom: function(){
				var format = this.getView().getFormat();
				var type = this.getView().getType();
				if(format && type){
					if(format == "wms" || format == "wfs"){
						this.exportCapabilities(format);
					}else if(format == "gpx"){
						this.exportGPX(this.collabRoomId);
					}else if(format == "csv"){
						this.exportMarkerCSV(this.collabRoomId);
					}else{
						this.exportDatalayer(type, format);
					}
				}else{
					Ext.MessageBox.alert(Core.Translate.i18nJSON("Export Current Room"), ("The export format type is not valid."));
				}
			},

			exportGPX: function(collabroomId) {
				var layer = MapModule.getMapController().getRoomLayer(collabroomId);
				if(layer) {
					var formatter = new ol.format.GPX();

					var features = this.getFeatureTypes(layer.getSource().getFeatures(),
						this.getView().getFeatureType());

					var gpx = formatter.writeFeatures(features,
						{featureProjection: 'EPSG:3857', dataProjection:'EPSG:4326'});

					var link = document.createElement('a');
					link.setAttribute("href",
						'data:text/plain;charset=utf-8,' +
						encodeURIComponent(gpx));
					link.setAttribute("download", this.collabRoomName + ".gpx");

					document.body.appendChild(link);
					link.click();
					document.body.removeChild(link);
				}else{
					Ext.MessageBox.alert(Core.Translate.i18nJSON("Export Current Room"),
						Core.Translate.i18nJSON("There was an error exporting the room"));
				}
			},

			exportMarkerCSV: function(collabroomId) {
				var layer = MapModule.getMapController().getRoomLayer(collabroomId);
				if(layer) {
					var csvArr = [];
					try {
						var features = this.getFeatureTypes(layer.getSource().getFeatures(),
							this.getView().getFeatureType());

						for (var i = 0; i < features.length; i++) {
							var feature = features[i];
							if (feature.get("type") === "marker") {
								var geometry = ol.proj.transform(feature.getGeometry().getCoordinates(),
									'EPSG:3857', 'EPSG:4326');
								var comment = "No Comment";
								var description = "";

								var attr = feature.get("attributes");
								if (attr && attr.comments) {
									//Remove line breaks
									comment = attr.comments.replace(/(\r\n|\n|\r)/gm, " ");
								}
								if (attr && attr.description) {
									description = attr.description;
									description = description.replace(/<br\/>/g, "");
									//Remove line breaks
									description = description.replace(/(\r\n|\n|\r)/gm, " ");
								}

								var row = [];
								row.push(feature.get('graphic'));
								row.push(geometry[0]);
								row.push(geometry[1]);
								row.push(comment);
								row.push(description);

								csvArr.push(row);
							}
						}
						var csvStr = Ext.util.CSV.encode(csvArr);

						var link = document.createElement('a');
						link.setAttribute("href",
							'data:text/plain;charset=utf-8,' +
							encodeURIComponent(csvStr));
						link.setAttribute("download", this.collabRoomName + ".csv");

						document.body.appendChild(link);
						link.click();
						document.body.removeChild(link);
					}catch(e){
						Ext.MessageBox.alert(Core.Translate.i18nJSON("Export Current Room"),
							Core.Translate.i18nJSON("There was an error exporting the room"));
					}
				}else{
					Ext.MessageBox.alert(Core.Translate.i18nJSON("Export Current Room"),
						Core.Translate.i18nJSON("There was an error exporting the room"));
				}
			},

			getFeatureTypes: function(features, type){
				var filteredFeatures = [];
				var _this = this;
				features.forEach(function(feature){
					if(type == 'all' ||
						feature.get('type') === type){
						filteredFeatures.push(_this.cloneFeature(feature));
					}
				});
				return filteredFeatures;
			},

			cloneFeature: function(feature){
				var clone = feature.clone();
				//Convert to a MultiLineString
				if(feature.getGeometry().getType() == 'LineString'){
					clone.setGeometry(
						new ol.geom.MultiLineString([
							feature.getGeometry().getCoordinates()])
					);
				}
				//Add the name
				if(feature.get('labelText')){
					clone.set("name", feature.get('labelText'));
				}
				return clone;
			},

			//collabroomId}/incident/{incidentId}/user/{userId}/type/{exportType}/format/{exportFormat}
			exportDatalayer: function(type, format) {
				var lonlat = ol.proj.toLonLat( MapModule.getMap().getView().getCenter() );
				var longitude = lonlat[0];
				var latitude = lonlat[1];
				var useLonLat = false;
				var lonLatQuery;

				if(longitude && latitude) {
					useLonLat = true;
					lonLatQuery = Ext.String.format("?lon={0}&lat={1}", longitude, latitude);
				}

				if(this.collabRoomId && this.incidentId){
					var url = Ext.String.format('{0}/collab/export/{1}/incident/{2}/user/{3}/type/{4}/format/{5}{6}',
						Core.Config.getProperty(UserProfile.REST_ENDPOINT),
						this.collabRoomId, this.incidentId, UserProfile.getUserId(), type, format,
						(useLonLat) ? lonLatQuery : "");

					this.getView().hide();

					window.open(url);
				}
				else{
					Ext.MessageBox.alert(Core.Translate.i18nJSON("Export Current Room"), Core.Translate.i18nJSON("You are not currently in a collaboration room."));
				}
			},

			//incident/{incidentId}/user/{userId}/format/{exportFormat}
			exportCapabilities: function(exportFormat){
				if(this.incidentId){
					var url = Ext.String.format('{0}/collab/export/incident/{1}/user/{2}/format/{3}',
						Core.Config.getProperty(UserProfile.REST_ENDPOINT),
						this.incidentId, UserProfile.getUserId(), exportFormat);

					this.getView().hide();

					window.open(url);
				}
				else{
					Ext.MessageBox.alert(Core.Translate.i18nJSON("Export Get Capabilities"), Core.Translate.i18nJSON("You are not currently in an incident."));
				}
			}
		});
	});
