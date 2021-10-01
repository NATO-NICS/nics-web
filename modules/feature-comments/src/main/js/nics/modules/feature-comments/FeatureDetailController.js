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
define(["ext", "ol", "iweb/CoreModule"], function(Ext, ol, Core) {
  return Ext.define("modules.feature-comments.FeatureDetailController", {
    extend: "Ext.app.ViewController",

    alias: "controller.featuredetailcontroller",

    init: function(featureId) {

	  Core.EventManager.addListener("map-selection-change",
	  	this.mapSelectionChange.bind(this));

      var panel = this.getView();
	  panel.on("show", this.panelShow, this);
	  panel.on("hide", this.panelHide, this);
    },

	panelShow : function(e) {
		this.panelShowing = true;
		if (last) {
			var last = this.lastSelected;
			delete this.lastSelected;
			this.updateFeatureCommentDisplay(null, last);
		}
	},

	panelHide : function(e) {
		this.panelShowing = false;
	},

	setEditable: function(editable) {
    	this.lookupReference('editButton').setPressed(editable);
		this.lookupReference('saveButton').setDisabled(!editable);

		this.lookupReference('labelText').setDisabled(!editable);
		this.lookupReference('description').setDisabled(!editable);
		this.lookupReference('fillColorBox').setDisabled(!editable);
		this.lookupReference('strokeColorBox').setDisabled(!editable);
		this.lookupReference('opacitySlider').setDisabled(!editable);

		if (editable) {
			this.lookupReference('editForm').setHidden(false);
			this.lookupReference('hazardForm').setHidden(true);
			this.lookupReference('hazardButton').setPressed(false);

			this.modify = new ol.interaction.Modify({
				features: Core.Ext.Map.getSelectInteraction().getFeatures()
			});
			this.addInteraction(this.modify);
		} else if (this.modify) {
			this.removeInteraction(this.modify);
		}
	},

	onToggleHazardButton: function(btn, pressed){
	  if(pressed){
	  	this.lookupReference('editForm').setHidden(true);
	  	this.lookupReference('hazardForm').setHidden(false);
	    this.lookupReference('editButton').setPressed(!pressed);
	  }

	  this.lookupReference('hazardButton').setPressed(pressed);
	  this.lookupReference('hazardForm').setDisabled(!pressed);
	},

	mapSelectionChange: function(topic, selected) {
		if (select && selected.length === 1) {
			this.updateFeatureCommentDisplay(selected[0]);
		} else {
			this.removeSelectedFeature();
		}
		this.displayFeatureSelection(selected);
	},

	displayFeatureSelection: function(selected) {
		var box = this.lookupReference('htmlBox');
		if (selected && selected.length) {
			box.setHtml(selected.length + ' features selected');
		} else {
			box.setHtml('No features selected');
		}
	},

	  removeSelectedFeature: function(){
    	this.feature = null;
    	var editForm = this.lookupReference('editForm');

		if(editForm.enabled){
			this.setEditable(false);
		}else{
			this.onToggleHazardButton(null, false);
		}
		this.lookupReference('editButton').setDisabled(true);
		this.lookupReference('hazardButton').setDisabled(true);
	  },

	  updateFeatureCommentDisplay: function(feature) {
		//skip updating the panel if it is hidden
		if (!this.panelShowing) {
			this.lastSelected = feature;
			return;
		}

		// this callback fires during edit dragging, we don't want to interupt
		if (this.feature === feature) {
			return;
		}
		if (this.feature) {
			// always re-enable saving feature changes
			this.feature.persistChange = true;
		}
		this.feature = feature;

		var attrs = feature.get('attributes');
		if(!attrs){ attrs = {}; }
		if(attrs.description) {
			this.lookupReference('description').setValue(attrs.description);
		}

		// only available on label features
		var labelText = feature.get('labelText');
		/*this.lookupReference('labelText').setVisible(!!labelText);*/
		this.lookupReference('labelText').setValue(labelText);


		//only available on polygon features
		var fillColor = feature.get('fillColor');
		this.lookupReference('fillColorBox').setVisible(!!fillColor);
		this.lookupReference('fillColor').setColor(fillColor);

		var strokeColor = feature.get('strokeColor');
		this.lookupReference('strokeColorBox').setVisible(!!strokeColor);
		this.lookupReference('strokeColor').setColor(strokeColor);

		//if feature is one of our polygon types
		var featType = feature.get('type');
		if (featType === 'polygon' || featType === 'circle' || featType === 'triangle'
		 || featType === 'square' || featType === 'hexagon') {

			var opacityValue = feature.get('opacity');
			this.lookupReference('opacitySlider').setVisible(true);
			this.lookupReference('opacitySlider').setValue(opacityValue * 100);
		 } else {
			this.lookupReference('opacitySlider').setVisible(false);
		 }

		if(attrs && attrs.hazards){
			//Only handling one hazard at a time right now
			for(var pos in attrs.hazards){
				this.updateHazardDisplay(attrs.hazards[pos]);
			}
		}else{
			this.clearHazard();
		}

		this.setEditable(false);
		this.lookupReference('editButton').setDisabled(false);
		this.lookupReference('hazardButton').setDisabled(false);
	},

	updateHazardDisplay: function(hazard){
		this.lookupReference('hazardLabel').setValue(hazard.hazardLabel);
		this.lookupReference('hazardType').setValue(hazard.hazardType);
		this.lookupReference('radius').setValue(hazard.radius);
		this.lookupReference('metric').setValue(hazard.metric);
	},

	onToggleEditButton: function(btn, pressed) {
		this.setEditable(pressed);

		// temporarily disable saving feature changes, so every feature isn't saved
		if (this.feature) {
			this.feature.persistChange = !pressed;
		}
	},

	onSaveButton: function() {

		// apply changes to feature object
		var attrs = this.feature.get('attributes');
		if(!attrs){ attrs = {}; }

		attrs.description = this.lookupReference('description').getValue();
		this.feature.set('attributes', attrs);

		var labelText = this.lookupReference('labelText');
		if (labelText.getValue()) {
			this.feature.set('labelText', labelText.getValue());
		}

		var fillColorBox = this.lookupReference('fillColorBox');
		if (fillColorBox.isVisible()) {
			var fillColor = this.lookupReference('fillColor');
			this.feature.set('fillColor', fillColor.getColor());
		}

		var strokeColorBox = this.lookupReference('strokeColorBox');
		if (strokeColorBox.isVisible()) {
			var strokeColor = this.lookupReference('strokeColor');
			this.feature.set('strokeColor', strokeColor.getColor());
		}

		var opacitySlider = this.lookupReference('opacitySlider');
		if (opacitySlider.isVisible()) {
			this.feature.set('opacity', opacitySlider.getValue() / 100);
		}

		// re-enable saving changes and fire change event
		this.feature.persistChange = true;
		this.feature.notify();

		this.setEditable(false);
	},

	onSaveHazardButton: function() {
		  var hazard = {};
		  hazard.hazardLabel = this.lookupReference('hazardLabel').getValue();
		  hazard.hazardType = this.lookupReference('hazardType').getValue();
		  hazard.radius = this.lookupReference('radius').getValue();
		  hazard.metric = this.lookupReference('metric').getValue();

		  // apply changes to feature object
		  var attrs = this.feature.get('attributes');
		  if(!attrs){ attrs = {}; }
		  attrs.hazards = [hazard];
		  this.feature.set('attributes', attrs);

		  // re-enable saving changes and fire change event
		  this.feature.persistChange = true;
		  this.feature.notify();

		  this.onToggleHazardButton(null,false);
	},

	clearHazard: function(){
		this.lookupReference('hazardLabel').setValue("");
		this.lookupReference('hazardType').setValue("");
		this.lookupReference('radius').setValue(null);
		this.lookupReference('metric').clearValue();
		this.lookupReference('hazardSaveButton').setDisabled(true);
	},

	onRemoveHazardButton: function() {
	    this.clearHazard();

	    // apply changes to feature object
	    var attrs = this.feature.get('attributes');
	    if(attrs) {
			delete attrs.hazards;
			this.feature.set('attributes', attrs);
		}

		// re-enable saving changes and fire change event
		this.feature.persistChange = true;
		this.feature.notify();

		this.onToggleHazardButton(null,false);
	},

	addInteraction: function(interaction) {
		var interactions = Core.Ext.Map.getInteractions().concat([interaction]);
		Core.Ext.Map.setInteractions(interactions);
	},
	removeInteraction: function(interaction) {
		var interactions = Core.Ext.Map.getInteractions();
		var idx = interactions.indexOf(interaction);
		if (idx > -1) {
			interactions.splice(idx, 1);
			Core.Ext.Map.setInteractions(interactions);
		}
	}
  });
});
