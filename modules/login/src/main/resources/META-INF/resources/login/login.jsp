<%--

    Copyright (c) 2008-2021, Massachusetts Institute of Technology (MIT)
    All rights reserved.

    Redistribution and use in source and binary forms, with or without
    modification, are permitted provided that the following conditions are met:

    1. Redistributions of source code must retain the above copyright notice, this
    list of conditions and the following disclaimer.

    2. Redistributions in binary form must reproduce the above copyright notice,
    this list of conditions and the following disclaimer in the documentation
    and/or other materials provided with the distribution.

    3. Neither the name of the copyright holder nor the names of its contributors
    may be used to endorse or promote products derived from this software without
    specific prior written permission.

    THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
    AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
    IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
    DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
    FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
    DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
    SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
    CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
    OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
    OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

--%>
<%@ page pageEncoding="UTF-8" contentType="text/html; charset=UTF-8"%>
<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c" %>
<%@ taglib prefix="fmt" uri="http://java.sun.com/jsp/jstl/fmt" %>
<!doctype html>
<html>
    <c:set var="bundle" value="${requestScope.activeBundle}" />
    <head>
        <meta charset="utf-8">
        <meta http-equiv="x-ua-compatible" content="ie=edge">
        <title><c:out value="${requestScope.sitelabel}"/></title>
        <meta name="description" content="">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <script>
         var alertMsg = {
           chooseServer: "${bundle.getString("chooseServer")}",
           chooseWorkspace: "${bundle.getString("chooseWorkspace")}"
           };
        function loadAnnouncements() {
          var newWorkspace = document.getElementById("server").value;
          document.getElementById("currentWorkspace").value = newWorkspace;

          var newLang = document.getElementById("language").value;
          document.forms["workspaceAnnouncements"]["lang"].value = newLang;

          if (newWorkspace != " " || newLang != " ") {
          	document.forms["workspaceAnnouncements"].submit();
          }

		}
		 function validateWorkspace() {
          var newWorkspace = document.getElementById("server").value;
         if (newWorkspace == "") {
         		alert(alertMsg.chooseWorkspace);
         }

		}
		function setWorkspace() {
            setLanguage();

            var currentWorkspace = getQueryVariable("currentWorkspace");
            if (currentWorkspace) {
                document.getElementById('server').value = currentWorkspace;
                         //document.getElementById("server").selectedIndex =
            }
            else {
                document.getElementById("server").selectedIndex = 0;
            }
        }

         function validateForm() {
            var x = document.forms["login"]["server"].value;
            if (x == null || x == " ") {
              alert("Please choose a server");
                return false;
            }
        }
        function getQueryVariable(variable)
        {
           var query = window.location.search.substring(1);
           var vars = query.split("&");
           for (var i=0;i<vars.length;i++) {
                   var pair = vars[i].split("=");
                   if(pair[0] == variable)
                   {
                        return pair[1];
                   }
           }
           return(false);
        }

        //sets dropdowns current selection on page load
        function setLanguage()
        {
            var urlParam = getQueryVariable("lang");

            document.getElementById("lang").value = urlParam;
            document.getElementById("currentWorkspace").value = getQueryVariable("currentWorkspace");

            if(urlParam == false){
                document.getElementById('language').value = '${bundle.GetDefaultLocaleCode()}';
            }else{
                document.getElementById('language').value = urlParam;
            }
        }

        function languageChanged()
        {
            loadAnnouncements();
        }

        function registerButtonClicked(){
            location.href = getBaseUrl() + "/register" + getCurrentLanguageUrlParam();
        }

        function forgetPasswordButtonClicked(){
            location.href = getBaseUrl() + "/forgotpassword" + getCurrentLanguageUrlParam();
        }

        function getCurrentLanguageUrlParam(){
            var newLanguage = document.getElementById("language").value;
            if(newLanguage != null){
                return "?lang=" + newLanguage;
            }else{
                return "";
            }
        }

        function getBaseUrl(){
            var getUrl = window.location;
            return getUrl.protocol + "//" + getUrl.host + "/" + getUrl.pathname.split('/')[1];
        }

        </script>
        <link rel="stylesheet" href="login/styles/login.css">
    </head>
    <body  onload="setWorkspace()">

        <div class="wrapper">
        
            <form id="login" action="login" method="post" onsubmit="return validateForm()">
            <input type="hidden" id="lang" name="lang" />

            <div class="header">

                <div class="language-select">
                    <label for="language">Language:</label>
                    <select id="language" name="language" tabindex="5" onchange="languageChanged()" required>

                    ${requestScope.helpsite}

                    <c:forEach items="${bundle.GetAvailableLocales()}" var="language">
                        <option value="${language.getCode()}"  >
                            <c:out value="${language.name}" />
                        </option>
                    </c:forEach>
                    </select>
                </div>

                <div class="server-select">
                    <label for="server">${bundle.getString("server")}:</label>
                    <select id="server" name="workspace" tabindex="6" onchange="loadAnnouncements()" required>
                    <c:forEach items="${requestScope.workspaces}" var="workspace">
                        <option value="<c:out value="${workspace['workspaceid']}" />"  >
                            <c:out value="${workspace['workspacename']}" />
                        </option>
                    </c:forEach>
                    </select>
                </div>
            </div>

            <div class="content">
                <div class="content-wrapper">
                    <img src="<c:out value="${requestScope.sitelogo}"/>" height="290px" width="423px"></img>
                    <br>
                    <div class="field">

                        <label for="email">${bundle.getString("username")}:</label>
                        <br>
                        <input type="text" id="email" name="email" tabindex="1" autofocus="autofocus"/>
                    </div>
                    <br>
                    <div class="field">
                        <label for="password">${bundle.getString("password")}:</label>
                        <br>
                        <input type="password" id="password" name="password" tabindex="2" />
                    </div>
                    <br>
                    <button type="submit" tabindex="3" >${bundle.getString("login")}</button>
                    <br/><br/>

                    <span style="font-size: small">
                    ${bundle.getString("account")}
                        <input type="Button" value="${bundle.getString('register')}"
                            onclick="registerButtonClicked()" />
                    </span>

                    <br/><br/>
                    <span style="font-size: small">
                    ${bundle.getString("forgotPassword")}
                        <input type="Button" value="${bundle.getString('clickHere')}"
                            onclick="forgetPasswordButtonClicked()" />
                    </span>

                </div>
            </div>
            <div class= "announcements" >
                <div class="content-wrapper">
                    <h2>${bundle.getString("announcements")}</h2>
                    <ul>
                    
                     <c:forEach items="${requestScope.announcements}" var="announcement">
                    
                         <li> <strong>  <c:out value="${announcement['postedDate']}"  />, <c:out value="${announcement['postedby']}"  /> </strong>
                            <c:out value="${announcement['message']}" />
                        </li> 
                    </c:forEach>
                    </ul>
                </div>
            </div>
            </form>
              <form id="workspaceAnnouncements" action="login" method="get">
               <input type="hidden" id="currentWorkspace" name="currentWorkspace" />
               <input type="hidden" id="lang" name="lang" />
              </form>

            <div class="footer">
                <span class="footer-left">
                    <span>Version: <c:out value="${requestScope.version}" /></span>
                </span>

                 <span class="footer-right nav">
                    <span>
                        <a href="<c:out value="${requestScope.mobilepath}"/>">${bundle.getString("Download NICS Mobile")}</a>
                    </span>
                    <span>
                        <a href="about.html">${bundle.getString("about")}</a>
                    </span>
                    <span>
                        <a href="terms.html">${bundle.getString("terms")}</a>
                    </span>
                    <span>
                        <a href="settings.html">${bundle.getString("settings")}</a>
                    </span>
                    <span>
                        <a href="<c:out value="${requestScope.helpsite}" />" target="_blank">${bundle.getString("help")}</a>
                    </span>
                </span>
            </div>
        
        </div>
    </body>
</html>
