var popup = document.createElement("div");
popup.className = "popup"

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

function openPopup() {
	popup.style.display = "block";
	console.log("popup opened");
}

function closePopup() {
	popup.style.display = "none";
	console.log("popup closed");
}