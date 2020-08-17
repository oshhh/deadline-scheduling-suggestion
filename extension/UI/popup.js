var popup = document.createElement("div");
popup.className = "popup";

var script = document.createElement("script");
script.src = "https://apis.google.com/js/api.js";
script.onload="this.onload=function(){};handleClientLoad()";
script.onreadystatechange="if (this.readyState === 'complete') this.onload()";
document.body.appendChild(script);

var form = document.createElement("form");
var title = document.createElement("div");
var title_label = document.createElement("label");
var title_label_text = document.createTextNode("Title");
title_label.appendChild(title_label_text);
var title_input = document.createElement("input");
title_input.type = "text";

title.appendChild(title_label);
title.appendChild(title_input);

form.appendChild(title);

popup.appendChild(form);
popup.style.display = "none";

document.body.appendChild(popup);

var popup = document.createElement("div");


var CLIENT_ID = '669436669321-kcl1strmp7vduf56np3ibora8i1g1j3n.apps.googleusercontent.com';
var API_KEY = 'AIzaSyCZCZjesdahXgr8vrxNmy-oAuX8Yya4d8U';
var DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/classroom/v1/rest"];
var SCOPES = "https://www.googleapis.com/auth/classroom.courses";

function handleClientLoad() {
    gapi.load('client:auth2', initClient);
  }
function initClient() {
	gapi.client.init({
		apiKey: API_KEY,
		clientId: CLIENT_ID,
		discoveryDocs: DISCOVERY_DOCS,
		scope: SCOPES
	}).then(async function () {
		// Listen for sign-in state changes.
		gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);
		gapi.auth2.getAuthInstance().signIn();
		console.log("loading");
		var response = await gapi.client.classroom.courses.list({
			pageSize: 10
		});
		var courses = response.result.courses;
		console.log(courses);
	}, function(error) {
	  appendPre(JSON.stringify(error, null, 2));
	});
}

async function openPopup() {
	popup.style.display = "block";
	console.log("popup opened");
}

function closePopup() {
	popup.style.display = "none";
	console.log("popup closed");
}