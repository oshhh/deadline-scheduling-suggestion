var iiitd_assignment_option = document.createElement("span");
iiitd_assignment_option.className = "z80M1 FeRvI";

var iiitd_assignment_icon = document.createElement("div");
iiitd_assignment_icon.className = "PCdOIb Ce1Y1c";
var iiitd_assignment_icon_img = document.createElement("img");
iiitd_assignment_icon_img.className = "mxmXhf NMm5M hhikbc";
iiitd_assignment_icon_img.setAttribute("width", "24");
iiitd_assignment_icon_img.setAttribute("height", "24");
iiitd_assignment_icon_img.setAttribute("viewBox", "0 0 24 24");
iiitd_assignment_icon_img.setAttribute("focusable", "false");
iiitd_assignment_icon_img.setAttribute("src", "https://cdn0.iconfinder.com/data/icons/business-management-2-9/64/102-512.png");
iiitd_assignment_icon.appendChild(iiitd_assignment_icon_img);

var iiitd_assignment_title = document.createElement("div");
iiitd_assignment_title.className = "uyYuVb oJeWuf";
var iiitd_assignment_title_div = document.createElement("div");
iiitd_assignment_title_div.className = "jO7h3c";
var iiitd_assignment_title_text = document.createTextNode("IIITD Assignment");
iiitd_assignment_title_div.appendChild(iiitd_assignment_title_text);
iiitd_assignment_title.appendChild(iiitd_assignment_title_div);

iiitd_assignment_option.appendChild(iiitd_assignment_icon);
iiitd_assignment_option.appendChild(iiitd_assignment_title);
iiitd_assignment_option.addEventListener("mouseenter", iiitd_assignment_mouse_enter);
iiitd_assignment_option.addEventListener("mouseleave", iiitd_assignment_mouse_leave);
iiitd_assignment_option.addEventListener("click", iiitd_assignment_click);

function iiitd_assignment_mouse_enter() {
	iiitd_assignment_option.className = "z80M1 FeRvI FwR7Pc";
	console.log("mouse enter");
}

function iiitd_assignment_mouse_leave() {
	iiitd_assignment_option.className = "z80M1 FeRvI";
	console.log("mouse leave");
}

function iiitd_assignment_click() {
	console.log("click");
	duration = {"date": 1, "hours": 0, "minutes": 0};
	minDueDate = new Date();
	maxDueDate = new Date();
	maxDueDate.setDate(maxDueDate.getDate() + 3);

	suggestDueDate(duration, minDueDate, maxDueDate, (suggestions) => {
		console.log(suggestions);
	});
}
