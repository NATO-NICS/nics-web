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
require(["iweb/CoreModule","iweb/modules/MapModule", "iweb/modules/LoggerModule", "nics/modules/LoginModule", "nics/modules/UserProfileModule", "iweb/modules/core-view/View"],

    function(Core, MapModule, Logger, LoginModule, UserProfile, View) {



        Ext.onReady(function() {

	        Ext.QuickTips.init();

	        //Listen for the Config to be loaded (Config.js)
            Core.EventManager.addListener("iweb.config.loaded", initUserProfile);

	         //Instantiate the View
	        var view = new View();
	        view.init();

	        //Config is initialized
	        Core.init(view);
	        Core.View.showDisconnect(true);

	        // Load the logger
	        Logger.load();

	        //Show the Toolbar - Required for drawing menu
	        Core.View.showToolbar(true);

	        MapModule.load();

	        function initUserProfile() {

	        	//Load the Translation registry
	        	//The default Translation will be set if indicated in the registry
	        	//If no default translation is configured, the browser language will be set
	        	Core.Translate.init(Ext.String.format('{0}/translation',
                    Core.Config.getProperty(UserProfile.REST_ENDPOINT)));

	        	//Wait until the org capabilities have been loaded before the setting the translations
	        	Core.EventManager.addListener("iweb.orgcaps.loaded", loadTranslations);

	        	//After the user user properties have been loaded (username, sessionid) load the login module
	        	Core.EventManager.addListener(UserProfile.PROPERTIES_LOADED, LoginModule.load);

	        	//Listen for the User Profile (UserProfile.js) to be loaded
                //The profile is loaded after the LoginModule is loaded
                Core.EventManager.addListener("nics.translation.loaded", loadModules);

	    		UserProfile.init();
	        };

	        function loadTranslations(evt, data) {
	        	var language = UserProfile.getDefaultLanguage();
                if(language) {
                    Core.Translate.setSystemLanguage(language);
                }else{
                    Core.Translate.setDefaultLanguage();
                }
	        };

            //Load each module
	        function loadModules(data) {

                //TODO: I don't think this is working
                Core.EventManager.removeListener("nics.translation.loaded", loadModules);

	        	require(["iweb/modules/DrawMenuModule", "iweb/modules/GeocodeModule",
				    "nics/modules/CollabRoomModule", "nics/modules/IncidentModule",
				    "nics/modules/WhiteboardModule",
                    "nics/modules/DatalayerModule", "nics/modules/ActiveUsersModule",
                    "nics/modules/FeaturePersistence", "nics/modules/AdministrationModule",
                    "nics/modules/PhotosModule", "nics/modules/PrintModule" ,
                    "nics/modules/AccountInfoModule", "nics/modules/MultiIncidentViewModule",
				    "nics/modules/FeedbackReportModule", "nics/modules/MapSyncLocation",
				    "nics/modules/BroadcastModule", "nics/modules/FeatureCommentsModule","nics/modules/UserModule",
				    "nics/modules/ReportModule", "nics/modules/OrgDocumentsModule", "nics/modules/StreamingModule",
                    "nics/modules/Survey"],


				    function(DrawMenuModule, GeocodeModule,
				        CollabRoomModule, IncidentModule,
				        WhiteboardModule, DatalayerModule,
				        ActiveUsersModule, FeaturePersistence, AdminModule,
				        PhotosModule, PrintModule, AccountModule, MultiIncidentModule,
				        FeedbackReportModule, MapSyncLocation, BroadcastModule,
                        FeatureCommentsModule, UserModule, ReportModule, OrgDocumentsModule,
                        StreamingModule, SurveyModule) {

                        //Load Modules
                        ReportModule.load();
                        WhiteboardModule.load();
                        IncidentModule.load();
                        CollabRoomModule.load(/*CollabRoomModule.getDefaultRoomPresets()*/);
                        DrawMenuModule.load();
                        GeocodeModule.load();
                        AccountModule.load();
                        DatalayerModule.load();
                        OrgDocumentsModule.load();

                        //Add Tools Menu after Datalayer Module
                        var button = Core.UIBuilder.buildDropdownMenu(Core.Translate.i18nJSON("Tools"));
                        //Add View to Core
                        Core.View.addButtonPanel(button);

                        //Set the Tools Menu on the Core for others to add to
                        Core.Ext.ToolsMenu = button.menu;

                        PrintModule.load();

                        //Add Export to Tools Menu
                        DatalayerModule.addExport();
                        DatalayerModule.addIncidentRooms();

                        PhotosModule.load();
                        FeaturePersistence.load();
                        AdminModule.load();

                        ActiveUsersModule.load();
                        MultiIncidentModule.load();
                        StreamingModule.load();
                        SurveyModule.load();

                        // Add email report to Tools Menu
                        FeedbackReportModule.load();

                        MapSyncLocation.load();
                        LoginModule.addHelp();
                        LoginModule.addLogout();
                        BroadcastModule.load();
                        FeatureCommentsModule.load();
                        UserModule.load();

                        Core.EventManager.fireEvent(UserProfile.PROFILE_LOADED, [UserProfile]);
                    });
	        }

	        //Mediator
	        /** default topics
	         ** callback
	         */
	        Core.Mediator.initialize();
        });
    });
