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
    <title>NICS - ${bundle.getString('forgotPassword')}</title>
    <meta name="description" content="">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <link rel="stylesheet" href="forgotpassword/styles/forgotpassword.css">

    <script>

            function submitButtonPressed(){
                var lang = getQueryVariable("lang");
                document.forms["forgotpassword"]["lang"].value = lang;
                document.forms["forgotpassword"].submit();
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

    </script>
</head>
<body>

<div class="wrapper">

    <form id="forgotpassword" action="forgotpassword" method="post">

        <div class="header">
            <div class="server-select">

                <label for="server">${bundle.getString('server')}:</label>
                <select id="server" name="workspace" tabindex="5">
                    <c:forEach items="${requestScope.workspaces}" var="workspace">
                        <option value="<c:out value="${workspace['workspaceid']}" />">
                            <c:out value="${workspace['workspacename']}" />
                        </option>
                    </c:forEach>
                </select>
            </div>
        </div>

        <div class="content">
            <div class="content-wrapper">
                <img src="forgotpassword/images/nics-logo.jpg" height="290px" width="423px"></img>
                <br>
                <div class="field">
                    <label for="username">${bundle.getString('username')}:</label>
                    <br>
                    <input type="text" id="username" name="username" tabindex="1" autofocus="autofocus"/>
                </div>
                <br>

                <input type="Button" tabindex="3" onclick="submitButtonPressed()"  value="${bundle.getString('submit')}"/>
            </div>
        </div>
    </form>

    <div class="footer">
            <span class="footer-left">
                <span>Version: <c:out value="${requestScope.version}" /></span>
            </span>

           <span class="footer-right nav">
                <span>
                    <a href="about.html">${bundle.getString('about')}</a>
                </span>
                <span>
                    <a href="terms.html">${bundle.getString('terms')}</a>
                </span>
                <span>
                    <a href="settings.html">${bundle.getString('settings')}</a>
                </span>
                <span>
                    <a href="<c:out value="${requestScope.helpsite}" />" target="_blank">${bundle.getString('help')}</a>
                </span>
            </span>
    </div>

</div>
</body>
</html>
