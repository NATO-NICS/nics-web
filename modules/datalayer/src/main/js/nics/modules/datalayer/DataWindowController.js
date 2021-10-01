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
define(['ext', 'iweb/CoreModule', 'nics/modules/UserProfileModule',
				'./WindowController', './ImportWindow', './DatasourceImportPanel',
				'./FileImportPanel', './ShapeFileImportPanel', './ImageImportPanel',
				'./WFSCapabilities', './WMSCapabilities',
				'./ArcGISCapabilities','./BreadcrumbImportPanel','./GeotiffImportPanel',
        './GeorssImportPanel', './ArcGISDatasourceImportPanel'],

	function(Ext, Core, UserProfile,
			WindowController, ImportWindow, DatasourceImportPanel,
			FileImportPanel, ShapeFileImportPanel, ImageImportPanel,
			WFSCapabilities, WMSCapabilities, ArcGISCapabilities,
			BreadcrumbImportPanel, GeotiffImportPanel, GeorssImportPanel, ArcGISDatasourceImportPanel){
	
		return Ext.define('modules.datalayer.DataWindowController', {
			extend : 'modules.datalayer.WindowController',
			
			alias: 'controller.datalayer.datawindowcontroller',

			init: function() {
				this.callParent();
				Core.EventManager.addListener(UserProfile.PROFILE_LOADED, this.onUserProfileLoad.bind(this));
				Core.EventManager.addListener("nics.incident.join", this.onJoinIncident.bind(this));
				Core.EventManager.addListener("nics.incident.close", this.removeIncidentFolder.bind(this));
			},

			removeIncidentFolder: function(){
				if(this.incidentFolderId){
					this.onDeleteFolder(null, this.incidentFolderId);
				}
			},

			onJoinIncident: function(e, incident) {
				this.removeIncidentFolder();
				var topic = Core.Util.generateUUID();
				Core.EventManager.createCallbackHandler(topic, this, this.onIncidentFolder);

				var url = Ext.String.format('{0}/incidents/{1}/folder/{2}',
					Core.Config.getProperty(UserProfile.REST_ENDPOINT),
					UserProfile.getWorkspaceId(), incident.id);
					this.mediator.sendRequestMessage(url, topic);

			},

			onIncidentFolder: function(evt, response){
				if(response.incidentFolder){
					this.incidentFolderId = response.incidentFolder.folderid;
					this.onNewFolder(evt, response.incidentFolder);
				}else{
					this.incidentFolderId = null;
				}
			},

			onImportClick: function() {
				if (!this.importWindow) {
					this.importWindow = this.createImportWindow();
				}
				this.importWindow.show();
			},

			onUserProfileLoad: function() {
				this.importWindow = this.createImportWindow();
				this.importWindow.hide();
			},
			
			createImportWindow: function() {
				var win = new ImportWindow();
				var tabPanel = win.getTabPanel();
				
				var kmlUrl = Ext.String.format("{0}/datalayer/{1}/sources/{2}/document/{3}",
						Core.Config.getProperty(UserProfile.REST_ENDPOINT),
						UserProfile.getWorkspaceId(),
						'kml',
						UserProfile.getUserOrgId());

				var kmzUrl = Ext.String.format("{0}/datalayer/{1}/sources/{2}/document/{3}",
						Core.Config.getProperty(UserProfile.REST_ENDPOINT),
						UserProfile.getWorkspaceId(),
						'kmz',
						UserProfile.getUserOrgId());
						
				var gpxUrl = Ext.String.format("{0}/datalayer/{1}/sources/{2}/document/{3}",
						Core.Config.getProperty(UserProfile.REST_ENDPOINT),
						UserProfile.getWorkspaceId(),
						'gpx',
						UserProfile.getUserOrgId());
						
				var jsonUrl = Ext.String.format("{0}/datalayer/{1}/sources/{2}/document/{3}",
						Core.Config.getProperty(UserProfile.REST_ENDPOINT),
						UserProfile.getWorkspaceId(),
						'geojson',
						UserProfile.getUserOrgId());

				var georssUrl = Ext.String.format("{0}/datalayer/{1}/sources/{2}/georss/{3}/{4}",
					Core.Config.getProperty(UserProfile.REST_ENDPOINT),
					UserProfile.getWorkspaceId(),
					'georss',
					UserProfile.getUserOrgId(),
          			UserProfile.getUserSessionId());
				
				tabPanel.add([
					new DatasourceImportPanel({
						title: 'WFS',
						dataSourceType: 'wfs',
						capabilitiesFormat: new WFSCapabilities(),
						workspaceId: this.workspaceId
					}),
					new DatasourceImportPanel({
						title: 'WMS',
						dataSourceType: 'wms',
						capabilitiesFormat: new WMSCapabilities(),
						workspaceId: this.workspaceId
					}),
					new ArcGISDatasourceImportPanel({
						title: 'ArcGIS',
						dataSourceType: 'arcgisrest',
						capabilitiesFormat: new ArcGISCapabilities(),
						workspaceId: this.workspaceId
					}),
					new FileImportPanel({
						title: 'KMZ',
						dataSourceType: 'kmz',
						workspaceId: this.workspaceId,
						url: kmzUrl
					}),
					new FileImportPanel({
						title: 'KML',
						dataSourceType: 'kml',
						workspaceId: this.workspaceId,
						url: kmlUrl
					}),
					new FileImportPanel({
						title: 'GPX',
						dataSourceType: 'gpx',
						workspaceId: this.workspaceId,
						url: gpxUrl
					}),
					new FileImportPanel({
						title: 'GeoJSON',
						dataSourceType: 'geojson',
						workspaceId: this.workspaceId,
						url: jsonUrl
					}),
					new ShapeFileImportPanel({
						title:  Core.Translate.i18nJSON('Shape File'),
						workspaceId: this.workspaceId
					}),
					new ImageImportPanel({
						title:  Core.Translate.i18nJSON('Image'),
						workspaceId: UserProfile.getWorkspaceId()
					}),
					new BreadcrumbImportPanel({
						title:  Core.Translate.i18nJSON('Breadcrumb'),
						workspaceId: UserProfile.getWorkspaceId()
					}),
					new GeotiffImportPanel({
              			title:  Core.Translate.i18nJSON('GeoTIFF'),
              			workspaceId: UserProfile.getWorkspaceId()
          }),
					new GeorssImportPanel({
						title:  Core.Translate.i18nJSON('GeoRSS'),
            			dataSourceType: 'georss',
            			workspaceId: this.workspaceId,
            			url: georssUrl
					})
				]);
				tabPanel.setActiveTab(0);
				return win;
			}
		});
});
