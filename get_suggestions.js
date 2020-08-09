const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/classroom.courses', 'https://www.googleapis.com/auth/classroom.coursework.students'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';


/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getNewToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getNewToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error retrieving access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}

function listCourseWork(auth, courseId, callback) {
  const classroom = google.classroom({version: 'v1', auth});
  classroom.courses.courseWork.list({
    courseId: courseId,
    orderBy: "dueDate desc",
    courseWorkStates: ["DRAFT", "PUBLISHED"],
    pageSize: 1000,
  }, (err, res) => {
    if (err) return console.error('The API returned an error: ' + err);
    const courseWork = res.data.courseWork;
    callback(courseWork, auth);
  });
}

function listCourses(auth, callback) {
  const classroom = google.classroom({version: 'v1', auth});
  classroom.courses.list({
    pageSize: 1000,
  }, (err, res) => {
    if (err) return console.error('The API returned an error: ' + err);
    const courses = res.data.courses;
    callback(courses, auth);
  });
}

function printCourses(courses) {
  if (courses && courses.length) {
    console.log('courses:');
    courses.forEach((course) => {
      console.log(`${course.id}, ${course.name}`);
    });
  } else {
    console.log('No courses found.');
  }
}

function printCourseWorks(courseWorks) {
  if (courseWorks && courseWorks.length) {
    console.log('Coursework:');
    courseWorks.forEach((courseWork) => {
      console.log(`${courseWork.courseId}: ${courseWork.title} \n${JSON.stringify(courseWork)}`);
    });
  } else {
    console.log('No coursework found.');
  }
}

function suggestDueDate(duration, maxDueDate, allCourseWork, commonStudents, callback) {
	// for each date call calculateScore and order suggestions score 
	suggestion = new Date();
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

	callback(suggestions);
}

function calculateScore(startDate, endDate, allCourseWork, commonStudents) {
	var score = 0;
	for(var i = 0; i < allCourseWork.length; ++ i) {
		var courseWork = allCourseWork[i];
		var c_startDate, c_endDate;
		if(courseWork.scheduledTime == null) {
			c_startDate = Date.parse(courseWork.creationTime);
		} else {
			c_startDate = Date.parse(courseWork.scheduledTime);
		}
		c_endDate = Date.parse(`${courseWork.dueDate.year}-${courseWork.dueDate.month}-${courseWork.dueDate.day} ${courseWork.dueTime.hours}:${courseWork.dueTime.minutes}:00Z`);

		score += commonStudents[courseWork.courseId] * fractionalOverlap(startDate, endDate, c_startDate, c_endDate);
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

function getDueDateSuggestions(students, duration, maxDueDate, callback) {

  fs.readFile('credentials.json', (err, content) => {
	  if (err) return console.log('Error loading client secret file:', err);


	  var commonStudents = {};
	  var courses = [];
	  for(var i = 0; i < students.length; ++ i) {
	  	for(var j = 0; j < students[i]["courses"].length; ++ j) {
	  		if(commonStudents[students[i]["courses"][j]] == null) {
	  			courses.push(students[i]["courses"][j]);
	  			commonStudents[students[i]["courses"][j]] = 0;
	  		}
	  		commonStudents[students[i]["courses"][j]] ++;
	  	}
	  }

	  authorize(JSON.parse(content), (auth) => {
	  	allCourseWork = []
	  	var count = 0;
	    for(var i = 0; i < courses.length; ++ i) {
	      listCourseWork(auth, courses[i], (courseWork, auth) => {
	  			if(courseWork != null) {
	  				courseWork.forEach((c) => { allCourseWork.push(c); })
	  			};
	        count ++;
	        if(count == courses.length) {
	          suggestDueDate(duration, maxDueDate, allCourseWork, commonStudents, (dueDateSuggestions) => {
	            console.log(dueDateSuggestions);
	          });
	        }
	      });
	    }
	  });
	});
}



function main() {
	students = [{"id": "S1", "courses": ["122593778141", "122593778147", "122593792063"]}, {"id": "S2", "courses" : ["122593778141", "122593778147", "122593792068"]}];
	duration = {"date": 1, "hours": 0, "minutes": 0};
	maxDueDate = new Date();
	maxDueDate.setDate(maxDueDate.getDate() + 3);
	getDueDateSuggestions(students, duration, maxDueDate, (suggestions) => console.log(suggestions));
}


main();