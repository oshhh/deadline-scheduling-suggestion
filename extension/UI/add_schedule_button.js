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
  console.log(release_date_left_input.value);
  console.log(s_date_left_input.value);
  console.log(course_name);
})

//drop down for suggestions
var drop_down = document.createElement('div');
drop_down.className = 'dropdown';
var button = document.createElement('button');
button.className = 'dropbtn';
var btntext = document.createTextNode('Suggestions');
button.appendChild(btntext);
drop_down.appendChild(button);
var drop_down_content = document.createElement('div');
drop_down_content.className = 'dropdown-content';
drop_down.appendChild(drop_down_content);
var list_item1 = document.createElement('span');
var list_item1_text = document.createTextNode('1) dd/mm/yyyy');
list_item1.appendChild(list_item1_text);
drop_down_content.appendChild(list_item1);
var list_item2 = document.createElement('span');
var list_item2_text = document.createTextNode('2) dd/mm/yyyy');
list_item2.appendChild(list_item2_text);
drop_down_content.appendChild(list_item2);
var list_item3 = document.createElement('span');
var list_item3_text = document.createTextNode('3) dd/mm/yyyy');
list_item3.appendChild(list_item3_text);
drop_down_content.appendChild(list_item3);
button.className = BUTTON_CLASS;

//course name input
// var course_name = document.createElement("div");
// var course_name_title = document.createElement("p");
// var course_name_title_text = document.createTextNode("Enter your course name");
// course_name_title.appendChild(course_name_title_text);
// course_name_title.className = HEADING_CLASS;
// var course_name_input = document.createElement("input");
// course_name_input.className = "input";
// course_name_input.type = "text";
// course_name.appendChild(course_name_title);
// course_name.appendChild(course_name_input);

var course_name;

let observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (!mutation.addedNodes) return;
    observer.disconnect();
    for (let i = 0; i < mutation.addedNodes.length; i++) {
      let node = mutation.addedNodes[i];
      if (node.className == 'tNGpbb uTUgB YVvGBb') {
        course_name = node.textContent;
      }
      if (node.className == HEADING_CLASS && node.childNodes[0].data == "Due") {
        head = node;
        setTimeout(() => {
          let parent = node.parentNode;
          //parent.insertBefore(course_name, node);
          parent.insertBefore(duration_div, node);
          parent.insertBefore(max_due_date, node);
          parent.insertBefore(release_date_left, node);
          parent.insertBefore(schedule_button, node);
          parent.insertBefore(drop_down, node);
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
