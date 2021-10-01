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
  "@esri/arcgis-rest-request",
  "@esri/arcgis-rest-auth",
], function(Core, ArcgisReq, ArcgisAuth) {

  function _addSession(datasourceid, session) {
    if (session.serialize) {
      localStorage.setItem(datasourceid, session.serialize());
    }
  }

  function _removeSession(datasourceid) {
    localStorage.removeItem(datasourceid);
  }

  function _getSession(datasourceid) {
    var serializeSession = localStorage.getItem(datasourceid);
    if (serializeSession) {
      var session = JSON.parse(serializeSession);
      session.tokenExpires = new Date(session.tokenExpires);
      if (!_expired(session.tokenExpires)) {
        return new ArcgisAuth.UserSession(session);
      }
    }
    return null;
  }

  function _getRequestSession(datasourceid) {
    var session = _getSession(datasourceid);
    if (session) {
      return Promise.resolve(session);
    }
    return _requestSession(datasourceid);
  }

  function _expired(expirationTime) {
    return new Date().getTime() > expirationTime;
  }

  function _requestSession(datasourceid) {
    // TODO: currently only handles arcgis online
    var clientId = "2lXUMmgCcwEHGnxx";

    window.ArcGISclientId = clientId;
    return ArcgisAuth.UserSession.beginOAuth2({
      clientId: clientId,
      redirectUri: window.location.origin + "/nics/js/nics/modules/datalayer/arcgis-authenticate.html",
      popup: true,
    })
      .then(function(session) {
        _addSession(datasourceid, session);
        return session;
      })
      .catch(function(error) {
        console.log('ArcGISSessionManager requestSession failed', error);
        throw error;
      });
  }

  return {
    getRequestSession: function(datasourceid) {
      return _getRequestSession(datasourceid);
    },

    getSession: function(datasourceid) {
      return _getSession(datasourceid);
    },

    addSession: function(datasourceid, session) {
      _addSession(datasourceid, session);
    },

    removeSession: function(datasourceid) {
      _removeSession(datasourceid);
    }
  };
});
