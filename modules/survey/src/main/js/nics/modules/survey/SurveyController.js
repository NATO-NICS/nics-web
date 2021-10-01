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
define(['ext', 'ol', 'iweb/CoreModule', 'nics/modules/UserProfileModule', 'iweb/modules/MapModule', 'survey-knockout'], function(
        Ext, ol, Core, UserProfile, Map, Survey) {
  'use strict';
  
  return Ext.define('survey.SurveyController', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.surveycontroller',

    currentSurvey: null,
    currentSurveyId: null,

    surveyBeingEdited: null,

    /**
        Handle any necessary initialization. Calls bindEvents

        @function init
     */
    init: function() {

        Survey.StylesManager.applyTheme("winter");

        // Configure Survey options
        Survey.surveyStrings.savingData = "Please wait. We are validating and saving your responses";
        Survey.surveyStrings.savingDataError = "Error saving your report";
        Survey.surveyStrings.savingDataSuccess = "Thank you for submitting the report!";
        Survey.surveyStrings.saveAgainButton = "Try saving again";

        // TODO: shouldn't just load on init, probably slowing down initial loading of NICS,
        // TODO: should defer to when the Surveys tab is clicked with maybe a loading spinner
        // TODO: until the dropdown is populated
        this.loadSurveys();

        this.bindEvents();
    },


    /**
        Add any event listeners here

        @function bindEvents
     */
    bindEvents: function() {
        // TODO: listen for events, like ensuring a config event to trigger loading of survey metadata
        // TODO: bind on maybe tab drawn or something to wait until the survey views are SEEN before
        // TODO: fetching surveys
    },

    /**
        Calls doGetSurveys to load all survey metadata into the survey store

        @function loadSurveys

        @see doGetSurveys
     */
    loadSurveys: function() {
        this.doGetSurveys(true, this.loadSurveyStoreFromResponse);
    },

    /**
        Handler for the Survey combo box onSelect event. The full selected survey data is fetched from
        the API. The resulting data is sent to the loadCurrentSurveyFromResponse function to be handled.

        @function onSurveySelect

        @param {Object} evt - the event/component that fired the event
        @param {Object} payload - the data payload sent by the event
        @param {Object} payload.data - The surveyid and title of the selected survey
     */
    onSurveySelect: function(evt, payload) {
        var data = payload.data;

        try {
            this.doGetSurvey(data.surveyid, this.loadCurrentSurveyFromResponse);
        } catch(e) {
            // TODO: changed from data.surveyid to data.title... ensure it's there
            console.error("Error getting Survey: ", data.title, e);
        }
    },

    /**
        Handler for the Edit Survey combo box onSelect event. The full selected survey data is fetched from
        the API. The resulting data is sent to the loadSurveyToEditFromResponse to be handled.

        @function onSurveyEditSelect

        @param {Object} evt - the event/component that fired the event
        @param {Object} payload - the data payload sent by the event
        @param {Object} payload.data - The surveyid and title of the selected survey
     */
    onSurveyEditSelect: function(evt, payload) {
        var data = payload.data;

        try {
            this.doGetSurvey(data.surveyid, this.loadSurveyToEditFromResponse);
        } catch(e) {
            console.error("Error getting Survey for editing", e);
        }
    },

    /**
        Utility method for decoding a jsonString into a json object

        @function decode

        @param {string} jsonString - a json string

        @return {Object} - a JSON object initialized from the jsonString if successful, null otherwise
     */
    decode: function(jsonString) {
        var json;
        try {
            json = Ext.JSON.decode(jsonString);
        } catch(e) {
            json = null;
        }

        return json;
    },

    /**
        Utility method for building error messages from AJAX request responses

        @function buildErrorMessage

        @param {Object} response - a response object returned by the AJAX call

        @return {string} - An appropriate message based on error, message, and status code
                           contained in the response object
     */
    buildErrorMessage: function(response) {
        if(!response || response === null || response === "") {
            return "Undefined response";
        }

        // TODO: handle custom case for when status===0 and timedout===true

        var status = response.status;
        var respObj = this.decode(response.responseText);
        var message = "";

        if(respObj && respObj !== null) {

            if(respObj.message) {
                message = Ext.String.format("{0} {1}", message, respObj.message);
            }

            if(respObj.error) {
                message = Ext.String.format("{0} {1}", message, respObj.error);
            }

            message = Ext.String.format("{0} ({1})", message, status);
        } else {

            try {
                throw new Error("ERROR");
            } catch(e) {
                console.error("Catching exception to debug comm failure below");
            }

            if(response.statusText) {
                message = Ext.String.format("Problem with response from server: {0} (status: {1})",
                    response.statusText, status);
            } else {
                message = Ext.String.format("Unknown response from server with status {0}", status);
            }
        }

        return message;
    },

    /**
        Fetches the survey specified by the surveyId, and sends the response from the API to the
        provided callback function

        @function doGetSurvey

        @param {string} surveyId - the ID of the survey to be fetched
        @param {Function} callback - the callback function to send the response from the API to

    */
    doGetSurvey: function(surveyId, callback) {

        // TODO: first check surveyStore to see if it has been previously loaded

        if(!surveyId) {
            console.error("Invalid surveyId: ", surveyId);
            Ext.Msg.alert("Survey Error", "Error loading Survey. See logs for more details.");
            return;
        }

        var url = Ext.String.format('{0}/survey/{1}',
                      Core.Config.getProperty('endpoint.rest'), surveyId);

        Ext.Ajax.request({
          url: url,
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          scope: this,
          success: function(resp) {
            var respObj;
            if(resp && resp.status === 200) {
                respObj = this.decode(resp.responseText);
            } else {
                Ext.Msg.alert("Survey Error", this.buildErrorMessage(resp));
                return;
            }

            if(resp.status === 200 && respObj !== null && respObj.success === true) {
                callback.call(this, respObj);
            } else {
                Ext.Msg.alert("Survey Error", this.buildErrorMessage(resp));
            }

          },
          failure: function(res) {
            if(res && res.timedout && res.timedout === true) {
                Ext.Msg.alert("Survey Error", "Server timed out fetching survey. Try re-selecting the survey.");
                return; // TODO: fire event for re-querying?
            }

            Ext.Msg.alert("Survey Error", this.buildErrorMessage(res));
          }
        });

    },

    /**
        Handler for fetching a survey. Takes the response, and loads it in as the current
        active survey.

        @function loadCurrentSurveyFromResponse

        @param {Object} surveyResponse - the response object from the AJAX call to the API

        @throws Error when there are no surveys returned, or if the response is invalid
     */
    loadCurrentSurveyFromResponse: function(surveyResponse) {
        if(!surveyResponse || surveyResponse === null) {
            Ext.Msg.alert("Survey Error", "Received empty Survey response. Can't load survey.");
            return;
        }

        var survey;
        if(surveyResponse && surveyResponse.success === true) {
            if(surveyResponse.surveys && surveyResponse.surveys[0]) {
                survey = surveyResponse.surveys[0];
                // TODO: validate survey enough to know it has the expected format
                if(!survey.survey) {
                    throw Error("Invalid survey content");
                }

                var selectedSurvey = new Survey.Model(survey.survey, 'surveyDiv');
                this.setCurrentSurvey(survey.surveyid, selectedSurvey);
            } else {
                throw Error("Unable to retrieve survey");
            }
        }
    },

    /**
        Handler for fetching a survey to edit. Takes the response, and loads it in as the current
        active survey being edited.

        @function loadSurveyToEditFromResponse

        @param {Object} surveyResponse - the response object from the AJAX call to the API

        @throws Error when there are no surveys returned, or if the response is invalid
     */
    loadSurveyToEditFromResponse: function(surveyResponse) {
        if(!surveyResponse || surveyResponse === null) {
            Ext.Msg.alert("Survey Error", "Received empty Survey response. Can't load survey.");
            return;
        }

        var survey;
        if(surveyResponse && surveyResponse.success === true) {
            if(surveyResponse.surveys && surveyResponse.surveys[0]) {
                survey = surveyResponse.surveys[0];
                // TODO: validate survey enough to know it has the expected format
                if(!survey.survey) {
                    throw Error("Invalid survey content");
                }

                this.lookupReference('jsonText').setValue(survey.survey);

            } else {
                throw Error("Unable to retrieve survey");
            }
        }
    },

    /**
        Helper function for making a request to get surveys. Takes a metadata parameter denoting whether or
        not to just query the metadata, or to include the survey bodies.

        @function doGetSurveys

        @param {boolean} metadata - Flag for specifying whether or not to include survey bodies in the response, or
                                    to just return the metadata (id and title, where applicable)
        @param {Function} callback - The function to send the resulting response data to to be handled
     */
    doGetSurveys: function(metadata, callback) {
        var url = Ext.String.format('{0}/survey?metadata={1}',
                      Core.Config.getProperty('endpoint.rest'), metadata);

        Ext.Ajax.request({
          url: url,
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          scope: this,
          success: function(resp) {
            var respObj;
            if(resp && resp.status === 200) {
                respObj = this.decode(resp.responseText);
            } else {
                Ext.Msg.alert("Survey Error", this.buildErrorMessage(resp));
                return;
            }

            if(resp.status === 200 && respObj !== null && respObj.success === true) {
                callback.call(this, respObj);
            } else {
                //Ext.Msg.alert("Survey Error", this.buildErrorMessage(resp));
            }

          },
          failure: function(res) {
            if(res && res.timedout && res.timedout === true) {
                Ext.Msg.alert("Survey Error", "Server timed out fetching surveys");
                return; // TODO: fire event for re-querying
            }

            console.error("Error response: ", res);
            Ext.Msg.alert("Survey Error", this.buildErrorMessage(res));
          }
        });

    },

    /**
        Loads the surveys pulled from the API into the survey store if there are surveys in the response

        @function loadSurveyStoreFromResponse

        @param {Object} surveyresponse - Response from API containing surveys (generally survey metadata
                                         for list/store populating)
     */
    loadSurveyStoreFromResponse: function(surveyresponse) {
        if(!surveyresponse) {
            return;
        }

        if(surveyresponse.success === true && surveyresponse.surveys && surveyresponse.surveys.length > 0) {
            this.getSurveyStore().loadData(surveyresponse.surveys, true);
            this.getSurveyStore().sort('title');
        } else {
            // TODO: warn there was a problem parsing results to add to store, and either try again, or offer
            // TODO: a button to click to try again.... or else they'll be left with no survey data to select
        }
    },

    /**
        The handler for when the user completes the survey, and is posting the results

        @function onSave

        @param {Object} surveyresults - the JSON survey results containing the responses
        @param {Object} options - an options object passed in by the Survey.js onComplete event, which
                                  let's you set states, among other things, on the active survey

     */
    onSave: function(surveyresults, options) {

        // Set message/state as saving...
        if(options.showDataSaving) {
            options.showDataSaving();
        }

        var url = Ext.String.format('{0}/survey/results',
                      Core.Config.getProperty('endpoint.rest'));

        var surveyid = this.currentSurveyId;

        if(!surveyid) {
            Ext.Msg.alert("Survey Error", "Failure retrieving Survey ID for persisting");
            return;
        }

        var surveyResult = {
            surveyid: surveyid,
            userid: UserProfile.getUserId(),
            surveyresult: Ext.JSON.encode(surveyresults.data)
        };

        Ext.Ajax.request({
          url: url,
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          jsonData: surveyResult,
          success: function(res) {

            var response;
            if(res.responseText) {
                try {
                    response = Ext.JSON.decode(res.responseText);
                } catch(e){}
            }

            var status = res.status;
            var msg;

            if(status === 200 || status === 201) {
                options.showDataSavingSuccess();
            } else {
                // Error
                var msg = (response) ? (response.message || response.error) : Ext.String.format("Unknown ({0})",
                    status);

                options.showDataSavingError("Error saving survey response: " + msg);
            }
          },

          failure: function(res) {

            if(res && res.timedout && res.timedout === true) {
                options.showDataSavingError("Request timed out");
                Ext.Msg.Alert("Survey Error", "Server request timed out while saving survey results");
                // TODO: handle survey state, might have left survey in oncomplete phase where user can't resubmit
                return;
            }

            options.showDataSavingError();

            var status = res.status;
            var response;
            if(res.responseText) {
                try {
                    response = Ext.JSON.decode(res.responseText);
                } catch(e) {
                    console.error("error parsing response text: ", res.responseText, e.message);
                }
            }

            var msg = Ext.String.format("There was an error saving your survey: {0}. ({1})",
                (response.message) ? response.message : "Unknown", status);

            Ext.Msg.alert("Survey Error", msg);
          }
        });

    },

      onSaveSurveyNonSurveyJSEditor: function(evt, payload) {
        var surveyText = this.getView().getSurveyFromJsonText();
        var surveyEntity = {
          surveyId: -1,
          survey: surveyText,
          title: this.getTitleFromSurveyText(surveyText)
        };

        this.createUpdateSurvey(surveyEntity);
        /* TODO: what all needs to happen once created a new survey template?
            - Must also have associated formtype to be used...
                - so maybe nothing happens until it's associated?
                - Or should creating/picking a formtype be part of the creation dialog?
            - Also insert initial version into surveyhistory?
            - back-end publish over topic?
         */


      },

      /**
       * Creates a survey if no surveyid, or updates it if there's a surveyid
       *
       * {surveyId: n, title: '', survey: '', created: ''}
       *
       * @param survey
       */
      createUpdateSurvey: function(surveyEntity) {

          if(!surveyEntity) {
              return;
          }

          var id = '';
          var postOrPut = 'POST';

          if(surveyEntity.surveyid && surveyEntity.surveyid > 0) {
              // update survey
              id = '/' + surveyEntity.surveyid;
              postOrPut = 'PUT';
          }

          var url = Ext.String.format('{0}/survey{1}',
              Core.Config.getProperty('endpoint.rest'), id);

          var self = this;
          Ext.Ajax.request({
              url: url,
              method: postOrPut,
              headers: { 'Content-Type': 'application/json' },
              jsonData: surveyEntity,
              success: function(data) {

                  // TODO: put in try/catch so failed json decode doesn't break handling callback
                  var status;
                  var resp;
                  try {
                      resp = Ext.JSON.decode(data.responseText);
                      status = data.status;

                      // TODO: each callback case should also log or inform user what happened if it was a failure?
                      if(status === 201 || status === 200) { // TODO: check together with postOrPut

                          if(status === 201) {
                              var newid;
                              if(resp && resp.surveys && resp.surveys.length > 0) {
                                  newid = resp.surveys[0].surveyid;
                                  Ext.Msg.alert("Report", "Successfully created Report Template");
                              }
                          }

                          if(status === 200) {
                              if(resp && resp.surveys && resp.surveys.length > 0) {
                                  newid = resp.surveys[0].surveyid;
                                  Ext.Msg.alert("Report", "Successfully updated Report Template");
                              }
                          }

                          // TODO: store Survey Template?

                      } else {
                          var errMsg = self.buildErrorMessage(data);
                          // Should be an error
                          if(resp.success === true) {
                              // TODO: handle case where there was a success response, yet it wasn't a 200 or 201
                              console.error(errMsg);
                          } else {
                              // Should be error
                              console.error(errMsg);
                          }

                          Ext.Msg.alert("Survey Error", errMsg);
                      }

                  } catch(e) {
                      // TODO: better to check e has .message, and use that than print whole error object
                      console.error("Error while processing response: response(", data, "), error: ", e);

                      Ext.Msg.alert("Survey Error", self.buildErrorMessage(data));
                  }


              },
              failure: function(res) {

                  if(res && res.timedout && res.timedout === true) {
                      callback(saveNumber, false);
                      Ext.Msg.Alert("Survey Error", "Server request timed out while saving survey. Please try again.");
                      return;
                  }

                  // TODO: handle parsing response
                  var respObj = Ext.JSON.decode(res.responseText);
                  var msg = respObj.message || "See log for more details.";

                  console.error("Error saving survey: ", res);
                  Ext.Msg.alert("Survey", Ext.String.format("Error saving Survey: {0}", msg));
              }
          });

      },



    // TODO: had already started creating this function above ^^^
    onCreateFromJson: function(evt, something) {
        //console.log('onCreateFromJson: ', evt, something);

        var surveyText = this.getView().getSurveyFromJsonText();
        var surveyEntity = {
            surveyid: this.lookupReference('surveyEditorCombo').getValue(), //-1,
            survey: surveyText,
            title: this.getTitleFromSurveyText(surveyText)
        };

        this.createUpdateSurvey(surveyEntity);

    },

    /**q
        Setter for currentSurvey member. Sets the active Survey object, as well as setting the global currentSurveyId
        variable that holds the id of the active survey. Also handles removing and adding the onComplete event
        handler for the survey.

        @function setCurrentSurvey

        @param {integer} surveyId - The ID of the survey to set as active
        @param {Object} survey - the Survey instance that's active, i.e., the one the user is giving responses to

     */
    setCurrentSurvey: function(surveyId, survey) {

        if(this.currentSurvey || this.currentSurvey !== null) {
            this.currentSurveyId = null;
            this.currentSurvey.onComplete.remove();
        }

        survey.onComplete.add(this.onSave.bind(this));
        this.currentSurvey = survey;
        this.currentSurveyId = surveyId;
    },

    /**
        Getter for the surveyStore being used by the survey comboboxes

        @function getSurveyStore

        @return {Ext Store} - the surveyStore from the SurveyView
     */
    getSurveyStore: function() {
        return Ext.data.StoreManager.lookup('surveyStore');
    },

    /**
        Getter for the resultStore being used by the survey comboboxes

        @function getSurveyResultStore

        @return {Ext Store} - the resultStore from the SurveyView
     */
    getSurveyResultStore: function() {
        return Ext.data.StoreManager.lookup('resultStore');
    },

    /**
        Utility for getting the title property from survey text.

        @function getTitleFromSurveyText

        @param {string} surveyText - the json string/text that would be set/got from the editor's 'text' property

        @return {string || null} - the title parsed from the text, if found, null otherwise
     */
    getTitleFromSurveyText: function(surveyText) {
        if(!surveyText || surveyText === null) {
            return null;
        }

        var title;
        try {
            var surveyJson = Ext.JSON.decode(surveyText);
            if(surveyJson.title) {
                title = surveyJson.title;
            }
        } catch(e) {
            console.error("Exception parsing survey text into JSON");
        }

        return title || null;

    },

    /**
        Setter for the surveyBeingEdited object that holds the surveyId and title of
        the current survey being edited

        @function getSurveyBeingEdited

        @param {integer} surveyId - the ID of the survey being edited
        @param {string} title - the title of the survey being edited

     */
    setSurveyBeingEdited: function(surveyId, title) {
        if(!surveyId || !title) {
            console.error("SurveyId or title not valid, not updating surveyBeingEdited")
            Ext.Msg.alert("Cannot set current survey, id or title is null.");
            return;
        }

        this.surveyBeingEdited = {surveyId: surveyId, title: title};
    },

    /**
        Getter for the surveyBeingEdited object

        @function getSurveyBeingEdited

        @return {Object} - the surveyBeingEdited object, containing the ID and title of the survey being edited
     */
    getSurveyBeingEdited: function() {
        return this.surveyBeingEdited;
    },

    onSurveyDelete: function() {
        //Ext.Msg.alert("Delete Survey", "Really delete?");
        window.alert("NOT IMPLEMENTED");
    },

    onSurveyViewSelect: function(comp, payload) {
        // TODO: fetch and replace surveyresult store with results for specified surveyid,
        // optimization is to maintain the store, but just filter on surveyid, and lazily
        // populate the store only when a surveyid is selected

        var selection = payload.data;

        this.doGetSurveyResults(selection.surveyid, this.handleSurveyResults);
    },

    doGetSurveyResults: function(surveyId, callback) {
        // TODO: this currently fetches surveyresults... might need the metadata call to specify
        // TODO: only metadata, then fetch the results only on further selection like the Surveys
        var url = Ext.String.format('{0}/survey/results/survey/{1}',
                      Core.Config.getProperty('endpoint.rest'), surveyId);

        Ext.Ajax.request({
          url: url,
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          scope: this,
          success: function(resp) {
            var respObj;
            if(resp && resp.status === 200) {
                respObj = this.decode(resp.responseText);
            } else {
                Ext.Msg.alert("Survey Error", this.buildErrorMessage(resp));
                return;
            }

            if(resp.status === 200 && respObj !== null && respObj.success === true) {
                callback.call(this, respObj);
            } else {
                Ext.Msg.alert("Survey Error", this.buildErrorMessage(resp));
            }

          },
          failure: function(res) {
            if(res && res.timedout && res.timedout === true) {
                Ext.Msg.alert("Survey Error", "Server timed out fetching surveys");
                return; // TODO: fire event for re-querying
            }

            console.error("Error response: ", res);
            Ext.Msg.alert("Survey Error", this.buildErrorMessage(res));
          }
        });

    },

    handleSurveyResults: function(response) {
        // TODO: process survey results
        if(response.surveyResults && response.surveyResults.length && response.surveyResults.length > 0) {
            // Get id to filter on
            var userid = response.surveyResults[0].userid;

            // TODO: want to always clear store for this, or just filter? Could get large if user goes through
            // selecting different surveys.
            var store = this.getSurveyResultStore();
            store.loadData(response.surveyResults, false);
            //store.filter('userid', userid); // TODO: no need to filter if we're always loading
                                                                  // TODO: the store fresh w/o appending
        } else {
            Ext.Msg.alert("Survey Results", "No results for the selected survey.");
        }
    },

    onSurveyResultSelect: function(comp, payload) {
        var selection = payload.data;
        resultDiv.innerHTML = this.buildResultsHtml(selection.userid, selection.surveyresult);
    },

    buildResultsHtml: function(uid, surveyresult) {
        var resultJson;
        var opening = Ext.String.format("<h2>Survey results submitted by {0}</h2>", uid);
        // TODO: need to give this a class name, since it's affecting other components, in particular it's changing the style on the
        // TODO: Storms tree view
        var style = "<style>table.result-stripe{border-collapse: collapse;border-spacing: 0;width: 100%;border: 1px solid #ddd;}th.result-stripe, td.result-stripe {text-align: left;padding: 16px;}tr.result-stripe:nth-child(even) {background-color: #f2f2f2}tr.result-stripe:nth-child(odd) {background-color: white}</style>";
        this.getView().getResultContainer().cls = 'result-stripe';
        var resultHtml = style + "<table class='result-stripe' id='resultTable' style='border: 2px solid darkblue;width:100%;'><tr class='result-stripe' ><th class='result-stripe' style='border: 2px solid darkblue;background-color:lightblue'>Question</th><th class='result-stripe'  style='border: 2px solid darkblue;background-color:lightblue'>Answer</th></tr>";
        try {
            resultJson = this.decode(surveyresult);
        } catch(e) {
            console.error("Exception parsing survey result into JSON: ", e);
            return "<p style='color:red'>Error. Invalid JSON in Survey Result.</p>";
        }

        var newRow;
        var value;
        var tempValue = '';

        Object.keys(resultJson).forEach(function(key) {

            value = resultJson[key];
            //value = JSON.stringify(value);
            // TODO: Check to see if array/object array and not a readable value
            if(Array.isArray(value)) {
                // TODO: arrays may already be just turned into a comma delimited list
                //tempValue = Ext.String.format("", tempValue, );
            } else if(typeof value === 'object') {

                // TODO: build a mini striped table within the answer for these key/value pairs?
                tempValue = this.openStripedTable();
                Object.keys(value).forEach(function(innerKey) {
                    //tempValue = Ext.String.format("{0}{1}: {2}", tempValue === '' ? '' : tempValue + ', ', innerKey, value[innerKey]);
                    tempValue += this.buildRow(innerKey, value[innerKey]);
                }, this);
                tempValue += "</table>";
                value = tempValue;
            }

            newRow = Ext.String.format("<tr class='result-stripe'><td class='result-stripe'>{0}</td><td class='result-stripe'>{1}</td></tr>", key, value);

            resultHtml = Ext.String.format("{0}{1}", resultHtml, newRow);
        }, this);

        resultHtml = Ext.String.format("{0}{1}{2}", opening, resultHtml, "</table>");

        return resultHtml;

    },

    /**
        TODO: not really striped... need to set proper styling that works on a table within a table
     */
    openStripedTable: function(keyHeader, valHeader) {
        /*var style = "<style>td.table {border-collapse: collapse;border-spacing: 0;width: 100%;border: 1px solid #ddd;}th, td.table.td {text-align: left;padding: 16px;}td.table.tr:nth-child(even) {background-color: 'red'}td.table.tr:nth-child(odd) {background-color: 'yellow'}</style>";
        var html = style + "<table style='width:100%'>";*/
        var html = "<table style='width:100%'>";
        if(keyHeader && valHeader) {
            html += "<tr><th>" + keyHeader + "</th><th>" + valHeader + "</th></tr>";
        }

        return html;
    },

    buildRow: function(key, value) {
        return "<tr class='result-stripe' ><td class='result-stripe'  style='border: 1px solid black'>" + key + "</td><td class='result-stripe'  style='border: 1px solid black'>" + value + "</td></tr>";
    },

    // TODO: delete this method when done testing/implementing
    setTestSurvey: function() {

            this.testSurvey = {
                               "pages": [
                                {
                                 "name": "intro",
                                 "elements": [
                                  {
                                   "type": "text",
                                   "name": "stormName",
                                   "title": "Storm name:",
                                   "isRequired": true
                                  },
                                  {
                                   "type": "text",
                                   "name": "stormDate",
                                   "startWithNewLine": false,
                                   "title": "Storm Month/Year:",
                                   "isRequired": true
                                  },
                                  {
                                   "type": "text",
                                   "name": "userName",
                                   "title": "Name:",
                                   "isRequired": true
                                  },
                                  {
                                   "type": "text",
                                   "name": "userDate",
                                   "title": "Date:",
                                   "isRequired": true
                                  },
                                  {
                                   "type": "text",
                                   "name": "jurisdiction",
                                   "title": "Jurisdiction:",
                                   "isRequired": true
                                  },
                                  {
                                   "type": "text",
                                   "name": "userTitle",
                                   "title": "Title:",
                                   "isRequired": true
                                  },
                                  {
                                   "type": "text",
                                   "name": "userPhone",
                                   "title": "Phone:",
                                   "isRequired": true
                                  },
                                  {
                                   "type": "text",
                                   "name": "userEmail",
                                   "title": "Email:",
                                   "isRequired": true,
                                   "validators": [
                                    {
                                     "type": "email"
                                    }
                                   ]
                                  },
                                  {
                                   "type": "comment",
                                   "name": "primaryDecisionMaker",
                                   "title": "Who is the primary decision-maker for issuing local evacuation orders in response to tropical cyclones?",
                                   "isRequired": true,
                                   "cols": 80
                                  }
                                 ],
                                 "title": "Hurricane Post-Storm Assessment Base Survey Questions"
                                },
                                {
                                 "name": "section1",
                                 "elements": [
                                  {
                                   "type": "checkbox",
                                   "name": "section1question1",
                                   "title": "1. Of the following products and resources you may have used, which items were most important or useful to your decision-making process and operational response?",
                                   "isRequired": true,
                                   "choices": [
                                    "HURREVAC",
                                    "SLOSH MOMs",
                                    "Evacuation Zones",
                                    "CRES",
                                    "State EM Briefings/Conference Calls",
                                    "P-Surge",
                                    "NHC Storm Surge Watch/Warning Products",
                                    "Other",
                                    "Evacuation Clearance Times",
                                    "SLOSH MEOWs",
                                    "Behavorial Data From HES",
                                    "NHC Briefings/Conference Calls",
                                    "Local NWS Briefings/Conference Calls",
                                    "NHC Hurricane Watch/Warning Products",
                                    "Personal and Historical Knowledge"
                                   ],
                                   "colCount": 2
                                  },
                                  {
                                   "type": "matrix",
                                   "name": "section1question2",
                                   "title": "2. Of the following decision support tools utilized, how would you rate their performance and ease of use on a scale of 1-5 (1 = unsatisfactory, 5 = excellent)? Select N/A if not used.",
                                   "valueName": "section1question2",
                                   "isRequired": true,
                                   "columns": [
                                    "1     ",
                                    "2     ",
                                    "3     ",
                                    "4     ",
                                    "5     ",
                                    "N/A   "
                                   ],
                                   "rows": [
                                    "HURREVAC",
                                    "SLOSH",
                                    "Evacuation Clearance Times",
                                    "Evacuation Zones",
                                    "Evacuation Orders",
                                    "Hurricane Evacuation Study (HES)",
                                    "CRES"
                                   ]
                                  },
                                  {
                                   "type": "text",
                                   "name": "otherTools",
                                   "title": "Other Decision Support Tools"
                                  },
                                  {
                                   "type": "comment",
                                   "name": "enhancements",
                                   "title": "3. Are there any enhancements or improvements that could be made to any of the above resources to improve the usefulness to your evacuation operations, planning, or response?",
                                   "isRequired": true,
                                   "cols": 80
                                  },
                                  {
                                   "type": "matrix",
                                   "name": "hurrevacRated",
                                   "title": "4. If HURREVAC was utilized, which one of the following program components were used, and how would you rate them overall (1 = unsatisfactory, 5 = excellent)? Please rate them for both ease of use and providing useful information. Select N/A if not used.",
                                   "isRequired": true,
                                   "columns": [
                                    "1     ",
                                    "2     ",
                                    "3     ",
                                    "4     ",
                                    "5     ",
                                    "N/A   "
                                   ],
                                   "rows": [
                                    "Decision Arc",
                                    "Clearance Times",
                                    "Wind Speed Probabilities",
                                    "WPC Rainfall Forecast",
                                    "Error Cone",
                                    "Wind Timing Table",
                                    "Wind Decay",
                                    "Tide Gages",
                                    "River Gages",
                                    "Flood Outlook",
                                    "Alternate Track (\"Direct Hit\")",
                                    "Evacuation Timing Report Table"
                                   ]
                                  },
                                  {
                                   "type": "checkbox",
                                   "name": "usefulInfo",
                                   "title": "5. From which sources did you receive useful information during the response? Check all that apply.",
                                   "isRequired": true,
                                   "choices": [
                                    "National Hurricane Center",
                                    "Local NWS Office",
                                    "Neighboring Local EMAs",
                                    "Department of Transportation",
                                    "The Weather Channel",
                                    "Local Media",
                                    "Twitter",
                                    "Other Social Media",
                                    "Private Weather Subscription",
                                    "Hurricane Liaison Team",
                                    "State EMA",
                                    "Regional FEMA Office",
                                    "HURREVAC",
                                    "National Media",
                                    "Facebook",
                                    "Instagram",
                                    "Internet",
                                    "Other"
                                   ],
                                   "colCount": 2
                                  },
                                  {
                                   "type": "checkbox",
                                   "name": "s1q6",
                                   "title": "6. Which of the following products, if any, that are issued by the National Hurricane Center did you use as part of your operational planning and evacuation response?",
                                   "isRequired": true,
                                   "choices": [
                                    "Tropical Cyclone Discussion",
                                    "Tropical Cyclone Forecast Advisory",
                                    "Five-Day Graphical Tropical Weather Outlook",
                                    "5-Day Forecast Error Cone",
                                    "Surface Wind Speed Probabilities Text Product",
                                    "Potential Storm Surge Flooding Map",
                                    "Tropical Cyclone Public Advisory",
                                    "Track Forecast Cone and Watch/Warning Graphic",
                                    "Two-Day Graphical Tropical Weather Outlook",
                                    "3-Day Forecast Error Cone",
                                    "Surface Wind Speed Probabilities Graphic",
                                    "Local Hurricane Statement"
                                   ],
                                   "colCount": 2
                                  },
                                  {
                                   "type": "comment",
                                   "name": "s1q7",
                                   "title": "7. Did you receive National Hurricane Center product information directly from the NHC website? If not, how did you receive their information? Please explain.",
                                   "isRequired": true,
                                   "cols": 80
                                  },
                                  {
                                   "type": "comment",
                                   "name": "s1q8",
                                   "title": "8. Have you utilized any of the experimental products issued by the National Hurricane Center (i.e. Storm Surge Watch/Warning Graphic)? If so, did you feel they were useful and effective? Please provide any comments.",
                                   "cols": 80
                                  },
                                  {
                                   "type": "comment",
                                   "name": "s1q9",
                                   "title": "9. Please provide any additional information about products or tools which provided useful storm and event information during storm operations and response.",
                                   "cols": 80
                                  }
                                 ],
                                 "title": "I. Tools"
                                },
                                {
                                 "name": "section2",
                                 "elements": [
                                  {
                                   "type": "radiogroup",
                                   "name": "issuedEvacOrders",
                                   "title": "1. Did your jurisdiction issue evacuation orders?",
                                   "isRequired": true,
                                   "choices": [
                                    "No evacuation orders were issued",
                                    "Targeted",
                                    "Voluntary",
                                    "Recommended",
                                    "Mandatory"
                                   ]
                                  },
                                  {
                                   "type": "text",
                                   "name": "s2q1",
                                   "indent": 1,
                                   "title": "If yes, please specify the date and time orders were issued. If evacuation orders were not issued, please continue to section III.",
                                   "enableIf": "{issuedEvacOrders} <> \"No evacuation orders were issued\"",
                                   "requiredIf": "{issuedEvacOrders} <> \"No evacuation orders were issued\""
                                  },
                                  {
                                   "type": "checkbox",
                                   "name": "s2q2",
                                   "title": "2. How were evacuation areas determined for your jurisdiction? Select all that apply.",
                                   "isRequired": true,
                                   "choices": [
                                    "HES Process/Storm Surge Maps",
                                    "CRES",
                                    "Political Decision",
                                    "History of Flooding",
                                    "Firm Maps",
                                    "History of Wind Damage",
                                    "Other"
                                   ],
                                   "colCount": 2
                                  },
                                  {
                                   "type": "checkbox",
                                   "name": "s2q3",
                                   "title": "3. How did you communicate evacuation orders to the public and other partners in the community?  Select all that apply. ",
                                   "isRequired": true,
                                   "choices": [
                                    "Local television",
                                    "Local newspaper",
                                    "Telephone",
                                    "Facebook",
                                    "Twitter",
                                    "Instagram",
                                    "Snapchat",
                                    "Periscope",
                                    "Vine",
                                    "Meetings",
                                    "Local Radio",
                                    "EMA Website",
                                    "Email Distribution",
                                    "Other Methods"
                                   ],
                                   "colCount": 2
                                  },
                                  {
                                   "type": "checkbox",
                                   "name": "section2question4",
                                   "title": "4. Did you experience any of the following issues disseminating information to the evacuating public?",
                                   "isRequired": true,
                                   "choices": [
                                    "Information too complicated",
                                    "Information inaccurate",
                                    "Not enough information",
                                    "Untimely information",
                                    "Population apathy",
                                    "Lack of political support",
                                    "Media problems",
                                    "Other problems"
                                   ],
                                   "colCount": 2
                                  },
                                  {
                                   "type": "comment",
                                   "name": "s2q4other",
                                   "indent": 1,
                                   "title": "If other, please explain:",
                                   "enableIf": "{section2question4} contains \"Other problems\"",
                                   "requiredIf": "{section2question4} = [\"Other problems\"]",
                                   "cols": 80
                                  },
                                  {
                                   "type": "checkbox",
                                   "name": "s2q5",
                                   "title": "5. Do you believe the evacuating public experienced any problems in receiving any of the following information? If so, please list some recommendations below.",
                                   "isRequired": true,
                                   "choices": [
                                    "Evacuation Orders",
                                    "Evacuation Routes",
                                    "Evacuation Detours",
                                    "Evacuation Zones ",
                                    "Travel Time Estimates",
                                    "Traffic Congestion Information",
                                    "Accurate Storm Information (Forecast)",
                                    "Other problems"
                                   ],
                                   "colCount": 2
                                  },
                                  {
                                   "type": "comment",
                                   "name": "question23",
                                   "indent": 1,
                                   "title": "Recommendations:",
                                   "cols": 80
                                  },
                                  {
                                   "type": "comment",
                                   "name": "s2q6",
                                   "title": "6. Did you use evacuation zones? If not, why?",
                                   "isRequired": true
                                  },
                                  {
                                   "type": "comment",
                                   "name": "s2q7",
                                   "title": "7. Do you feel that the evacuation zones that were created accurately reflected the vulnerability of your citizens to the impact from storm surge?",
                                   "isRequired": true
                                  },
                                  {
                                   "type": "comment",
                                   "name": "s2q8",
                                   "title": "8. Did you feel you had adequate time to evacuate to your predesignated location?",
                                   "isRequired": true
                                  },
                                  {
                                   "type": "checkbox",
                                   "name": "s2q9",
                                   "title": "9. How would you rate the public’s response to the evacuation notice?",
                                   "isRequired": true,
                                   "choices": [
                                    "Slow Response",
                                    "Normal Response",
                                    "Fast Response",
                                    "N/A"
                                   ],
                                   "colCount": 4
                                  },
                                  {
                                   "type": "panel",
                                   "name": "q10panel",
                                   "elements": [
                                    {
                                     "type": "multipletext",
                                     "name": "from",
                                     "indent": 1,
                                     "title": "Estimated evacuating FROM your community:",
                                     "items": [
                                      {
                                       "name": "People",
                                       "title": "People:"
                                      },
                                      {
                                       "name": "Vehicles",
                                       "title": "Vehicles:"
                                      }
                                     ],
                                     "colCount": 2
                                    },
                                    {
                                     "type": "multipletext",
                                     "name": "question28",
                                     "indent": 1,
                                     "title": "Estimated evacuating THROUGH your community:",
                                     "items": [
                                      {
                                       "name": "People",
                                       "title": "People:"
                                      },
                                      {
                                       "name": "Vehicles",
                                       "title": "Vehicles:"
                                      }
                                     ],
                                     "colCount": 2
                                    },
                                    {
                                     "type": "multipletext",
                                     "name": "question39",
                                     "indent": 1,
                                     "title": "Estimated evacuating TO your community:",
                                     "items": [
                                      {
                                       "name": "People",
                                       "title": "People:"
                                      },
                                      {
                                       "name": "Vehicles",
                                       "title": "Vehicles:"
                                      }
                                     ],
                                     "colCount": 2
                                    }
                                   ],
                                   "title": "10. What is the estimated number of people and vehicles evacuating for this event?",
                                   "isRequired": true
                                  },
                                  {
                                   "type": "checkbox",
                                   "name": "s2q11",
                                   "title": "11. How would you rate the traffic volume during this evacuation event?",
                                   "isRequired": true,
                                   "choices": [
                                    "Light",
                                    "Normal",
                                    "Heavy",
                                    "Congested"
                                   ],
                                   "colCount": 4
                                  },
                                  {
                                   "type": "checkbox",
                                   "name": "s2q12",
                                   "title": "12. Were any special traffic measures taken which improved the evacuation processes for this event?  Select all that apply.",
                                   "choices": [
                                    "Barricades",
                                    "Traffic Control Points",
                                    "Lock Down Drawbridges",
                                    "Roving Vehicle Assistance",
                                    "Coordinated Traffic Lights",
                                    "Radio Messages",
                                    "Highway Reversal",
                                    "Message Signs",
                                    "Traffic Redirect",
                                    "Other Measures"
                                   ],
                                   "colCount": 2
                                  },
                                  {
                                   "type": "comment",
                                   "name": "s2q13",
                                   "title": "13. Where any special methods used to monitor the traffic or track the evacuation (traffic counters, cameras, etc.)?",
                                   "isRequired": true,
                                   "cols": 80
                                  },
                                  {
                                   "type": "checkbox",
                                   "name": "section2question14",
                                   "title": "14. Were any of the following significant traffic problems experienced during the evacuation?  Select all that apply.",
                                   "choices": [
                                    "Unanticipated Volumes",
                                    "Congestion and Traffic Jams",
                                    "Accidents and Stalled Autos",
                                    "Traffic Control",
                                    "Uncoordinated Traffic Signals",
                                    "Coordination of Evacuation Timing",
                                    "Ferry Service Issues",
                                    "Flooded Roads",
                                    "Construction",
                                    "Inadequate Signage",
                                    "Damaged Roads",
                                    "County Roads Blocked",
                                    "Bridges",
                                    "Other"
                                   ],
                                   "colCount": 2
                                  },
                                  {
                                   "type": "comment",
                                   "name": "s2q14other",
                                   "indent": 1,
                                   "title": "If other, please explain:",
                                   "enableIf": "{section2question14} contains \"Other\"",
                                   "requiredIf": "{section2question14} contains \"Other\""
                                  },
                                  {
                                   "type": "comment",
                                   "name": "s2q15",
                                   "title": "15. Please provide an estimate as to how long the evacuation process took, on average. The evacuation process is being defined from the initiation of the evacuation order until the last car reaches a point of safety.",
                                   "isRequired": true,
                                   "cols": 80
                                  },
                                  {
                                   "type": "comment",
                                   "name": "s2q16",
                                   "title": "16. Were the clearance times from your HES Transportation Analysis and in HURREVAC accurate and useful in planning for/calling for or executing your evacuation? If not, why?",
                                   "isRequired": true,
                                   "cols": 80
                                  },
                                  {
                                   "type": "comment",
                                   "name": "s2q17",
                                   "title": "17. Did the tourist occupancy present a significant problem not addressed by the clearance times in HURREVAC?",
                                   "isRequired": true,
                                   "cols": 80
                                  },
                                  {
                                   "type": "comment",
                                   "name": "s2q18",
                                   "title": "18. Were there any best practices that you implemented to minimize the evacuation time for the public?",
                                   "isRequired": true,
                                   "cols": 80
                                  }
                                 ],
                                 "title": "II. Evacuation"
                                },
                                {
                                 "name": "section3",
                                 "elements": [
                                  {
                                   "type": "checkbox",
                                   "name": "section3question1",
                                   "title": "1. Have you participated in any of the following training courses provided by the FEMA National Hurricane Program?",
                                   "choices": [
                                    "L-324 Hurricane Preparedness for Decision Makers (National Hurricane Center Version)",
                                    "L-320 Hurricane Preparedness for Decision Makers – State Specific",
                                    "IS-324 Introduction to Hurricane Preparedness (Online Version)",
                                    "L-310 Hurricane Readiness for Inland Communities",
                                    "L-311 Hurricane Readiness for Coastal Communities",
                                    "G-363 Coastal Hurricane Readiness",
                                    "HURREVAC",
                                    "SLOSH"
                                   ]
                                  },
                                  {
                                   "type": "comment",
                                   "name": "s3q2",
                                   "title": "2. If so, did you feel your training provided you for your response planning or operations? How can the training be improved? Please provide any comments.",
                                   "enableIf": "{section3question1} notempty",
                                   "requiredIf": "{section3question1} notempty",
                                   "cols": 80
                                  },
                                  {
                                   "type": "comment",
                                   "name": "s3q3",
                                   "title": "3. Please provide any comments about how the FEMA National Hurricane Program can support you in preparing for and responding to hurricanes, through products, decision support tools, Hurricane Evacuation Studies, or other resources and/or support.",
                                   "cols": 80
                                  }
                                 ],
                                 "title": "III. Training and Education"
                                }
                               ],
                               "showQuestionNumbers": "off"
                              };
        }
    

    
  });
});
