var fetch_events = require("./fetch_events.js");
var fs = require('fs');

/*
	~~ Parameters ~~
	duration: datatype - JSON, format - {date: .., hours: .., minutes: ..}
	minDueDate: datatype - Date
	maxDueDate: datatype - Date
*/
function suggestDueDate(courseName, duration, minDueDate, maxDueDate, students, callback) {
    fetch_events.getAllEvents(minDueDate, (allCourseWork) => {
        var commonStudents = getCommonStudents(students, courseName)

        var suggestions = [];

        suggestion = new Date(minDueDate);
        lastDate = new Date(maxDueDate);
        lastDate.setDate(lastDate.getDate() - duration.days);
        lastDate.setHours(lastDate.getHours() - duration.hours);
        lastDate.setMinutes(lastDate.getMinutes() - duration.minutes);
        while(suggestion <= lastDate) {
            var start_date = new Date(suggestion);
            var end_date = new Date(suggestion);
            end_date.setDate(end_date.getDate() + duration.days);
            end_date.setHours(end_date.getHours() + duration.hours);
            end_date.setMinutes(end_date.getMinutes() + duration.minutes);
            suggestions.push({
                start_date: start_date,
                end_date: end_date,
                clash: calculateScore(start_date, end_date, allCourseWork, commonStudents),
            });
            suggestion.setDate(suggestion.getDate() + 1);
        }
        suggestions.sort((a, b) => {return a.clash.score - b.clash.score;});

        var flexi_suggestions = [];
        if(duration.days > 0) {
        	// one day more than allowed duration
	        duration.days ++;
	        suggestion = new Date(minDueDate);
	        lastDate = new Date(maxDueDate);
	        lastDate.setDate(lastDate.getDate() - duration.days);
	        lastDate.setHours(lastDate.getHours() - duration.hours);
	        lastDate.setMinutes(lastDate.getMinutes() - duration.minutes);
	        while(suggestion <= lastDate) {
	            var start_date = new Date(suggestion);
	            var end_date = new Date(suggestion);
	            end_date.setDate(end_date.getDate() + duration.days);
	            end_date.setHours(end_date.getHours() + duration.hours);
	            end_date.setMinutes(end_date.getMinutes() + duration.minutes);
	            flexi_suggestions.push({
	                start_date: start_date,
	                end_date: end_date,
	                clash: calculateScore(start_date, end_date, allCourseWork, commonStudents, duration.days/(duration.days - 1)),
	            });
	            suggestion.setDate(suggestion.getDate() + 1);
	        }
	        // two days more than allowed duration
	        duration.days ++;
	        suggestion = new Date(minDueDate);
	        lastDate = new Date(maxDueDate);
	        lastDate.setDate(lastDate.getDate() - duration.days);
	        lastDate.setHours(lastDate.getHours() - duration.hours);
	        lastDate.setMinutes(lastDate.getMinutes() - duration.minutes);
	        while(suggestion <= lastDate) {
	            var start_date = new Date(suggestion);
	            var end_date = new Date(suggestion);
	            end_date.setDate(end_date.getDate() + duration.days);
	            end_date.setHours(end_date.getHours() + duration.hours);
	            end_date.setMinutes(end_date.getMinutes() + duration.minutes);
	            flexi_suggestions.push({
	                start_date: start_date,
	                end_date: end_date,
	                clash: calculateScore(start_date, end_date, allCourseWork, commonStudents, duration.days/(duration.days - 2)),
	            });
	            suggestion.setDate(suggestion.getDate() + 1);
	        }
	        flexi_suggestions.sort((a, b) => {return a.clash.score - b.clash.score;});
	    }

        callback({suggestions: suggestions, flexi_suggestions: flexi_suggestions});
    });
}

function getStudentSchedule(courseName, duration, students, callback) {
    var start_date = new Date();
    var end_date = new Date();
    end_date.setDate(end_date.getDate() + duration.days);
    end_date.setHours(end_date.getHours() + duration.hours);
    end_date.setMinutes(end_date.getMinutes() + duration.minutes);

    var commonStudents = getCommonStudents(students, courseName);

    fetch_events.getAllEvents(start_date, (allCourseWork) => {
    	var score = calculateScore(start_date, end_date, allCourseWork, commonStudents);
    	callback(score);
    });
}

function getCommonStudents(students, courseName) {
	var commonStudents = {};
	var total = 0;
	for(var i in students) {
		var studentInCourse = false;
		for(var j in students[i]) {
		    if(courseName == students[i][j]) {
		        studentInCourse = true;
		    }
		}
		if(!studentInCourse) continue;
		total ++;
		for(var j = 0; j < students[i].length; ++ j) {
		    if(commonStudents[students[i][j]] == null) {
		        commonStudents[students[i][j]] = 0;
		    }
		    commonStudents[students[i][j]] ++;
		}
	}
	for(student in commonStudents) {
		commonStudents[student] /= total;
	}
	return commonStudents;
}

/*
	~~ Parameters ~~
	start_date: datatype - Date
	end_date: datatype - Date
	allCourseWork: datatype - list of courseWorks, format - {course_name: .., coursework_name: .., start_date: (datatype - Date), end_date: (datatype - Date)}
	commonStudents: datatype - JSON, format - {courseName: studentCount}
*/

function calculateScore(start_date, end_date, allCourseWork, commonStudents, flexi_factor = 1) {
	var score = 0;
	var reason = [];
	for(var i = 0; i < allCourseWork.length; ++ i) {
		var courseWork = allCourseWork[i];
        if(commonStudents[courseWork.course_name] == null) continue;
		score += commonStudents[courseWork.course_name] * fractionalOverlap(start_date, end_date, courseWork.start_date, courseWork.end_date);
		if(fractionalOverlap(start_date, end_date, courseWork.start_date, courseWork.end_date) != 0) {
			reason.push({
				courseWork: courseWork,
				fraction_of_students: commonStudents[courseWork.course_name],
				fraction_of_overlap: fractionalOverlap(start_date, end_date, courseWork.start_date, courseWork.end_date),
			});
		}
	}
	return {score: score/flexi_factor, reason: reason};
}

function fractionalOverlap(c1_startDate, c1_endDate, c2_startDate, c2_endDate) {
	if(c1_startDate >= c2_endDate || c2_startDate > c1_endDate) return 0;
	c2_startDate = Math.max(c1_startDate, c2_startDate)
	if(c1_endDate >= c2_endDate && c1_startDate <= c2_startDate) {
		return 1;
	}
	if(c1_startDate < c2_startDate) {
		return (c1_endDate - c2_startDate)/(c2_endDate - c2_startDate);
	} else {
		return (c2_endDate - c1_startDate)/(c2_endDate - c2_startDate);
	}
}




module.exports = {
  suggestDueDate: suggestDueDate,
  getStudentSchedule: getStudentSchedule
};