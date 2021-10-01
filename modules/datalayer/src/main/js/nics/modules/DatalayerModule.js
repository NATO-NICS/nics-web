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
define(["iweb/CoreModule",
        "./datalayer/Button", "./datalayer/Window",
        "./datalayer/DataWindow", "./datalayer/MapsController",
        "./datalayer/ExportView", "./datalayer/DatalayerPanelView", 
        "nics/modules/UserProfileModule", "./datalayer/TrackingWindow",
		"./datalayer/TrackingLocatorWindow", "./datalayer/DatalayerBuilder",
		"./datalayer/RefreshLayerManager", "./datalayer/WMSTListener"],
	
	function(Core, Button, Window, DataWindow, MapsController, ExportView,
			 DatalayerPanelView, UserProfile, TrackingWindow, TrackingLocatorWindow,
			 DatalayerBuilder, RefreshLayerManager, WMSTListener) {
	
		var DatalayerModule = function(){};

    // initialize datalayer builder
    DatalayerModule.prototype.datalayerBuilder = Ext.create('modules.datalayer.builder');

    DatalayerModule.prototype.load = function(){
			
			(new WMSTListener()).init();

			var mapsButton = new Button({
				text: Core.Translate.i18nJSON('Maps'),
				window: new Window({
					rootName: 'Maps',
					controller: 'datalayer.mapscontroller'
				})
			});

			var importDataButton = new DataWindow({
					rootName: 'Data'
				});

			Core.EventManager.addListener(UserProfile.PROFILE_LOADED, importDataButton.hideImportButton);

			var dataButton = new Button({
				text: Core.Translate.i18nJSON('Data'),
				window: importDataButton
			});
			
			var weatherButton = new Button({
				text: Core.Translate.i18nJSON('Weather'),
				window: new Window({
					rootName: 'Weather'
				})
			});

			var tw = new TrackingWindow({
				rootName: 'Tracking'
			});


			var trackingButton = new Button({
				text: Core.Translate.i18nJSON('Tracking'),
				window: tw
			});
			
			//Add View to Core
			Core.View.addButtonPanel(
					[ "-", mapsButton, dataButton, weatherButton, trackingButton ]
			);

			Core.EventManager.addListener("nics.data.legend.show", this.showLegend);
			Core.EventManager.addListener("nics.data.legend.update", this.updateLegend);
			Core.EventManager.addListener("nics.data.legend.ajax", this.getHtml);
			Core.EventManager.addListener("nics.incident.join", this.onJoinIncident);
			Core.EventManager.addListener("nics.incident.close", this.clearIncidentRoomsMenuItems.bind(this));
			Core.EventManager.addListener("nics.userorg.change", this.removeRestrictedLayers);
			Core.EventManager.addListener("nics.collabroom.load", this.onLoadCollabRooms.bind(this));
			// collabroom changing
			Core.EventManager.addListener("nics.collabroom.close", this.onCollabRoomClose.bind(this));
			Core.EventManager.addListener("nics.collabroom.activate", this.onCollabRoomActivate.bind(this));
			Core.EventManager.addListener("nics.collabroom.open", this.onCollabRoomOpen.bind(this));
			Core.EventManager.addListener("nics.collabroom.rename.tab", this.renameIncidentRoomMenuItem.bind(this));
			var datalayerPanelViewer = Ext.create('modules.datalayer.DatalayerPanelView');
			
			Core.View.addToSidePanel(datalayerPanelViewer);
		};
		
		DatalayerModule.prototype.addExport = function(){
			//Add Export Room
			var view = Ext.create('modules.datalayer.js.ExportView',{});
			//Add Item to Tools Menu
			Core.Ext.ToolsMenu.add({
					text: Core.Translate.i18nJSON('Export Room'),
					handler: function(){
						if(view.getController().collabRoomId && view.getController().incidentId){
							view.show();
						}else{
							Ext.MessageBox.alert(Core.Translate.i18nJSON("Export Current Room"), Core.Translate.i18nJSON("You are not currently in a collaboration room."));
						}
					}
				}
			); 	
		};

		DatalayerModule.prototype.addIncidentRooms = function() {
      Core.Ext.ToolsMenu.add({
          text: Core.Translate.i18nJSON('Incident Rooms'),
          menu: {
            id: 'toolsmenu-IncidentRoomsMenu',
            items:[]
          }
        }
      );
    };

    DatalayerModule.prototype.getIncidentRoomsMenu = function() {
      var menu = Ext.getCmp('toolsmenu-IncidentRoomsMenu');
      return menu;
    };

    DatalayerModule.prototype.clearIncidentRoomsMenuItems = function() {
      var menu = this.getIncidentRoomsMenu();
      if (menu) {
        while(menu.items.length > 0) {
          var item = menu.items.get(menu.items.length - 1);
          if (item && item.layer && item.layerUid && item.refreshrate) {
            // remove
            RefreshLayerManager.removeLayer(item.refreshrate, item.layerUid);
            Core.Ext.Map.removeLayer(item.layer);
          }

          menu.remove(item);
        }
      }
    };

    DatalayerModule.prototype.renameIncidentRoomMenuItem = function(evt, id, name){
		var menu = this.getIncidentRoomsMenu();
		if (menu) {
			for(var i=0; i<menu.items.length; i++){
				var item = menu.items.get(i);

				if(item.collabId == id){
					item.setText(name);
					break;
				}
			}
		}
	};

	DatalayerModule.prototype.addIncidentRoomMenuItem = function(room) {
    	var menu = this.getIncidentRoomsMenu();
    	var collabroomId = room.collabRoomId;
			var name = room.name.substring(room.name.indexOf('-') + 1, room.name.length);

    	if (menu && collabroomId && name) {
    		var item = Ext.create('Ext.menu.CheckItem', {
					text: name,
					collabId: collabroomId,
					layerType: 'wfs',
					// handler: this.handleIncidentRoomSelect.bind(this),
					checkHandler: this.handleIncidentRoomSelect.bind(this)
				});
				menu.add(item);

				// initialize array for each collabroom in the incident
				this.roomLayerMgmt[collabroomId] = [];
				this.roomMenuMap[collabroomId] = item;
			}
		};

    DatalayerModule.prototype.handleIncidentRoomSelect = function(item, suppressAction) {
      // since this is specific for collabroom, we know the namespace. TODO: properties file?
      var layername = Ext.String.format('nics.collaborationfeed:R{0}', item.collabId);
      var config = {
        url: Ext.String.format('{0}/wfs', Core.Config.getProperty('endpoint.geoserver')),
        layername: layername,
        layerType: item.layerType,
		displayName: item.text,
		stylepath: 'modules.datalayer.collabroomrenderer',
		opacity: 0.75
      };

      if (item.checked) {
        // item was just enabled
        if (!item.layer) {
          var layerUid = Ext.String.format('incidentRoomLayer-{0}', item.collabId);
          item.layer = this.datalayerBuilder.buildLayer(item.layerType, config, null);
          if (item.text && item.layer && item.layer.set) {
          	item.layer.set('origin_name', item.text);
		  }
          item.layerUid = layerUid;
          item.refreshrate = 180;  // default duration

          RefreshLayerManager.addLayer(item.refreshrate, item.layerUid, item.layer, null);
          Core.Ext.Map.addLayer(item.layer);
        } else {
          item.layer.setVisible(true);
        }
        // set layer enabled in room layer management map
				if (this.roomLayerMgmt && this.activeRoomId &&
					this.activeRoomId !== item.collabId)
				{
					var roomArr = this.roomLayerMgmt[this.activeRoomId];
					// selected collabroom does not exist
					if (roomArr.indexOf(item.collabId) === -1) {
						roomArr.push(item.collabId);
					}
				}
      } else {
        // item was just disabled
        if (item.layer) {
          // hide layer
          item.layer.setVisible(false);
        }

        // remove from layer map for active room
				if (this.roomLayerMgmt && this.activeRoomId &&
					this.activeRoomId !== item.collabId && !suppressAction)
				{
					var roomArr = this.roomLayerMgmt[this.activeRoomId];
					if (roomArr) {
						// check selected collabroom exists in map
						var roomIdx = roomArr.indexOf(item.collabId);
						if (roomIdx !== -1) {
							roomArr.splice(roomIdx, 1);
						}
					}
				}
      }
    };

		DatalayerModule.prototype.delselectIncidentRoomsMenuItems = function() {
			var menu = this.getIncidentRoomsMenu();
			if (menu) {
				for (var i = 0; i < menu.items.length; i++) {
					var item = menu.items.get(i);
					// ensure checkbox item type has setChecked method to disable any active layers
					if (item && item.setChecked) {
						item.setChecked(false, true);
						this.handleIncidentRoomSelect(item, true);
					}
				}
			}
		};

    DatalayerModule.prototype.setCollabroomLayersForCollabroom = function() {
			var collabId = this.activeRoomId;
    	// check if collabId exists in the collabroom layer management map
			if (collabId !== undefined && collabId !== null && collabId)
			{
				if (this.roomLayerMgmt && this.roomLayerMgmt[collabId]) {
					for (var i in this.roomLayerMgmt[collabId]) {
						var roomId = this.roomLayerMgmt[collabId][i];

						if (this.roomMenuMap && this.roomMenuMap[roomId])
						{
							var item = this.roomMenuMap[roomId];
							if (item) {
								item.setChecked(true);
							}
						}
					}
				}
			}
		};

	DatalayerModule.prototype.onCollabRoomOpen = function(evt, collabroom) {
		if (collabroom) {
			// deselect rooms
			// this.delselectIncidentRoomsMenuItems();

			if (this.roomMenuMap && !this.roomMenuMap[collabroom.collabRoomId]) {
				// create new menu item
				this.addIncidentRoomMenuItem(collabroom);
			}
		}
	};

	DatalayerModule.prototype.onCollabRoomActivate = function(evt, collabroom) {
		if (collabroom) {
			// deselect rooms
			this.delselectIncidentRoomsMenuItems();

			this.activeRoomId = collabroom;
			this.setCollabroomLayersForCollabroom();
			// Ext.Function.defer(this.setCollabroomLayersForCollabroom, 200, this, []);
		}
	};

	DatalayerModule.prototype.onCollabRoomClose = function(evt, collabroom) {
		// all collabrooms were closed
		if (collabroom && this.activeRoomId && this.activeRoomId === collabroom.collabRoomId) {
			this.delselectIncidentRoomsMenuItems();
			this.activeRoomId = null;
		}
	};

	DatalayerModule.prototype.onLoadCollabRooms = function(evt, response) {
      // deselect any items and remove all map layers
	  this.delselectIncidentRoomsMenuItems();

      // clear menu items
      this.clearIncidentRoomsMenuItems();
      // map layers enabled for each collabroom
      this.roomLayerMgmt = {};
      this.roomMenuMap = {};
      this.activeRoomId = 0;

      // map layers enabled for each collabroom
      this.roomLayerMgmt = {};
      this.roomMenuMap = {};
      this.activeRoomId = 0;

      var rooms = response.results;
      if (rooms.length > 0) {
        var menu = this.getIncidentRoomsMenu();
        if (menu) {
          Ext.iterate(rooms, function(val, idx) {
          	this.addIncidentRoomMenuItem(val);
          }, this);
        }
      }
    };

      DatalayerModule.prototype.showLegend = function(event, datalayer){
						
			var id = datalayer.data.datalayerid.replace(/-/g,'');
			
			if(!Ext.getCmp("legend" + id)){
		
				var fileExt = datalayer.data.legend.substr(datalayer.data.legend.length - 5);
		
				this.legendId = "legend" + id;

				if(fileExt.indexOf('.') != -1 || datalayer.data.legend.toLowerCase().indexOf('getlegend') != -1) {
					var legendCmp = Ext.create('Ext.Window',{
						title: datalayer.data.text + ' - ' + Core.Translate.i18nJSON('Legend'),
						items:[{
							xtype: 'image',
							src: datalayer.data.legend, 
							id: "legend" + id,
							listeners : {
                load : {
                   element : 'el',
                   fn : function(el){
                      Core.EventManager.fireEvent('nics.data.legend.update', [this.id, el.target.clientWidth, el.target.clientHeight]);
                    }
                }
              }
            }]
					});
					
					legendCmp.show();
				}
				else{
				
					var requestUrl = window.location.protocol + '//' + window.location.host + '/nics/proxy?url=' + datalayer.data.legend;
					
					$.ajax({
						url: requestUrl,
						headers: {'Content-Type':'text/html'},
						legendId: "legend" + id,
						legendName: datalayer.data.text,
						success: function(data, status, response){
							Core.EventManager.fireEvent('nics.data.legend.ajax',[this.legendId,this.legendName,data]);
						},
						error: function(param1, status, error) {
							Ext.MessageBox.alert( Core.Translate.i18nJSON("Legend"), Core.Translate.i18nJSON("Failed to retrieve legend."));
						}
					});
				
				}
				
			}
			
		};
		
		DatalayerModule.prototype.updateLegend = function(event, info){
			
			var image = Ext.getCmp(info[0]);
			if(image){
				image.setSize(info[1],info[2]);
			}
			
		};
		
		DatalayerModule.prototype.getHtml = function(event, info){
		
			if(info){
	
				var regex = /<img.*?src=['"](.*?)['"]/;
				
				var htmlSrc = regex.exec(info[2]);
				var legendCmp;
	
				if(htmlSrc && htmlSrc[1]){

					legendCmp = Ext.create('Ext.Window',{
						title: info[1] + ' - Legend',
						items:[{
							xtype: 'image',
							src: htmlSrc[1], 
							id: info[0],
							listeners : {
					            load : {
					               element : 'el',
					               fn : function(el){
				               			Core.EventManager.fireEvent('nics.data.legend.update' ,[this.id, el.target.clientWidth, el.target.clientHeight]);
				               		}
					            }
				        	}
				        }]
					});
					
				}
				else{
					
					legendCmp = Ext.create('Ext.Window',{
						title: info[1] + ' - Legend',
						id: info[0],
						html: info[2],
						listeners : {
				            load : {
				               element : 'el',
				               fn : function(el){
			               			Core.EventManager.fireEvent('nics.data.legend.update' ,[this.id, el.target.clientWidth, el.target.clientHeight]);
			               		}
				            }
			        	}
						
					});
					
				}
	
				legendCmp.show();
	
			}
			else{
				Ext.MessageBox.alert("Legend", "Unable to load legend");
			}
	
		};

		DatalayerModule.prototype.onJoinIncident = function(evt, incident) {
			if (incident)
			{
				this.incident = incident;
			}
		};
		
		DatalayerModule.prototype.removeRestrictedLayers = function(evt) {
			var layers = Core.Ext.Map.getMap().getLayers().getArray().slice();
			Ext.Array.forEach(layers, function(layer){
				if(layer.get("dataTree")){
					Core.Ext.Map.removeLayer(layer);
				}
			});
		};

		
		return new DatalayerModule();
	}
);
	
