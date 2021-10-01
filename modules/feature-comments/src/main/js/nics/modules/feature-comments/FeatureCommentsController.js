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
define(
[ 'ext', 'iweb/CoreModule', "./FeatureCommentsModel",
		'nics/modules/UserProfileModule' ],
function(Ext, Core, FeatureCommentsModel, UserProfile) {

	return Ext
		.define(
				'modules.feature-comments.FeatureCommentsController',
				{
					extend : 'Ext.app.ViewController',

					alias : 'controller.commentscontroller',

					currentFeatureId : -1,
					
					currentRoomDisabled : false,

					panelShowing: false,

					// List of features that have been
					// highlighted/subscribed to in this incident
					topicSubscription : {},

					init : function(featureId) {
						this.mediator = Core.Mediator.getInstance();

						this.grid = this.lookupReference('featureCommentsGrid');

						Core.EventManager.addListener("nics.feature.comments", this.onLoadComments.bind(this));
						Core.EventManager.addListener("nics.feature.display",this.updateFeatureCommentDisplay.bind(this));

						// Event thrown from handler in grid editor to indicate update has been made
						Core.EventManager.addListener("nics.feature.comment.update",this.updateComment.bind(this));

						// Reset everything on a new incident
						Core.EventManager.addListener("nics.incident.join",this.resetGrid.bind(this));
						Core.EventManager.addListener("nics.incident.close",this.resetGrid.bind(this));

						// Reset the filter on the grid for a new room
						Core.EventManager.addListener("nics.collabroom.activate",this.resetFilter.bind(this));
						Core.EventManager.addListener("nics.collabroom.close",this.resetFilter.bind(this));

						var panel = this.getView().up('panel');
						panel.on("show", this.panelShow, this);
						panel.on("hide", this.panelHide, this);
					},

					panelShow : function(e) {
						this.panelShowing = true;
						var last = this.lastSelected;
						if (last) {
							delete this.lastSelected;
							this.updateFeatureCommentDisplay(null, last);
						}
					},

					panelHide : function(e) {
						this.panelShowing = false;
					},

					resetGrid : function(e, incident) {
						// clear current data
						this.grid.store.clearFilter();
						this.grid.store.removeAll();
						this.lookupReference('createButton').disable();

						this.removeSubscriptions();
					},

					resetFilter : function(e, collabRoomId, readOnly, collabRoomName, collabRoom) {
						this.grid.store.clearFilter();
						
						// no features selected, no features displayed
						this.grid.store.filter("featureCommentId", -1); 
						this.lookupReference('createButton').disable();
						
						if(readOnly){
							this.currentRoomDisabled = true;
							this.lookupReference('deleteButton').disable();
						}else{
							this.currentRoomDisabled = false;
							this.lookupReference('deleteButton').enable();
						}
					},

					// on feature selected
					updateFeatureCommentDisplay : function(e, feature) {
						//skip updating the panel if it is hidden
						if (!this.panelShowing) {
							this.lastSelected = feature;
							return;
						}

						// lowercase featureid for room overlays
						this.currentFeatureId = feature.get('featureId') || feature.get('featureid');
						if (!this.currentFeatureId) {
							return;
						}

						if(!this.currentRoomDisabled){
							this.lookupReference('createButton').enable();
						}

						if (!this.topicSubscription[this.currentFeatureId]) {
							this.addSubscription();
						}

						// request comments for this feature
						var url = Ext.String.format(
										"{0}/features/comment/{1}",
										Core.Config.getProperty(UserProfile.REST_ENDPOINT),
										this.currentFeatureId);

						// Load feature comments
						this.mediator.sendRequestMessage(url, "nics.feature.comments");

						this.filter(this.currentFeatureId);
						
						this.updateCommentPanel(this.currentFeatureId);

					},

					filter : function(featureId) {
						this.grid.store.clearFilter();
						this.grid.store.filter('featureId',featureId);
					},

					onLoadComments : function(e, response) {
						// load store with all comments for this
						// feature
						if (response.featureComments&& response.featureComments.length > 0) {
							this.grid.store.loadRawData(response.featureComments);
						}
					},

					onNewComment : function(event, comment) {
						if (comment != null) {
							this.grid.store.loadRawData(comment,true);
						}
					},

					onUpdateComment : function(event, comment) {
						var index = this.grid.store.findExact("featureCommentId", comment.featureCommentId);
						if (index > -1) {
							var rec = this.grid.store.getAt(index);
							if (rec) {
								rec.set(comment);
								rec.commit();
							}
						}
					},

					onDeleteComment : function(event, comment) {
						var index = this.grid.store.findExact("featureCommentId", comment.featureCommentId);
						if (index > -1) {
							this.grid.store.removeAt(index);
						}
					},

					onEditRow : function(grid, record, element, rowIndex, e, eOpts) {
						var editor = this.grid.getPlugin('commentRowEditing');
						editor.startEdit(rowIndex, 2); // look up column!?
					},

					// Subscribe to all feature updates
					addSubscription : function() {
						var onNewComment = this.onNewComment.bind(this);
						var onUpdateComment = this.onUpdateComment.bind(this);
						var onDeleteComment = this.onDeleteComment.bind(this);

						this.topicSubscription[this.currentFeatureId] = {
							onNewComment : onNewComment,
							onUpdateComment : onUpdateComment,
							onDeleteComment : onDeleteComment
						};

						// Feature endpoint notifies users using the
						// following topics
						var newTopic = Ext.String.format("iweb.NICS.feature.comment.new.{0}",this.currentFeatureId);
						this.mediator.subscribe(newTopic);
						Core.EventManager.addListener(newTopic,onNewComment);

						var updateTopic = Ext.String.format("iweb.NICS.feature.comment.update.{0}",this.currentFeatureId);
						this.mediator.subscribe(updateTopic);
						Core.EventManager.addListener(updateTopic,onUpdateComment);

						var deleteTopic = Ext.String.format("iweb.NICS.feature.comment.delete.{0}",this.currentFeatureId);
						this.mediator.subscribe(deleteTopic);
						Core.EventManager.addListener(deleteTopic, onDeleteComment);
					},

					// Remove all feature subscriptions
					removeSubscriptions : function() {
						for (var featureId in this.topicSubscription) {
							var newTopic = Ext.String
									.format(
											"iweb.NICS.feature.comment.new.{0}",
											featureId);
							var updateTopic = Ext.String
									.format(
											"iweb.NICS.feature.comment.update.{0}",
											featureId);
							var deleteTopic = Ext.String
									.format(
											"iweb.NICS.feature.comment.delete.{0}",
											featureId);

							Core.EventManager
									.removeListener(
											newTopic,
											this.topicSubscription[featureId].onNewComment);
							Core.EventManager
									.removeListener(
											updateTopic,
											this.topicSubscription[featureId].onUpdateComment);
							Core.EventManager
									.removeListener(
											deleteTopic,
											this.topicSubscription[featureId].onDeleteComment);

							this.mediator.unsubscribe(newTopic);
							this.mediator.unsubscribe(updateTopic);
							this.mediator.unsubscribe(deleteTopic);
						}
						this.topicSubscription = {};
					},
					
					updateCommentPanel : function(featureId){
						var panel = this.lookupReference('featureCommentFormPanel');
						var form = panel.lookupReference('featureCommentForm');
						form.reset();

						var initialData = {
							datetime : new Date(),
							username : UserProfile.getUsername(),
							featureId : featureId
						};
						form.getViewModel().set(initialData);
						
						return panel;
					},

					addComment : function(eOpts) {
						var panel = this.updateCommentPanel(this.currentFeatureId);

						panel.show();
					},

					deleteComment : function() {
						var selected = this.lookupReference('featureCommentsGrid').getSelectionModel().getSelection();
						
						for (var i = 0; i < selected.length; i++) {
							var topic = Ext.String.format("nics.feature.comment.delete.{0}",
									selected[i].data.featureCommentId);
							Core.EventManager
									.createCallbackHandler(
											topic,
											this,
											function(evt, response) {
												if (response.message != "OK") {
													Ext.MessageBox
															.alert(
																	Core.Translate.i18nJSON("Feature Comment Error"),
																	Core.Translate.i18nJSON("There was an error deleting the feature comment"));
												}
											});
							
							var url = Ext.String
									.format(
											'{0}/features/comment/{1}/{2}',
											Core.Config.getProperty(UserProfile.REST_ENDPOINT),
											selected[i].data.featureId,
											selected[i].data.featureCommentId);
							this.mediator.sendDeleteMessage(url, topic);
						}
					},

					updateComment : function(event, context) {

						var topic = "nics.feature.comment.update";

						var url = Ext.String.format(
										'{0}/features/comment/update',
										Core.Config.getProperty(UserProfile.REST_ENDPOINT));

						var comment = context.newValues;
						comment.username = UserProfile.getUsername();
						comment.featureCommentId = context.record.data.featureCommentId;
						comment.featureId = context.record.data.featureId;

						this.mediator.sendPostMessage(url, topic, comment);
					},
					
					viewComment : function(){
						var selected = this.lookupReference('featureCommentsGrid').getSelectionModel().getSelection();
						if(selected.length > 0){
							//Display first comment
							Ext.MessageBox.alert(Core.Translate.i18nJSON("Feature Comment"), selected[0].data.comment);
						}
					}
				});
});
