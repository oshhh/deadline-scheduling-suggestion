var calendar_helper = require("./calendar_helper.js");
var fs = require('fs');
var admin = require("firebase-admin")
require('dotenv').config({path: __dirname + '/.env'});

var db = null

async function main() {
	admin.initializeApp({
	  credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_CREDENTIALS)),
	  databaseURL: "https://deadline-schedule-suggestions.firebaseio.com"
	});

	db = admin.firestore()
}

main()

async function getStudents(collegeName, callback) {
	var college = await db.collection('colleges').doc(collegeName)
	if(!(await college.get()).exists) {
		throw(`Invalid Request: college ${collegeName} doesn't exist in our database\n`)
	}
	var students_snapshot = await college.collection('students').get()
	students = {}
	students_snapshot.forEach((doc) => {
			students[doc.id] = []
			for(i in doc.data().courses) {
				students[doc.id].push(doc.data().courses[i].id)
			}
		})
	callback(students)
}

/*
	~~ Parameters ~~
	collegeName: datatype - string
	courseName: datatype - string
	duration: datatype - JSON, format - {date: .., hours: .., minutes: ..}
	minDueDate: datatype - Date
	maxDueDate: datatype - Date
	~~ Returns ~~
	Some due date suggestions for an assignment of duration `duration`, this due date being between the min and max due date. 
	Score and clashes with other events.
*/
async function suggestDueDate(collegeName, courseName, duration, minDueDate, maxDueDate, callback) {
	if(! await isCoursePresent(collegeName, courseName)) {
		throw(`Invalid Request: course ${courseName} not in college ${collegeName} according to our database`)
	}
	getStudents(collegeName, (students) => {
	    calendar_helper.getAllEvents(minDueDate, (allCourseWork) => {
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
	})
}

/*
	~~ Parameters ~~
	collegeName: datatype - string
	courseName: datatype - string
	duration: datatype - JSON, format - {date: .., hours: .., minutes: ..}
	~~ Returns ~~
	Score relating to how free the students are and the clashes with other events from today to today + duration
*/
async function getStudentSchedule(collegeName, courseName, duration, callback) {
	if(! await isCoursePresent(collegeName, courseName)) {
		throw(`Invalid Request: course ${courseName} not in college ${collegeName} according to our database`)
	}
	getStudents(collegeName, (students) => {
	    var start_date = new Date();
	    var end_date = new Date();
	    end_date.setDate(end_date.getDate() + duration.days);
	    end_date.setHours(end_date.getHours() + duration.hours);
	    end_date.setMinutes(end_date.getMinutes() + duration.minutes);

	    var commonStudents = getCommonStudents(students, courseName);

	    calendar_helper.getAllEvents(start_date, (allCourseWork) => {
	    	var score = calculateScore(start_date, end_date, allCourseWork, commonStudents);
	    	callback(score);
	    });
	})
}

async function addEventToCalendar(eventName, eventStartDate, eventEndDate, callback) {
	calendar_helper.insertEvent(eventName, eventStartDate, eventEndDate, callback)
}

async function isCoursePresent(collegeName, courseName, callback) {
	var college = db.collection('colleges').doc(collegeName)
	if(!(await college.get()).exists) {
		throw(`Invalid Request: college ${collegeName} doesn't exist in our database\n`)
	}
	var course = await college.collection('courses').doc(courseName).get()
	return course.exists
}

async function addNewCourse(collegeName, courseName, professorName, professorEmail, students, callback) {
	if(await isCoursePresent(collegeName, courseName)) {
		updateCourseStudents(collegeName, courseName, students, callback)
		return
	}
	var userName = professorEmail.split('@')[0]
	console.log(userName)
	var professor = db.collection('colleges').doc(collegeName).collection('professors').doc(userName)
	if(!(await professor.get()).exists) {
		professor.set({
			name: professorName,
			email: professorEmail
		})
	}
	await db.collection('colleges').doc(collegeName).collection('courses').doc(courseName).set({
		name: courseName,
		professor: professor
	})
	var course = db.collection('colleges').doc(collegeName).collection('courses').doc(courseName)
	for(i in students) {
		student = students[i]
		console.log(student)
		var docref = db.collection('colleges').doc(collegeName).collection('students').doc(student)
		var doc = await docref.get()
		if(!doc.exists) {
			docref.set({
				courses: [course]
			})
		} else {
			db.collection('colleges').doc(collegeName).collection('students').doc(doc.id).update({
				courses: admin.firestore.FieldValue.arrayUnion(course)
			})
		}
	}
	callback()
}

async function updateCourseStudents(collegeName, courseName, students, callback) {
	if(! await isCoursePresent(collegeName, courseName)) {
		throw(`Course ${courseName} not present in college ${collegeName} according to our database`)
	}
	var course = db.collection('colleges').doc(collegeName).collection('courses').doc(courseName)
	var oldStudents = await db.collection('colleges').doc(collegeName).collection('students').get()
	oldStudents.forEach((doc) => {
		inCourse = false
		for(i in doc.data().courses) {
			if(doc.data().courses[i].id == courseName) {
				inCourse = true
			}
		}
		if((students.includes(doc.id)) && ! inCourse) {
			db.collection('colleges').doc(collegeName).collection('students').doc(doc.id).update({
				courses: admin.firestore.FieldValue.arrayUnion(course)
			})
		} else if(!(students.includes(doc.id)) && inCourse) {
			db.collection('colleges').doc(collegeName).collection('students').doc(doc.id).update({
				courses: admin.firestore.FieldValue.arrayRemove(course)
			})
		}
	})
	for(i in students) {
		var student = students[i]
		var docref = db.collection('colleges').doc(collegeName).collection('students').doc(student)
		var doc = await docref.get()
		if(!doc.exists) {
			docref.set({
				courses: [course]
			})
		}
	}
	callback()
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