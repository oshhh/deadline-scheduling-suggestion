const BUTTON_CLASS = "U26fgb cd29Sd p0oLxb BEAGS CG2qQ QRiHXd bVp04e block";
const HEADING_CLASS = "gtuckc tLDEHd-Wvd9Cc";

var duration_div = document.createElement("div");
duration_div.className = "block";

var duration_title = document.createElement("p");
var duration_title_text = document.createTextNode("Duration");
duration_title.appendChild(duration_title_text);
duration_title.className = HEADING_CLASS;

var duration_input = document.createElement("div");

duration_div.appendChild(duration_title);
duration_div.appendChild(duration_input);

labels = ["days:", "hours:"];
for (var i = 0; i < 2; ++i) {
  var input_div = document.createElement("div");
  input_div.className = "horizontal";

  var input = document.createElement("input");
  input.className = "input";
  input.type = "number";
  input.min = "0";
  input.style.width = "70px";
  input.id = labels[i];
  if (i == 1) {
    input.max = 23;
  }

  var label = document.createElement("label");
  var text = document.createTextNode(labels[i]);
  label.appendChild(text);

  input_div.appendChild(label);
  input_div.appendChild(input);
  duration_input.appendChild(input_div);
}

//maximum date
var max_due_date = document.createElement("div");

var max_due_date_title = document.createElement("p");
var max_due_date_title_text = document.createTextNode("Maximum Due Date");
max_due_date_title.appendChild(max_due_date_title_text);
max_due_date_title.className = HEADING_CLASS;

var max_due_date_input = document.createElement("input");
max_due_date_input.className = "input";
max_due_date_input.type = "date";
max_due_date_input.min = new Date().toISOString().split("T")[0];

max_due_date.appendChild(max_due_date_title);
max_due_date.appendChild(max_due_date_input);
//maximum date over

//release date
var release_date_left = document.createElement("div");

var release_date_left_title = document.createElement("p");
var release_date_left_title_text = document.createTextNode("Release date");
release_date_left_title.appendChild(release_date_left_title_text);
release_date_left_title.className = HEADING_CLASS;

var release_date_left_input = document.createElement("input");
release_date_left_input.className = "input";
release_date_left_input.type = "date";
release_date_left_input.min = new Date().toISOString().split("T")[0];

release_date_left.appendChild(release_date_left_title);
release_date_left.appendChild(release_date_left_input);
//release date over

var s_date_left = document.createElement("div");

var s_date_left_title = document.createElement("p");
var s_date_left_title_text = document.createTextNode("Suggested Start date");
s_date_left_title.appendChild(s_date_left_title_text);
s_date_left_title.className = HEADING_CLASS;

var s_date_left_input = document.createElement("input");
s_date_left_input.className = "input";
s_date_left_input.type = "date";
s_date_left_input.min = new Date().toISOString().split("T")[0];

s_date_left.appendChild(s_date_left_title);
s_date_left.appendChild(s_date_left_input);

var schedule_button = document.createElement("div");
var schedule_button_div = document.createElement("div");
schedule_button_div.className = "GcVcmc Fxmcue cd29Sd";
var schedule_button_text = document.createTextNode("Get Due Date Suggestions");

schedule_button_div.appendChild(schedule_button_text);
schedule_button.appendChild(schedule_button_div);
schedule_button.className = BUTTON_CLASS;
schedule_button.addEventListener("click", function () {
  console.log(release_date_left_input.value);
  labels.forEach(lbl => {
    console.log(lbl + document.getElementById(lbl).value);
  })
  console.log(max_due_date_input.value);
  console.log(release_date_input.value);
  console.log(s_date_left_input.value);
})

let observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (!mutation.addedNodes) return;
    observer.disconnect();
    for (let i = 0; i < mutation.addedNodes.length; i++) {
      // do things to your newly added nodes here
      let node = mutation.addedNodes[i];
      if (node.className == HEADING_CLASS && node.childNodes[0].data == "Due") {
        head = node;
        setTimeout(() => {
          let parent = node.parentNode;
          parent.insertBefore(duration_div, node);
          parent.insertBefore(max_due_date, node);
          parent.insertBefore(release_date_left, node);
          parent.insertBefore(s_date_left, node);
          parent.insertBefore(schedule_button, node);
        }, 300);
      }
    }

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true,
    });
  });
});

observer.observe(document.body, {
  childList: true,
  subtree: true,
  attributes: true,
  characterData: true,
});