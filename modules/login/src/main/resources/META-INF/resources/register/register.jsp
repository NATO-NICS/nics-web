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
<%@ taglib uri="http://java.sun.com/jsp/jstl/functions" prefix="fn" %>
<%@ taglib prefix="fmt" uri="http://java.sun.com/jsp/jstl/fmt" %>
<!doctype html>
<html>
<c:set var="bundle" value="${requestScope.activeBundle}" />
    <head>
        <meta charset="utf-8">
        <meta http-equiv="x-ua-compatible" content="ie=edge">
        <title><c:out value="${requestScope.sitelabel}"/>  - ${bundle.getString('register')}</title>
        <meta name="description" content="">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        <link rel="stylesheet" href="register/styles/register.css">
		<script src="https://www.google.com/recaptcha/api.js" async defer></script>
        <script type="text/javascript">
        	
        	var fullOrgOptions = null;
        	var orgArray = null;
        	
        	function onLoad() {
        		
        		var affval = document.getElementById('affiliation').value; 
        		if(affval) {
        			filterOrgs();
        			selectSelectedOrg();
        		} else {
        			populateFullOrgs();
        		}
        		
        		var imtCdf = document.getElementById('imtCDFSelected').value;
				var imtFederal = document.getElementById('imtFederalSelected').value;
				var imtOtherLocal = document.getElementById('imtOtherLocalSelected').value;
				var imtUsar = document.getElementById('imtUsarSelected').value;
				
				populateIMTs();
				
        		if(imtCdf !== "0" && imtCdf !== "") {
        			document.getElementById('imtCDF').value = imtCdf;
        		} 
        		if(imtFederal !== "0" && imtFederal !== "") {
        			document.getElementById('imtFederal').value = imtFederal;
        		}
        		if(imtOtherLocal !== "0" && imtOtherLocal !== "") {
        			document.getElementById('imtOtherLocal').value = imtOtherLocal;	
        		}
        		if(imtUsar !== "0" && imtUsar !== "") {
        			document.getElementById('imtUsar').value = imtUsar;
        		}
        	}
        	
        	
        	/**
        		function: populateIMTs 
        		Populates IMT select elements based on matching Org Type for each IMT
        	*/
        	function populateIMTs() {
        		var cdfImtOptions = [], federalImtOptions = [], otherLocalImtOptions = [], usarImtOptions = [];
        		
        		var cdfImt, cdfImtOrgs = [];
        		var federalImt, federalImtOrgs = [];
        		var otherLocalImt, otherLocalImtOrgs = [];
        		var usarImt, usarImtOrgs = [];
        		        		
        		var orgType = document.getElementById('affiliation');
        		for(var a = 0; a < orgType.length; a++) {
        			if(orgType.options[a].text.indexOf('USAR') >= 0) {
        				usarImt = orgType.options[a].value;
        			} else if(orgType.options[a].text.indexOf('Federal IMT') >= 0) {
        				federalImt = orgType.options[a].value;
        			} else if(orgType.options[a].text.indexOf('CDF IMT') >= 0) {
        				cdfImt = orgType.options[a].value;
        			} else if(orgType.options[a].text.indexOf('Other Local IMT') >= 0) {
        				otherLocalImt = orgType.options[a].value;
        			}
        		}
        		
        		var orgOrgTypes = document.getElementById('orgorgtypes');
        		for(var oot = 0; oot < orgOrgTypes.length; oot++) {
        			
        			if(orgOrgTypes.options[oot].value === usarImt) {
        				usarImtOrgs.push(orgOrgTypes.options[oot].text);
        			} else if(orgOrgTypes.options[oot].value === federalImt) {
        				federalImtOrgs.push(orgOrgTypes.options[oot].text);
        			} else if(orgOrgTypes.options[oot].value === cdfImt) {
        				cdfImtOrgs.push(orgOrgTypes.options[oot].text);
        			} else if(orgOrgTypes.options[oot].value === otherLocalImt) {
        				otherLocalImtOrgs.push(orgOrgTypes.options[oot].text);
        			}
        		}
        		
        		var imtusar = document.getElementById('imtUsar');
        		for(var usar = usarImtOrgs.length -1; usar >= 0; usar--) {
        			var opt = document.createElement('option');
        			opt.value = usarImtOrgs[usar]; // ID
        			opt.text = orgArray[usarImtOrgs[usar]]; // Name
        			usarImtOptions.push(opt);
        			imtusar.add(opt);
        		}
        		
        		var imtfederal = document.getElementById('imtFederal');
        		for(var fed = federalImtOrgs.length - 1; fed >= 0; fed--) {
        			var opt = document.createElement('option');
        			opt.value = federalImtOrgs[fed]; // ID
        			opt.text = orgArray[federalImtOrgs[fed]]; // Name
        			federalImtOptions.push(opt);
        			imtfederal.add(opt);
        		}
        		
        		var imtcdf = document.getElementById('imtCDF');        		
        		for(var cdf = cdfImtOrgs.length - 1; cdf >= 0; cdf--) {
        			var opt = document.createElement('option');
        			opt.value = cdfImtOrgs[cdf]; // ID
        			opt.text = orgArray[cdfImtOrgs[cdf]]; // Name
        			cdfImtOptions.push(opt);
        			imtcdf.add(opt);
        		}
        		
        		var imtotherlocal = document.getElementById('imtOtherLocal');
        		for(var other = otherLocalImtOrgs.length - 1; other >= 0; other--) {
        			var opt = document.createElement('option');
        			opt.value = otherLocalImtOrgs[other]; // ID
        			opt.text = orgArray[otherLocalImtOrgs[other]]; // Name
        			otherLocalImtOptions.push(opt);
        			imtotherlocal.add(opt);
        		}
        	}
        	
        	// Org and IMT setters    		
        	function setOrg(org) {
        		document.getElementById('selectedOrg').value = org.value;
        	}
        	
        	function setImtCDF(org) {
        		document.getElementById('imtCDFSelected').value = org.value;
        	}
        	
        	function setImtFederal(org) {
        		document.getElementById('imtFederalSelected').value = org.value;
        	}
        	
        	function setImtOtherLocal(org) {
        		document.getElementById('imtOtherLocalSelected').value = org.value;
        	}
        	
        	function setImtUsar(org) {
        		document.getElementById('imtUsarSelected').value = org.value;
        	}
        	
        	function selectSelectedOrg() {
        		var orgElement = document.getElementById('org');
        		var selectedOrgEl = document.getElementById('selectedOrg');
        		if(!selectedOrgEl.value || selectedOrgEl.value === "") {
        			console.log("No selected org, can't re-select");
        			return;
        		}
        		
        		orgElement.value = selectedOrgEl.value;
        	}
        	
        	/**
        		Restores all orgs to org select, iff fullOrgOptions is not undefined
        	*/
        	function restoreOrgs() {
        		if(!fullOrgOptions) {
        			return;
        		}
        		
        		var orgElement = document.getElementById('org');
        		orgElement.options.length = 0;
        		for(var i = 0; i < fullOrgOptions.length; i++) {
        			orgElement.add(fullOrgOptions[i]);
        		}
        	}
        	
        	function populateFullOrgs() {
        		var orgElement = document.getElementById('org');
        		        		
        		fullOrgOptions = [];
        		orgArray = [];
	    		for(var a = 0; a < orgElement.length; a++) {
	    			var opt = document.createElement('option');
	    			opt.text = orgElement.options[a].text;
	    			opt.value = orgElement.options[a].value;
	    			fullOrgOptions.push(opt);
	    			
	    			orgArray[orgElement.options[a].value] = orgElement.options[a].text;
	    		}
        	}
        	
		    function filterOrgs() {
		    	
		    	var orgElement = document.getElementById('org');
		    	var orgOrgTypeElement = document.getElementById('orgorgtypes');
		    	
		    	if(!fullOrgOptions) {
		    		populateFullOrgs();
		    	} else {
		    		restoreOrgs();	
		    	}
		    	
		    	var orgTypeId = document.getElementById('affiliation').value;
		    	
		    	if(!orgTypeId) {
		    		if(console) { console.log("Error getting affiliation value");}
		    		return;
		    	}
		    	// orgTypeElement.value is orgtypeid, .text is orgid
		    	// org.value = orgid, org.text= orgname
		    	
		    	var optionsArr = [];
		    	
		    	var matchingOrgs = "";
		    	for (var i=0; i < orgOrgTypeElement.length; i++){
		    				    		
		    		if(orgTypeId === orgOrgTypeElement.options[i].value) {
		    			// orgOrgTypeElement: text: orgid , value: orgtypeid
		    			// orgElement: value: orgid
		    			for( var j = 0; j < orgElement.length; j++) {
		    				if(orgOrgTypeElement.options[i].text == orgElement.options[j].value +"") {
		    				
		    					matchingOrgs += orgElement.options[j].text + " ";		    					
		    					var nopt = document.createElement('option');		    					
		    					nopt.value = orgElement.options[j].value;
		    					nopt.text = orgElement.options[j].text;
		    					if(optionsArr.length > 0){
		    						
		    						for(var k = 0; k < optionsArr.length; k++){
		    							if(optionsArr[k].text < nopt.text){
		    							
		    								if(k == optionsArr.length-1){
		    									optionsArr.push(nopt);
		    									break;
		    								}
		    								
		    							}
		    							else {
		    								optionsArr.splice(k,0,nopt);
		    								break;
		    							}
		    						}
		    					}else{
		    						optionsArr.push(nopt);
		    					}
		    				}
		    			}		    			
		    		}
		    	}
		    	
		    	orgElement.options.length = 0; // Clear out current options
		    	
		    	var defaultOpt = document.createElement('option');
		    	defaultOpt.value = 0;
		    	defaultOpt.text = 'Please select an Organization';
		    	orgElement.add(defaultOpt);
		    	orgElement.value = 0;
		    	if(optionsArr.length == 0) {
		    		console.log("No orgs match this affiliation");
		    		return;
		    	}
		    	
		    	for(var x = 0; x < optionsArr.length; x++) {
		    		orgElement.add(optionsArr[x]);
		    	}
		    			
		    }


             function OpenClose(obj) {
               HeadObj = eval(obj + "_Head");
               BodyObj = eval(obj + "_Body");

               if (BodyObj.style.display=='block') {
                 BodyObj.style.display='none';
                 SignOffset = HeadObj.innerHTML.indexOf("-");
                 HeadObj.innerHTML = "+" + HeadObj.innerHTML.substring(SignOffset+1);
               } else {
                 BodyObj.style.display='block';
                 SignOffset = HeadObj.innerHTML.indexOf("+");
                 HeadObj.innerHTML = "-" + HeadObj.innerHTML.substring(SignOffset+1);
               }
             }


		    function validateForm(response) {
		    	
		    	var valid = true;
		    	var reasons = "";
		    	// TODO: validate with esapi or something better, this is a very quick and dirty check
		    	// of choices and fields being empty
		    	
		    	var affValue = document.getElementById('affiliation').value;
		    	var orgValue = document.getElementById('org').value;
		    	var firstValue = document.getElementById('first').value;
		    	var lastValue = document.getElementById('last').value;
		    	var emailValue = document.getElementById('email').value;
		    	var passwordValue = document.getElementById('password').value;
		    	var confirmPasswordValue = document.getElementById('confirmPassword').value;
		    	var phoneMobile = document.getElementById('phoneMobile').value;
		    	var phoneOffice = document.getElementById('phoneOffice').value;
		    	var phoneOther = document.getElementById('phoneOther').value;



		    	if(!affValue || affValue === "") {
		    		reasons += "${bundle.getString('needAffiliation')}<br/>";
		    		valid = false;
		    	}

		    	if(!orgValue || orgValue === "0" || orgValue === "") {
		    		reasons += "${bundle.getString('chooseOrg')}<br/>";
		    		valid = false;
		    	}

		    	if(!firstValue || firstValue === "") {
		    		reasons += "${bundle.getString('provideFirstName')}<br/>";
		    		valid = false;
		    	}


		    	if(!lastValue || lastValue === "") {
		    		reasons += "- ${bundle.getString('provideLastName')}<br/>";
		    		valid = false;
		    	}

		    	if(!emailValue || emailValue === "") {
		    		reasons += "- ${bundle.getString('provideEmail')}<br/>";
		    		valid = false;
		    	}
		    			    	
		    	if(!passwordValue || passwordValue === ""
		    			|| !confirmPasswordValue || confirmPasswordValue === ""
		    			|| (passwordValue !== confirmPasswordValue) ) {
		    			//|| passwordValue.length < 8 || passwordValue.length > 20) {
		    		reasons += "- ${bundle.getString('provideValidPassword')}<br/>";
		    		valid = false;
		    	}
		    	
		    	// Ensure this regex matches back-end regex on UserInformation validator
		    	var passRegex = /${requestScope.passwordPattern}/;
		    	if(!passRegex.test(passwordValue)) {
		    		reasons += "- ${bundle.getString('badPassword')}<br/>";
		    	}
		    	
		    	if(phoneMobile && phoneMobile !== "") {
		    		phoneMobile = phoneMobile.replace(' ', '');
		    		phoneMobile = phoneMobile.replace(/\D/g,'');
                    document.getElementById('phoneMobile').value = phoneMobile;

		    		//This won't work for internation phone numbers
		    		//if(phoneMobile.length !== 10) {
		    		//	reasons += "- Mobile Phone not valid<br/>";
		    		//	valid = false;
		    		//}
		    	}
		    	
		    	if(phoneOffice && phoneOffice !== "") {
		    		phoneOffice = phoneOffice.replace(' ', '');
                    phoneOffice = phoneOffice.replace(/\D/g,'');
		    		document.getElementById('phoneOffice').value = phoneOffice;

		    		//This won't work for internation phone numbers
		    		//if(phoneOffice.length !== 10) {
		    			////reasons += "- Office Phone not valid<br/>";
		    			//valid = false;
		    		//}
		    	}
		    	
		    	if(phoneOther && phoneOther !== "") {
		    		phoneOther = phoneOther.replace(' ', '');
                    phoneOther = phoneOther.replace(/\D/g,'');
		    		document.getElementById('phoneOther').value = phoneOther;

		    		//This won't work for internation phone numbers
		    		//if(phoneOther.length !== 10) {
		    			//reasons += "- Other Phone not valid<br/>";
		    			//valid = false;
		    		//}
		    	}
		    	
		    	if(!valid) {
		    		document.getElementById("messages").hidden = false;
		    		document.getElementById("messages").innerHTML = "${bundle.getString('fillAllFields')}<br/>" +
		    			"<br/><br/>" + reasons;
		    			
		    		window.scrollTo(0,0);
		    	}
		    	
		    	return valid;
		    }
    
    	</script>
    </head>
    <body onload="onLoad();">
    
        <div class="wrapper" style="background: linear-gradient(#003366, #0066FF)">        	
        
            <form id="register" action="register" method="post" enctype="application/x-www-form-urlencoded" onsubmit="return validateForm();">
        
            <div class="header" >
                <div class="server-select">
                    <!-- Leaving this here in case we want to have people specifically register for a certain workspace, although
                    	it should be added to the form proper, not up here in a header
                    <label for="server">"${bundle.getString('server')}<br/>":</label>
                    <select id="server" name="workspace" tabindex="99">
                    <c:forEach items="${requestScope.workspaces}" var="workspace">
                        <option value="<c:out value="${workspace['workspaceid']}" />">
                            <c:out value="${workspace['workspacename']}" />
                        </option>
                    </c:forEach>
                    </select>
                     -->
                     
                    <!-- Populating hidden combo with org orgtype mappings -->
                    <select id="orgorgtypes" name="orgorgtypes" hidden="true">
                    <c:forEach items="${requestScope.orgorgtypes}" var="orgorgtype">
                        <option value="<c:out value="${orgorgtype['orgtypeid']}" />">
                            <c:out value="${orgorgtype['orgid']}" />
                        </option>
                    </c:forEach>
                    </select>
                </div>
            </div>
            

            <center>
            <div class="content" style="padding: 4px;">
            	
                <div class="content-wrapper" style="background-color: white; border: 3px solid #003399; padding: 4px" >


                    <center><h2>${bundle.getString('registration')}</h2></center>

                    <div class="field">
                        <div class="textblock">
                   	<h2>${bundle.getString('registration')}</h2>

                            <p>
                                ${bundle.getString('accountReview')}<br/> ${bundle.getString('accountApproved')}
                            </p>
                                ${bundle.getString('requiredFields')}<font style="color:red"> * </font>${bundle.getString('areRequired')}
                            </p>

                            <p>
                                <p>${bundle.getString('regAssistance')}: <c:out value="${requestScope.registerhelp}"/>
                            </p>
                        </div>
			        </div>

			       	<div id="messages" name="messages" style="color:red;border: 2px solid red;padding: 4px" hidden="true"></div>

                    <hr/>         

	            	<div class="field">

	                    <label for="affiliation">${bundle.getString('affiliation')} <font style="color:red">*</font></label>
	                    <br>
	                    <select id="affiliation" name="affiliation" tabindex="1" width="300"
	                    	onChange="filterOrgs(this);">
	                    <option value="0">${bundle.getString('selectAffiliation')}</option>
	                    <c:forEach items="${requestScope.orgtypes}" var="orgtype">
	                        <option value="<c:out value="${orgtype['orgTypeId']}" />">
	                            <c:out value="${orgtype['orgTypeName']}" />
	                        </option>
	                    </c:forEach>
	                    </select>

                        <br>
                        <br>

                        <label for="org">${bundle.getString('selectOrg')} <font style="color:red">*</font></label>
                        <br>
                        <select id="org" name="org" tabindex="2" onChange="setOrg(this);">
                        <option value="0">Please select an Organization</option>
                        <c:forEach items="${requestScope.orgs}" var="org">
                            <option value="<c:out value="${org['orgId']}" />">
                                <c:out value="${org['name']}" />
                            </option>
                        </c:forEach>
                        </select>
                        <input type="hidden" id="selectedOrg" name="selectedOrg" />

                        <br>
                        <br>

                         <div style="font-size: small;">
                             ${bundle.getString('orgAvailable')}
                             <a href="mailto:nicssupport@ll.mit.edu">NICSsupport@LL.MIT.edu</a> ${bundle.getString('orgRequest')}
                         </div>

                     </div>
                    <hr/>

                    <div class="field">

                        <label for="first">${bundle.getString('firstName')}<font style="color:red">*</font></label>
                        <br>
                        <input type="text" id="first" name="first" tabindex="7" />

                    <br><br>
                        <label for="last">${bundle.getString('lastName')}<font style="color:red">*</font></label>
                        <br>
                        <input type="text" id="last" name="last" tabindex="8" />

                    <br><br>
                        <label for="email">${bundle.getString('email')} <font style="color:red">*</font></label>
                        <br>
                        <input type="text" id="email" name="email" tabindex="9"/>
                        <br>
                        <div style="font-size: small; vertical-align: middle">
                            ${bundle.getString('usernameNote')}
                        </div>
                    </div>

                    <hr/>

                    <div class="field">
                    	<div class="textblock">

                    		<strong>${bundle.getString('passwordReq')}</strong><br/> <c:out value="${requestScope.passwordRequirements}"/>
                    		<input type="hidden" id="passwordPattern" value="${requestScope.passwordPattern}"/>
                    	</div>

                        <br><br>
                        <label for="password">${bundle.getString('password')}<font style="color:red">*</font></label>
                        <br>
                        <input type="password" id="password" name="password" maxlength="20" tabindex="10" />

                        <br><br>

                        <label for="confirmPassword">${bundle.getString('confirmPassword')}<font style="color:red">*</font></label>
                        <br>
                        <input type="password" id="confirmPassword" name="confirmPassword" maxlength="20" tabindex="11" />
                    </div>


                    <hr/>

<div class="collapseheader" id="Collapse_Head" onClick="OpenClose('Collapse')" onMouseOver="this.style.cursor='pointer';" style="color: #000099;">
+ ${bundle.getString('showadditionalinfo')}
</div>

<div id="Collapse_Body" style="display:none; margin-left:20px">


                    <div class="field">

                    	<h4><center>${bundle.getString('imt')}</center></h4>
                        <label for="imtCDF">${bundle.getString('imtcdf')}:</label>
                        </br>
                        <select id="imtCDF" name="imtCDF" onchange="setImtCDF(this)" tabindex="3" style="width:300px">
                        <option value="0">${bundle.getString('none')}</option>
                        </select>
                        <input type="hidden" id="imtCDFSelected" name="imtCDFSelected" />

                    <br><br>

                        <label for="imtFederal">${bundle.getString('federalIMT')}:</label>
                        </br>
                        <select id="imtFederal" name="imtFederal" onchange="setImtFederal(this)" tabindex="4" style="width:300px">
                        <option value="0">${bundle.getString('none')}</option>
                        </select>
                        <input type="hidden" id="imtFederalSelected" name="imtFederalSelected" />

                    <br><br>

                        <label for="imtOtherLocal">${bundle.getString('otherIMT')}:</label>
                        </br>
                        <select id="imtOtherLocal" name="imtOtherLocal" onchange="setImtOtherLocal(this)" tabindex="5" style="width:300px">
                        <option value="0">${bundle.getString('none')}</option>
                        </select>
                        <input type="hidden" id="imtOtherLocalSelected" name="imtOtherLocalSelected" />

                     <br><br>

                        <label for="imtUsar">${bundle.getString('usar')}:</label>
                        </br>
                        <select id="imtUsar" name="imtUsar" onchange="setImtUsar(this)" tabindex="6" style="width:300px">
                        <option value="0">${bundle.getString('none')}</option>
                        </select>
                        <input type="hidden" id="imtUsarSelected" name="imtUsarSelected" />
                    </div>

                    <hr/>

                    <div class="field">

                        <label for="phoneMobile">${bundle.getString('mobile')} ${bundle.getString('phone')}:</label>
                        </br>
                        <input type="text" id="phoneMobile" name="phoneMobile" tabindex="12"/>

                        <br><br>

                        <label for="phoneOffice">${bundle.getString('office')} ${bundle.getString('phone')}:</label>
                        </br>
                        <input type="text" id="phoneOffice" name="phoneOffice" tabindex="13"/>

                        <br><br>

                        <label for="phoneOther">${bundle.getString('other')} ${bundle.getString('phone')}:</label>
                        </br>
                        <input type="text" id="phoneOther" name="phoneOther" tabindex="14"/>
                    </div>

                    <hr/>

                    <div class="field">

                        <label for="radio">${bundle.getString('radio')}:</label>
                        </br>
                        <input type="text" id="radio" name="radio" tabindex="15" maxlength="128"/>

                    <br><br>
                        <label for="emailOther">${bundle.getString('otherEmail')}:</label>
                        </br>
                        <input type="text" id="emailOther" name="emailOther" tabindex="16"/>
                    </div>

                    <hr/>

                    <div class="field">

	                    <label for="jobTitle">${bundle.getString('jobTitle')}:</label>
	                    </br>
	                    <input type="text" id="jobTitle" name="jobTitle" tabindex="17" maxlength="128"/>

                        <br><br>

	                    <label for="rank">${bundle.getString('rank')}:</label>
	                    </br>
                        <input type="text" id="rank" name="rank" tabindex="18" maxlength="128"/>

                    <br/><br/>

                        <label for="description">${bundle.getString('jobDescription')}:</label><br/>
                        <textarea id="description" name="description" cols="60" rows="5" tabindex="19" maxlength="250"></textarea><br/>

	                </div>

	                <hr/>

                    <div class="field">
                    	<label for="other">${bundle.getString('otherInfo')}:</label><br/> <!-- style="width:80%;height:100px" -->
                    	<textarea id="other" name="other" tabindex="20" cols="60" rows="8" ></textarea>
                    </div>
                    
                    <br>
</div>  <!-- end collapse -->


					<c:if test="${requestScope.useCaptcha}">
                    	<div class="g-recaptcha" data-sitekey="${requestScope.dataSiteKey}"></div>
					</c:if>

                     </br>
                     <center>
                        <button type="submit" tabindex="21" style="height: 40px; width: 120px; margin-bottom: 30px">${bundle.getString('register')}</button>
                    </center>

                </div>
            </div>
            <br/><br/>
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
            </div></center>  <!-- content -->
        </div>  <!-- wrapper -->
    </body>    
</html>