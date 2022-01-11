var calendar_helper = require("./calendar_helper.js");
var db_helper = require("./db_helper.js");
var fs = require('fs');
require('dotenv').config({path: __dirname + '/.env'});


async function isCoursePresent(courseId, callback) {
	db_helper.isCoursePresent(courseId, callback)
}

async function getCourses(callback) {
	db_helper.getCourses(callback);
}

/*
	~~ Parameters ~~
	courseId: datatype - string
	duration: datatype - JSON, format - {date: .., hours: .., minutes: ..}
	minDueDate: datatype - Date
	maxDueDate: datatype - Date
	~~ Returns ~~
	Some due date suggestions for an assignment of duration `duration`, this due date being between the min and max due date. 
	Score and clashes with other events.
*/
async function suggestDueDate(courseId, duration, minDueDate, maxDueDate, callback) {
	db_helper.isCoursePresent(courseId, (err, isPresent) => {
		if(err) return callback(err);
		if(! isPresent) {
			return callback(new Error(`course ${courseId} does not exist according to our database. visit /courses to view the list of courses.`))
		}
		console.log(`course present`);
		db_helper.getStudents(courseId, (err, students) => {
		    if(err) return callback(err);
		    calendar_helper.getAllEvents(minDueDate, (err, allCourseWork) => {
		    	if(err) return callback(err);
				db_helper.getCalendarNames((err, courseNames) => {
					if(err) return callback(err);
					courseNameToId = {}
					for(var id in courseNames) {
						courseNameToId[courseNames[id]] = id;
					}
					for(var i in allCourseWork) {
						if(allCourseWork[i].course_name in courseNameToId) {
							allCourseWork[i].course_id = courseNameToId[allCourseWork[i].course_name]
						}
					}
					var commonStudents = getCommonStudents(students, courseId);
					console.log(commonStudents);
					console.log(allCourseWork);
					console.log(courseNameToId);
					var suggestions = [];

					var suggestion = new Date(minDueDate);
					var lastDate = new Date(maxDueDate);
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
								clash: 2 * (calculateScore(start_date, end_date, allCourseWork, commonStudents, duration.days/(duration.days - 2))),
							});
							suggestion.setDate(suggestion.getDate() + 1);
						}
						flexi_suggestions.sort((a, b) => {return a.clash.score - b.clash.score;});
				    }
					return callback(null, {suggestions: suggestions, flexi_suggestions: flexi_suggestions});
				});
		    });		
		})
	})
}

/*
	~~ Parameters ~~
	courseId: datatype - string
	duration: datatype - JSON, format - {date: .., hours: .., minutes: ..}
	~~ Returns ~~
	Score relating to how free the students are and the clashes with other events from today to today + duration
*/
async function getStudentSchedule(courseId, duration, callback) {
	db_helper.isCoursePresent(courseId, (err, isPresent) => {
		if(err) return callback(err);
		if(! isPresent) {
			return callback(new Error(`course ${courseId} does not exist according to our database`))
		}
		db_helper.getStudents(courseId, (err, students) => {
			if(err) return callback(err);
		    var start_date = new Date();
		    var end_date = new Date();
		    end_date.setDate(end_date.getDate() + duration.days);
		    end_date.setHours(end_date.getHours() + duration.hours);
		    end_date.setMinutes(end_date.getMinutes() + duration.minutes);

		    var commonStudents = getCommonStudents(students, courseId);

		    calendar_helper.getAllEvents(start_date, (err, allCourseWork) => {
		    	if(err) return callback(err);
				db_helper.getCalendarNames((err, courseNames) => {
					if(err) return callback(err);
					courseNameToId = {}
					for(var id in courseNames) {
						courseNameToId[courseNames[id]] = id;
					}
					for(var i in allCourseWork) {
						allCourseWork[i].course_id = courseNameToId[allCourseWork[i].course_name]
					}
					var score = calculateScore(start_date, end_date, allCourseWork, commonStudents);
					callback(null, score);
				})
		    });
		})
	})
}

async function addEventToCalendar(eventName, eventStartDate, eventEndDate, callback) {
	calendar_helper.insertEvent(eventName, eventStartDate, eventEndDate, callback)
}

function getCommonStudents(students, courseId) {
	var commonStudents = {};
	var total = 0;
	for(var i in students) {
		var studentInCourse = false;
		for(var j in students[i]) {
		    if(courseId == students[i][j]) {
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
	allCourseWork: datatype - list of courseWorks, format - {course_name: .., course_id: ..., coursework_name: .., start_date: (datatype - Date), end_date: (datatype - Date)}
	commonStudents: datatype - JSON, format - {courseId: studentCount}
*/
function calculateScore(start_date, end_date, allCourseWork, commonStudents, flexi_factor = 1) {
	var score = 0;
	var reason = [];
	for(var i = 0; i < allCourseWork.length; ++ i) {
		var courseWork = allCourseWork[i];
        if(commonStudents[courseWork.course_id] == null) continue;
		console.log(courseWork)
		score += commonStudents[courseWork.course_id] * clash(start_date, end_date, courseWork.start_date, courseWork.end_date);
		if(clash(start_date, end_date, courseWork.start_date, courseWork.end_date) != 0) {
			reason.push({
				courseWork: courseWork,
				fraction_of_students: commonStudents[courseWork.course_id],
				fraction_of_overlap: clash(start_date, end_date, courseWork.start_date, courseWork.end_date) + distance_between_deadlines(start_date, end_date, courseWork.start_date, courseWork.end_date),
			});
		}
	}
	return {score: score/flexi_factor, reason: reason};
}

function clash(startDate, endDate, c_startDate, c_endDate) {
	if(startDate >= c_endDate || c_startDate > endDate) return 0;
	if(endDate >= c_endDate && startDate <= c_startDate) {
		return 1;
	}
	if(startDate < c_startDate) {
		return (endDate - c_startDate)/(c_endDate - c_startDate);
	} else {
		return (c_endDate - startDate)/(c_endDate - c_startDate);
	}
}

function distance_between_deadlines(startDate, endDate, c_startDate, c_endDate) {
	return 1/(1 + Math.abs(endDate - c_endDate));
}

module.exports = {
  suggestDueDate: suggestDueDate,
  getStudentSchedule: getStudentSchedule,
  addEventToCalendar: addEventToCalendar,
  isCoursePresent: isCoursePresent,
  getCourses: getCourses,
};
