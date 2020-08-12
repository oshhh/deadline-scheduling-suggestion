/*
	~~ Parameters ~~
	duration: datatype - JSON, format - {date: .., hours: .., minutes: ..}
	minDueDate: datatype - Date
	maxDueDate: datatype - Date
	allCourseWork: datatype - list of courseWorks, format - courseWork.startDate (datatype - Date), courseWork.endDate (datatype - Date)
	students: datatype - list of JSON, format - list of JSON {"roll_no": .., "courses": ..}
*/
function suggestDueDate(duration, minDueDate, maxDueDate, allCourseWork, students) {
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
		var startDate = new Date(suggestion);
		var endDate = new Date(suggestion);
		endDate.setDate(endDate.getDate() + duration.date);
		endDate.setHours(endDate.getHours() + duration.hours);
		endDate.setMinutes(endDate.getMinutes() + duration.minutes);
		suggestions.push({
			"startDate": startDate,
			"endDate": endDate,
			"score": calculateScore(startDate, endDate, allCourseWork, commonStudents)
		});
		suggestion.setDate(suggestion.getDate() + 1);
	}

	return suggestions;
}

function calculateScore(startDate, endDate, allCourseWork, commonStudents) {
	var score = 0;
	for(var i = 0; i < allCourseWork.length; ++ i) {
		var courseWork = allCourseWork[i];
		score += commonStudents[courseWork.courseId] * fractionalOverlap(startDate, endDate, courseWork.startDate, courseWork.endDate);
	}
	return score;
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


module.exports = {
  suggestDueDate: suggestDueDate
};