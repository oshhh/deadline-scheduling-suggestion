var fetch_events = require("./fetch_events.js");

/*
	~~ Parameters ~~
	duration: datatype - JSON, format - {date: .., hours: .., minutes: ..}
	minDueDate: datatype - Date
	maxDueDate: datatype - Date
	students: datatype - list of JSON, format - list of JSON {"roll_no": .., "courses": ..}
*/
function suggestDueDate(duration, minDueDate, maxDueDate, students, callback) {
	fetch_events.getAllEvents(minDueDate, (allCourseWork) => {
		var commonStudents = {};
		for(var i = 0; i < students.length; ++ i) {
			for(var j = 0; j < students[i]["courses"].length; ++ j) {
				if(commonStudents[students[i]["courses"][j]] == null) {
					commonStudents[students[i]["courses"][j]] = 0;
				}
				commonStudents[students[i]["courses"][j]] ++;
			}
		}

		// for each date call calculateScore and order suggestions score 
		suggestion = new Date(minDueDate);
		lastDate = new Date(maxDueDate);
		lastDate.setDate(lastDate.getDate() - duration.date);
		lastDate.setHours(lastDate.getHours() - duration.hours);
		lastDate.setMinutes(lastDate.getMinutes() - duration.minutes);

		var suggestions = [];

		while(suggestion <= lastDate) {
			var start_date = new Date(suggestion);
			var end_date = new Date(suggestion);
			end_date.setDate(end_date.getDate() + duration.date);
			end_date.setHours(end_date.getHours() + duration.hours);
			end_date.setMinutes(end_date.getMinutes() + duration.minutes);
			suggestions.push({
				start_date: start_date,
				end_date: end_date,
				clash: calculateScore(start_date, end_date, allCourseWork, commonStudents)
			});
			suggestion.setDate(suggestion.getDate() + 1);
		}
		suggestions.sort((a, b) => {return a.clash.score - b.clash.score;});
		callback(suggestions);
	});
}
/*
	~~ Parameters ~~
	start_date: datatype - Date
	end_date: datatype - Date
	allCourseWork: datatype - list of courseWorks, format - {course_name: .., coursework_name: .., start_date: (datatype - Date), end_date: (datatype - Date)}
	commonStudents: datatype - JSON, format - {courseName: studentCount}
*/

function calculateScore(start_date, end_date, allCourseWork, commonStudents) {
	var score = 0;
	var reason = [];
	for(var i = 0; i < allCourseWork.length; ++ i) {
		var courseWork = allCourseWork[i];
		score += commonStudents[courseWork.course_name] * fractionalOverlap(start_date, end_date, courseWork.start_date, courseWork.end_date);
		if(fractionalOverlap(start_date, end_date, courseWork.start_date, courseWork.end_date) != 0) {
			reason.push(courseWork);
		}
	}
	return {score: score, reason: reason};
}

function fractionalOverlap(c1_startDate, c1_endDate, c2_startDate, c2_endDate) {
	// console.log(`${c1_startDate} ${c1_endDate} ${c2_startDate} ${c2_endDate}`);
	if(c1_startDate >= c2_endDate || c2_startDate > c1_endDate) return 0;
	if(c1_endDate >= c2_endDate && c1_startDate <= c2_endDate) {
		return 1;
	}
	if(c1_startDate < c2_startDate) {
		return (c1_endDate - c2_startDate)/(c2_endDate - c2_startDate);
	} else {
		return (c2_endDate - c1_startDate)/(c2_endDate - c1_startDate);
	}
}

students = [{"roll_no": "S1", "courses": ["course 1", "course 2", "course 3"]}, {"roll_no": "S2", "courses" : ["course 1", "course 3", "course 4"]}];
duration = {"date": 1, "hours": 0, "minutes": 0};
minDueDate = new Date();
maxDueDate = new Date();
maxDueDate.setDate(maxDueDate.getDate() + 3);

suggestDueDate(duration, minDueDate, maxDueDate, students, (suggestions) => {
	console.log(suggestions);
});


module.exports = {
  suggestDueDate: suggestDueDate
};