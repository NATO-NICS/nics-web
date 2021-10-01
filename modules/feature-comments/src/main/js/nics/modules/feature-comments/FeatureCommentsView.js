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
define([ 'iweb/CoreModule', './FeatureCommentsController',
		'nics/modules/UserProfileModule', './FeatureCommentForm',
		'./FeatureCommentsModel' ], function(Core, FeatureCommentsController,
		UserProfile, FeatureCommentForm) {

	return Ext.define('modules.feature-comments.FeatureCommentsView', {
		extend : 'Ext.Panel',

		xtype: 'featureComments',
		controller : 'commentscontroller',

		closable : false,

		closeAction : 'hide',

		autoScroll : true,

		reference : 'commentsView',

		config : {
			autoWidth : true,
			autoHeight : true,
			layout : {
				type : 'vbox',
				align : 'stretch'
			},
			title : Core.Translate.i18nJSON('Feature Comments')
		},
		dockedItems : [ {
			xtype : 'toolbar',
			dock : 'top',
			layout : {
				pack : 'start'
			},
			items : [ {
				xtype : 'button',
				text : Core.Translate.i18nJSON('New'),
				hidden : false,
				disabled : true,
				reference : 'createButton',
				handler : 'addComment'

			}, {
				xtype : 'button',
				text : Core.Translate.i18nJSON('View'),
				hidden : false,
				reference : 'viewButton',
				handler : 'viewComment'

			}, {
				xtype : 'button',
				text : Core.Translate.i18nJSON('Delete'),
				hidden : false,
				reference : 'deleteButton',
				handler : 'deleteComment'

			} ]
		} ],
		initComponent : function() {
			this.callParent();

			// Grid
			this.add({
				xtype : 'grid',
				multiSelect : true,
				selModel : 'rowmodel',
				reference : 'featureCommentsGrid',
				region : 'north',
				height : 250,
				store : {
					model : 'modules.feature-comments.FeatureCommentsModel',
					sorters: [{
						property: 'datetime',
						direction: 'DESC'
					}]
				},
				columns : [ {
					text : Core.Translate.i18nJSON('Created'),
					dataIndex : 'datetime',
					xtype : 'datecolumn',
					format : 'Y-m-d H:i:s'
				}, {
					text : Core.Translate.i18nJSON('User'),
					dataIndex : 'username',
					vtype : 'extendedalphanum'
				}, {
					text : Core.Translate.i18nJSON('Comments'),
					dataIndex : 'comment',
					vtype : 'extendedalphanum',
					flex : 1,
					editor : 'textfield'
				} ],
				plugins : [ {
					ptype : 'rowediting',
					pluginId : 'commentRowEditing',
					clicksToEdit : 2,
					cancelBtnText : Core.Translate.i18nJSON('Cancel'),
					saveBtnText : Core.Translate.i18nJSON('Update'),
					errorsText : Core.Translate.i18nJSON('Errors'),
					listeners : {
						beforeedit: function(editor, context) {
							if (editor.grid.findParentByType('featureComments')
								.lookupReference("createButton").disabled) {
								return false;
							}
							return true;
						},
						validateedit : function(editor, context) {
							Core.EventManager.fireEvent(
								'nics.feature.comment.update', context);
						}
					}
				} ]

			});

			// Form
			this.add(new FeatureCommentForm());

		}
	});
});
