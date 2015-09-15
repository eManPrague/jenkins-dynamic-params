/*

eMan Jenkins dynamic parameters script
--------------------------------------

Script for simulating dynamic parameters for Jenkins jobs.
author: Stanislav Nováček, eMan, s.r.o.

This script extracts all needed parameter settings and other
needed configuration stuff from <div id="EMAN_CONFIGURATION_DIV">,
therefore all configuration should be placed there.


Configuration div example: (without formating for easy copy & paste)
--------------------------

<div id="EMAN_CONFIGURATION_DIV">

<!-- Preset buttons -->
<!-- 'title': button title -->
<!-- 'params': semicolon separated colon separated param:value -->

<presetbutton title="DEV" params="BRANCH:DEV" ></presetbutton>
<presetbutton title="UAT" params="BRANCH:UAT" ></presetbutton>
<presetbutton title="RC" params="BRANCH:RC" ></presetbutton>
<presetbutton title="HF" params="BRANCH:HF" ></presetbutton>


<!-- Params names map -->
<!-- 'name': name of parameter -->
<!-- 'displayname': text to be displayed instead -->
<!-- 'inappname': what to expect to be shown in the app version string -->
<!-- 'hidden': can be omitted, 1 for hidden, user cannot manipulate the parameter, it's manipulated via script -->

<paramspec name="BRANCH" displayname="Branch" inappname=""></paramspec>
<paramspec name="EM_BA" displayname="Api backed" inappname="BA"></paramspec>
<paramspec name="EM_PA" displayname="Parse" inappname="PA"></paramspec>
<paramspec name="EM_GA" displayname="Google Analytics" inappname="GA"></paramspec>
<paramspec name="EM_FA" displayname="Flurry" inappname="FA"></paramspec>
<paramspec name="EM_FB" displayname="Facebook" inappname="FB"></paramspec>
<paramspec name="EM_LG" displayname="Logging" inappname="LG"></paramspec>
<paramspec name="EM_HA_ID" displayname="Hockey App ID" inappname="HA"></paramspec>
<paramspec name="EM_HA_DEST" displayname="Hockey App Bundle" inappname=""></paramspec>
<paramspec name="EM_PROFILE" displayname="Provisioning profile" inappname=""></paramspec>
<paramspec name="EM_STORE_VERSION" displayname="" inappname="" hidden="1"></paramspec>


<!-- Params value:option map -->
<!-- 'names': comma separated names of parameters -->
<!-- 'values': comma separated values that should be replaced -->
<!-- 'options': semicolon separated options, same order as values -->
<!-- Can use multiple tags for 1 parameter -->

<optionvalue names="EM_BA" values="0" options="Produkční - https://app.eman.cz/api/prod" ></optionvalue>
<optionvalue names="EM_BA" values="1" options="Prepro - https://app.client.cz/api/prepro" ></optionvalue>
<optionvalue names="EM_BA" values="2" options="Apiary - wtf.apiary.io" ></optionvalue>
<optionvalue names="EM_BA" values="3" options="Test - https://app.eman.cz/api/test" ></optionvalue>
<optionvalue names="EM_PA,EM_GA,EM_FA,EM_FB" values="0,1" options="Produkční;Testovací" ></optionvalue>
<optionvalue names="EM_LG" values="0,1" options="Ne;Ano" ></optionvalue>
<optionvalue names="EM_HA_ID,EM_HA_DEST" values="0,1,2" options="App Store hockey;Beta hockey;Prepro hockey" ></optionvalue>
<optionvalue names="EM_PROFILE" values="0,1,2" options="App Store;Ad Hoc;Devel" ></optionvalue>


<!-- Dependencies -->
<!-- 'dependencies': comma separated values, starts with most important --> 
<!-- 'dependency': semicolon separated colon separated key:value -->

<dep name="EM_BA" dependencies="BRANCH" BRANCH="DEV:3;UAT:1;RC:0;HF:1" ></dep>
<dep name="EM_PA" dependencies="BRANCH" BRANCH="DEV:1;UAT:1;RC:0;HF:1" ></dep>
<dep name="EM_GA" dependencies="BRANCH" BRANCH="DEV:1;UAT:1;RC:0;HF:1" ></dep>
<dep name="EM_FA" dependencies="BRANCH" BRANCH="DEV:1;UAT:1;RC:0;HF:1" ></dep>
<dep name="EM_FB" dependencies="BRANCH" BRANCH="DEV:1;UAT:1;RC:0;HF:1" ></dep>
<dep name="EM_LG" dependencies="BRANCH" BRANCH="DEV:1;UAT:0;RC:0;HF:1" ></dep>
<dep name="EM_HA_ID" dependencies="BRANCH" BRANCH="DEV:1;UAT:2;RC:0;HF:2" ></dep>
<dep name="EM_HA_DEST" dependencies="BRANCH" BRANCH="DEV:1;UAT:2;RC:0;HF:2" ></dep>
<dep name="EM_PROFILE" dependencies="BRANCH" BRANCH="DEV:2;UAT:1;RC:0;HF:1" ></dep>
<dep name="EM_STORE_VERSION" dependencies="STORE_VERSION_CHECK_ID" STORE_VERSION_CHECK_ID="true:1;false:0"></dep>


<!-- Store configuration -->
<!-- Settings for store configuration -->
<storeconf params="EM_BA,EM_PA,EM_GA,EM_FA,EM_FB,EM_LG,EM_HA_ID,EM_HA_DEST,EM_PROFILE" values="0,0,0,0,0,0,0,0,0"></storeconf>


</div>

*/

// Global params and constrants
// Params
var PARAMS_TO_HIDE = ["EMAN_DEPENDENCIES", "EMAN_MAIN_SCRIPT"];
var EM_ACC_PARAM = "EM_STORE_ACC";
var EM_PASS_PARAM = "EM_STORE_PASS";
// Configuration
var CONFIGURATION_DIV_ID = "#EMAN_CONFIGURATION_DIV";
// Presets
var PRESETS_DIV_ID = "#EMAN_PRESETS_DIV";
// Store checks
var CHECKBOX_DIV_ID = "#CHECKBOX_DIV_ID";
var STORE_VERSION_CHECK_ID = "#STORE_VERSION_CHECK_ID";
var STORE_UPLOAD_CHECK_ID = "#STORE_UPLOAD_CHECK_ID";
var STORE_VERSION_CHECK_TITLE = "Store version <i>- original icon and no badge</i>";
var STORE_UPLOAD_CHECK_TITLE = "Upload to the Store";
// Store fields
var STORE_ACC_FIELD_ID = "#STORE_ACC_FIELD_ID";
var STORE_PASS_FIELD_ID = "#STORE_PASS_FIELD_ID";
// Maps
var PARAMETERS_MAP = {}; // map of parameters specs
var DEPENDENCIES_MAP = {}; // map of <dep> tags from configuration div
var PRESETS_MAP = {}; // map of <presetbutton> tags
var STORE_CONFIGURATION_MAP = {};

// Starting point
jQuery(document).ready(function() {
	setupParametersMap(); // create spec for every param in <paramspec> tag
	hideScriptPropertiesNames(); // hides the rependencies and script fields
	prepareCheckBoxDiv();
	setupStoreConfigurationMap();
	updateDisplayOptions(); /// replaces display name of values in select elements
	setupDependenciesMap(); // map of all dependencies
	assignEventsToDependencies();
	updateParameterDisplayNames(); // replaces display names for parameters
	createPresetButtons();

	triggerFirstButton();
});

// Helper functions
function hideScriptPropertiesNames() {
	PARAMS_TO_HIDE.map(function(prop){
		var td = jQuery('td.setting-name:contains("'+ prop +'")').first();
		td.html("");
		td.parent().parent().css("display", "none"); // td -> tr -> tbody
	});
}

function setupParametersMap() {
	jQuery(CONFIGURATION_DIV_ID).children("paramspec").each(function(){
		var spec = {};
		spec["displayname"] = this.getAttribute("displayname");
		spec["inappname"] = this.getAttribute("inappname");
		PARAMETERS_MAP[this.getAttribute("name")] = spec;
		var hidden = this.getAttribute("hidden");
		if (hidden && hidden.toString() == "1") {
			PARAMS_TO_HIDE.push(this.getAttribute("name"));
		}
	});
}

function setupStoreConfigurationMap() {
	jQuery(CONFIGURATION_DIV_ID).children("storeconf").each(function(){
		var params = this.getAttribute("params").split(",");
		var values = this.getAttribute("values").split(",");
		if (params.length != values.length) {
			alert("Bad store configuration. Params and values have different count.");
		} else {
			jQuery.each(params, function(index, parameterName){
				STORE_CONFIGURATION_MAP[parameterName] = values[index];
			});
			console.log("Store configuration:");
			console.log(STORE_CONFIGURATION_MAP);
		}
	});
}

function updateParameterDisplayNames() {
	Object.keys(PARAMETERS_MAP).each(function(name){
		var spec = specForParameter(name);
		jQuery('td.setting-name:contains("'+ name +'")').first().html(spec["displayname"]);
	});
}

function updateDisplayOptions() {
	jQuery(CONFIGURATION_DIV_ID).children("optionvalue").each(function(){processOptionValue(this)});

	function processOptionValue(optionValue) {
		if (optionValue == null) {
			console.log("Skipping null option value"); 
			return; 
		}

		var names = optionValue.getAttribute("names").split(",");
		var values = optionValue.getAttribute("values").split(",");
		var options = optionValue.getAttribute("options").split(";");
		names.map(function(name){
			var select = getSelectForParameter(name);
			jQuery.each(values, function(index, value){
				var inappName = PARAMETERS_MAP[name]["inappname"];
				var prefix = inappName == "" ? "" : inappName + index + " ";
				select.find("option[value=" + value + "]").text(prefix + options[index]);
			});
		});
	}
}

function setupDependenciesMap() {
	jQuery(CONFIGURATION_DIV_ID).children("dep").each(function(){processDepencency(this)});

	function processDepencency(dep) {
		if (dep == null) {
			console.log("Skipping null dependency"); 
			return; 
		}

		var name = dep.getAttribute("name");
		var deps = dep.getAttribute("dependencies").split(",");
		var depsMap = {};
		console.log(name + " has dependencies: " + deps);

		deps.reverse().map(function(attr){ 
			var lowerCaseAttr = attr.toLowerCase();
			var casesString = dep.getAttribute(lowerCaseAttr);
			var caseMap = {};
			if (casesString != null) {
				console.log("dependency " + attr + " has cases: " + casesString);
				var cases = casesString.split(";"); // e.g. ["DEV:0", "UAT:1", ...]
				cases.map(function(c){
					var split = c.split(":")
					caseMap[split[0]] = split[1];
				});
			}
			if (DEPENDENCIES_MAP[attr] == null) { DEPENDENCIES_MAP[attr] = {}; };
			DEPENDENCIES_MAP[attr][name] = caseMap;
		});
	}
	console.log("Final dependencies map:");
	console.log(DEPENDENCIES_MAP);
}

function assignEventsToDependencies() {
	Object.keys(DEPENDENCIES_MAP).each(function(name){
		// Explicit check for dynamically created elements
		var element = getSelectForParameter(name);
		if (name == sanitizedID(STORE_VERSION_CHECK_ID)) {
			element = jQuery(STORE_VERSION_CHECK_ID);
		}
		if (name == sanitizedID(STORE_ACC_FIELD_ID)) {
			element = jQuery(STORE_ACC_FIELD_ID);
		}
		if (name == sanitizedID(STORE_PASS_FIELD_ID)) {
			element = jQuery(STORE_PASS_FIELD_ID);
		}
		element.attr("paramname", name);
		element.change(onDependencyChange);
		console.log("Assigned paramname " + name + " and onchange event for " + name + ":");
		console.log(element);
	});
}

function createPresetButtons() {
	jQuery(PRESETS_DIV_ID).html("");
	jQuery(CONFIGURATION_DIV_ID).children("presetbutton").each(function(){
		// Create button
		var name = this.getAttribute("title");
		var params = this.getAttribute("params").split(";");
		var button = jQuery("<button/>").text(name).click(presetButtonClicked);
		button.attr("buttonid", name);
		// Cache stuff
		var paramsMap = {};
		params.each(function(parameterName){
			var split = parameterName.split(":");
			paramsMap[split[0]] = split[1];
		});
		PRESETS_MAP[name] = paramsMap;
		// Append html
		jQuery(PRESETS_DIV_ID).append(button);
	});
}

function onDependencyChange(event) {
	var element = event.target;
	var selectedValue = "";
	var parameterName = getParameterNameForElement(element);
	// Explicit check for dynamically created elements
	var id = element.getAttribute("id");
	if (id && id == sanitizedID(STORE_VERSION_CHECK_ID)) {
		selectedValue = element.checked;
	} else {
		// Explicit check for BRANCH parameter
		drawChecksIfNeeded(element);
		if (element.nodeName = "INPUT") {
			// Acc or pass fields
			selectedValue = element.value;
		} else {
			// Select element
			selectedValue = element.options[element.selectedIndex].text;
		}
	}
	updateDependenciesForParameterChange(parameterName, selectedValue);
}

function updateDependenciesForParameterChange(parameterName, selectedValue) {
	console.log("Updating dependencies triggered by " + parameterName + " with selected value: " + selectedValue);
	var dependenciesForParam = DEPENDENCIES_MAP[parameterName];
	Object.keys(dependenciesForParam).each(function(key){
		var dependencyMap = dependenciesForParam[key];
		if (parameterName == sanitizedID(STORE_ACC_FIELD_ID)) {
			// Acc 
			jQuery("input[value='" + key + "']").first().next().html(selectedValue);
		} else if (parameterName == sanitizedID(STORE_PASS_FIELD_ID)) {
			// Pass
			jQuery("input[value='" + key + "']").first().next().attr("value", selectedValue);
		} else {
			Object.keys(dependencyMap).each(function(depKey){
				if (selectedValue.toString().indexOf(depKey) >= 0) {
					var select = getSelectForParameter(key);
					var valueToSelect = dependencyMap[depKey].toString();
					select.val(valueToSelect);
				};
			});
		}
	});
}

function presetButtonClicked(event) {
	event.preventDefault();
	var buttonID = getButtonID(event.target);
	var params = PRESETS_MAP[buttonID];
	Object.keys(params).each(function(parameterName){
		var select = getSelectForParameter(parameterName);
		var valueToSelect = select.find("option:contains(" + buttonID + ")").first().val();
		select.val(valueToSelect);
		select.trigger("change");
	});
}

function prepareCheckBoxDiv() {
	// Container
	var html = "<div id=" + sanitizedID(CHECKBOX_DIV_ID) + "></div>";
	getSelectForParameter("BRANCH").parent().append(html);
	var checkBoxDiv = jQuery(CHECKBOX_DIV_ID);

	// Check boxes
	var storeCheckID = sanitizedID(STORE_VERSION_CHECK_ID);
	var uploadCheckID = sanitizedID(STORE_UPLOAD_CHECK_ID);

	checkBoxDiv.append("<span style='display:block;'></span>");
	var checkBox1 = createCheck(storeCheckID, checkChanged);
	checkBox1.appendTo(checkBoxDiv);
	checkBoxDiv.append(labelHTMLwithText(STORE_VERSION_CHECK_TITLE, storeCheckID));

	checkBoxDiv.append("<span style='display:block;'></span>");
	var checkBox2 = createCheck(uploadCheckID, checkChanged);
	checkBox2.appendTo(checkBoxDiv);
	checkBoxDiv.append(labelHTMLwithText(STORE_UPLOAD_CHECK_TITLE, uploadCheckID));

	// Input fields
	// Email
	checkBoxDiv.append("<span style='display:block;'></span>");
	checkBoxDiv.append(labelHTMLwithText("Account: ", sanitizedID(STORE_ACC_FIELD_ID)));
	var email = jQuery("<input/>", {type:"email", id:sanitizedID(STORE_ACC_FIELD_ID), change:emailChanged});
	email.appendTo(checkBoxDiv);

	// Password
	checkBoxDiv.append("<span style='display:block;'></span>");
	checkBoxDiv.append(labelHTMLwithText("Password: ", sanitizedID(STORE_PASS_FIELD_ID)));
	var pass = jQuery("<input/>", {type:"password", id:sanitizedID(STORE_PASS_FIELD_ID), change:passwordChanged});
	pass.appendTo(checkBoxDiv);
}

function emailChanged(event) {
	console.log("mail");
}

function passwordChanged(event) {
	console.log("pass");
}

function drawChecksIfNeeded(element) {
	if (getParameterNameForElement(element) == "BRANCH") {
		var select = jQuery("select[paramname=BRANCH]");
		var drawStoreVersionCheck = select.find("option:selected").text().indexOf("RC") >= 0;
		showStoreCheck(drawStoreVersionCheck);
		showUploadCheck(false);
		showAccFields(false);

		storeCheck().prop("checked", false);
		uploadCheck().prop("checked", false);
		uploadCheck().trigger("change");
		storeCheck().trigger("change");
	};
}

function createCheck(id, onchange) {
	var checkBox = jQuery('<input/>', { type:'checkbox', change: onchange});
	checkBox.attr("id", id);
	return checkBox;
}

function labelHTMLwithText(text, id) {
	return  "<label style='min-width:70px;display:inline-block;' for=" + id + ">" + text + "</label>";
}

function storeLabel() {
	return jQuery("label[for=" + sanitizedID(STORE_VERSION_CHECK_ID) + "]");
}

function uploadLabel() {
	return jQuery("label[for=" + sanitizedID(STORE_UPLOAD_CHECK_ID) + "]");
}

function storeCheck() {
	return jQuery(STORE_VERSION_CHECK_ID);
}

function uploadCheck() {
	return jQuery(STORE_UPLOAD_CHECK_ID);
}

function showStoreCheck(show) {
	show ? storeCheck().show() : storeCheck().hide();
	show ? storeLabel().show() : storeLabel().hide();
}

function showUploadCheck(show) {
	show ? uploadCheck().show() : uploadCheck().hide();
	show ? uploadLabel().show() : uploadLabel().hide();
}

function showAccFields(show) {
	var labelAcc = jQuery("label[for=" + sanitizedID(STORE_ACC_FIELD_ID) + "]");
	var labelPass = jQuery("label[for=" + sanitizedID(STORE_PASS_FIELD_ID) + "]");
	var fieldAcc = jQuery(STORE_ACC_FIELD_ID);
	var fieldPass = jQuery(STORE_PASS_FIELD_ID);

	show ? labelAcc.show() : labelAcc.hide();
	show ? labelPass.show() : labelPass.hide();
	show ? fieldAcc.show() : fieldAcc.hide();
	show ? fieldPass.show() : fieldPass.hide();
	// In any case clear the fields
	fieldAcc.val("");
	fieldPass.val("");
}

function checkChanged(event) {
	var check = event.target;
	var isUpload = check.getAttribute("id") == sanitizedID(STORE_UPLOAD_CHECK_ID);
	if (!isUpload) {
		showUploadCheck(check.checked);
		if (check.checked) {
			getSelectForParameter("EM_HA_ID").val(STORE_CONFIGURATION_MAP["EM_HA_ID"]);
			getSelectForParameter("EM_HA_DEST").val(STORE_CONFIGURATION_MAP["EM_HA_DEST"]);
		} else {
			uploadCheck().attr("checked", false);
			uploadCheck().trigger("change");
		}
	} else {
		// Show/hide fields
		showAccFields(check.checked);
		// Set App Store configuration and disable controls
		Object.keys(STORE_CONFIGURATION_MAP).each(function(key){
			var select = getSelectForParameter(key);
			select.val(STORE_CONFIGURATION_MAP[key]);
			check.checked ? select.attr("disabled", "disabled") : select.removeAttr("disabled");
		});
	}
}

function getParameterNameForElement(select) {
	return select.getAttribute("paramname");
}

function getButtonID(button) {
	return button.getAttribute("buttonid");
}

function getSelectForParameter(parameterName) {
	return jQuery("input[value='" + parameterName + "']").first().siblings("select").first();
}

function specForParameter(parameterName) {
	return PARAMETERS_MAP[parameterName];
}

function sanitizedID(id) {
	return id.replace("#", "");
}

function triggerFirstButton() {
	jQuery(PRESETS_DIV_ID).find("button").first().trigger("click");
}

