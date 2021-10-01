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
define([
    "iweb/CoreModule",
	"./collabroom/CollabRoomViewer", "./collabroom/CollabRoomController",
	"./collabroom/CollabRoomTabView", "./collabroom/CollabRoomDatalayerView"], 
	
	function(Core, CollabRoomViewer, CollabRoomController, CollabRoomTabView, CollabRoomDatalayerView) {
	
		var CollabRoomModule = function(){};
		
		CollabRoomModule.prototype.load = function(roomPresets){
			
			var collabRoomViewer = new CollabRoomViewer({
				controller: new CollabRoomController({
					roomPresets: roomPresets
				})
			});
			Core.View.addToTitleBar([
			        collabRoomViewer, 
					{xtype: 'tbspacer', width: 15}
			]);
			CollabRoomModule.prototype.collabViewer = collabRoomViewer;
			
			var collabRoomTabView = new CollabRoomTabView();
			Core.View.addButtonPanel([
					collabRoomTabView
			]);
			
			var collabRoomDatalayerView = new CollabRoomDatalayerView();
			Core.View.addToSidePanel(collabRoomDatalayerView);
			collabRoomDatalayerView.show();

		};

		CollabRoomModule.prototype.getCollabroomViewer = function() {
			return CollabRoomModule.prototype.collabViewer;
		};

		CollabRoomModule.prototype.getDefaultRoomPresets = function(){
			return {
				'Operations': [
					Core.Translate.i18nJSON('OperationsSectionChief'),
					Core.Translate.i18nJSON('BranchDir1'),
					Core.Translate.i18nJSON('BranchDir2'),
					Core.Translate.i18nJSON('DivisionSupA'),
					Core.Translate.i18nJSON('DivisionSupB'),
					Core.Translate.i18nJSON('DivisionSupC'),
					Core.Translate.i18nJSON('DivisionSupD'),
					Core.Translate.i18nJSON('DivisionSupX'),
					Core.Translate.i18nJSON('DivisionSupY'),
					Core.Translate.i18nJSON('DivisionSupZ'),
					Core.Translate.i18nJSON('AirSupportGroupSup'),
					Core.Translate.i18nJSON('AirTacticalGroupSup'),
					Core.Translate.i18nJSON('StagingAreaManager'),
					Core.Translate.i18nJSON('AirOperationsBranchDir')
					],
				
					'Command Staff': [
					     Core.Translate.i18nJSON('IncidentCommander'),
						 Core.Translate.i18nJSON('PublicInformationOfficer'),
						 Core.Translate.i18nJSON('LiaisonOfficer'),
						 Core.Translate.i18nJSON('SafetyOfficer')
						],
						
					'Plans': [
					     Core.Translate.i18nJSON('PlanningSectionChief'),
						 Core.Translate.i18nJSON('ResourcesUnitLeader'),
						 Core.Translate.i18nJSON('SituationUnitLeader'),
						 Core.Translate.i18nJSON('FieldObserver'),
						 Core.Translate.i18nJSON('GISS')
						],
					
					'Logistics': [
						 Core.Translate.i18nJSON('LogisticsSectionChief'),
						 Core.Translate.i18nJSON('CommunicationsUnitLeader'),
						 Core.Translate.i18nJSON('SupplyUnitLeader'),
						 Core.Translate.i18nJSON('FacilitiesUnitLeader'),
						 Core.Translate.i18nJSON('GroundSupportUnitLeader')
						],
						
					'Finance': [
						 Core.Translate.i18nJSON('FinanceAdminSectionChief'),
						 Core.Translate.i18nJSON('CompensationAndClaimsUnitLeader'),
						 Core.Translate.i18nJSON('CostUnitLeader'),
						 Core.Translate.i18nJSON('EquipmentTimeRecorder')
						]	
			};
		};
		
		return new CollabRoomModule();
	}
);
	
