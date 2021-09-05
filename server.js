var https = require(`https`); // 1 - Import Node.js core module
// var http = require(`http`);
var fs = require(`fs`);
var helper = require(`./helper`)
var calendar_helper = require(`./calendar_helper`)
var chrono = require('chrono-node')

const port = process.env.PORT || 8200

require('dotenv').config({path: __dirname + '/.env'});

/*
Request format: 
`/[college_name]:[duration]/[minDueDate]/[maxDueDate]`
college_name : iiitd (only valid college)
duration: days-hours-minutes
minDueDate : YYYY-MM-DDTHH:mm:ss.sssZ
maxDueDate : YYYY-MM-DDTHH:mm:ss.sssZ
*/

function sendError(res, err) {
	try {
	    console.log(err);
	    res.writeHead(200, {"Content-Type": `text/plain`});
		res.write(`Invalid Request: ` + err.toString() + `\n`);
	    res.end();
	} catch (err) {
		console.log(err);
	}
}

async function handleRequest(req, res) {
	// to avoid CORS error
	res.setHeader('Access-Control-Allow-Origin', '*');

    try {
        params = decodeURI(req.url).split(`/`);
        console.log(params);

        if(params.length == 0) {
        	fs.readFile(__dirname + 'enrollment_info.html', 'utf8', function(err, text){
                res.send(text);
            });
        }

        if(params.length < 3) {
        	sendError(res, new Error("insufficient parameters"));
        	return;
        }

		var collegeName = params[1];		

		switch(params[2]) {		
			case `student_schedule`:
	        	var courseName = params[3];
	        	if(params[4] == `week`) {
	        		duration = {
	        			days: 7,
	        			hours: 0,
	        			minutes: 0
	        		}
	        		helper.getStudentSchedule(collegeName, courseName, duration, (err, schedule) => {
        				if(err) {
        					sendError(res, err);
        					return;
        				}
        				res.writeHead(200, {"Content-Type": `text/plain`});
        				res.write(JSON.stringify(schedule));
        				res.end();
					});
	        	} else {
	        		sendError(res, new Error(`only valid value of 4th parameter is "week"`));
	        		return;
	        	}
        	break
	        case `get_suggestions`:
	        	var courseId = params[3];
			    var duration = params[4];
			    var minDueDate = params[5];
			    var maxDueDate = params[6];
			    if(!duration.match(/[0-9]*-[0-9]*-[0-9]*/g)) {
			        sendError(res, new Error(`Duration formatted incorrectly`));
			        return;
			    }
			    duration = duration.split(`-`);
			    duration = {days: parseInt(duration[0]), hours: parseInt(duration[1]), minutes: parseInt(duration[2])};
			    minDueDate = new Date(minDueDate);
			    if(isNaN(minDueDate)) {
			        sendError(res, new Error(`Minimum Due Date formatted incorrectly`));
			        return;
			    }
			    maxDueDate = new Date(maxDueDate);
			    if(isNaN(maxDueDate)) {
					console.log(maxDueDate)
					sendError(res, new Error(`Maximum Due Date formatted incorrectly`));
					return;
			    }
			    
				helper.suggestDueDate(collegeName, courseId, duration, minDueDate, maxDueDate, (err, suggestions) => {
				    if(err) {
    					sendError(res, err);
    					return;
    				}

					res.writeHead(200, {"Content-Type": `text/plain`});
					res.write(JSON.stringify(suggestions));
					res.end();
				}); 
			break
			case `inform_about_event`:
				eventType = params[3];
				switch(eventType) {
					case `quiz`:
						courseName = params[4]
						helper.isCoursePresent(collegeName, courseName, (err, isPresent) => {
							if(err) {
	        					sendError(res, err);
	        					return;
	        				}

							if(!isPresent) {
								sendError(res, new Error(`Course ${courseName} not found in college ${collegeName}`));
								return;
							}
							eventStartDate = new Date(params[5])
							if(isNaN(eventStartDate)) {
								sendError(res, new Error(`Event start date not formatted correctly: ${eventStartDate}`));
								return;
							}
							eventEndDate = new Date(params[6])
							if(isNaN(eventEndDate)) {
								sendError(res, new Error(`Event end date not formatted correctly: ${eventEndDate}`));
								return;
							}
							eventName = `#Quiz: ${courseName}`
							helper.addEventToCalendar(eventName, eventStartDate, eventEndDate, (err) => {
		        				if(err) {
		        					sendError(res, err);
		        					return;
		        				} else {
									res.writeHead(200, {"Content-Type": `text/plain`});
									res.write(`${courseName} quiz from ${eventStartDate} to ${eventEndDate} created`)
									res.end();
		        				}
							})
						})
					break
					case `backpack_deadline`:
						courseName = params[4]
							helper.isCoursePresent(collegeName, courseName, (err, isPresent) => {
							if(err) {
	        					sendError(res, err);
	        					return;
	        				}

							if(!isPresent) {
								sendError(res, new Error(`Course ${courseName} not found in college ${collegeName}`));
								return;
							}
							eventStartDate = new Date(params[5])
							if(isNaN(eventStartDate)) {
								sendError(res, new Error(`Event start date not formatted correctly: ${eventStartDate}`));
								return;
							}
							eventEndDate = new Date(params[6])
							if(isNaN(eventEndDate)) {
								sendError(res, new Error(`Event end date not formatted correctly: ${eventEndDate}`));
								return;
							}

							eventName = `#Deadline: ${courseName}`
							helper.addEventToCalendar(eventName, eventStartDate, eventEndDate, (err) => {
		        				if(err) {
		        					sendError(res, err);
		        					return;
		        				} else {
									res.writeHead(200, {"Content-Type": `text/plain`});
									res.write(`${courseName} deadline from ${eventStartDate} to ${eventEndDate} created`)
									res.end();
		        				}
							})
						})
					break
					case `backpack_deadline_reminder`:
						courseName = params[4]
						helper.isCoursePresent(collegeName, courseName, (err, isPresent) => {
							if(err) {
	        					sendError(res, err);
	        					return;
	        				}

							if(!isPresent) {
								sendError(res, new Error(`Course ${courseName} not found in college ${collegeName}`));
								return;
							}
							eventStartDate = new Date(params[5])
							if(isNaN(eventStartDate)) {
								sendError(res, new Error(`Event start date not formatted correctly: ${eventStartDate}`));
								return;
							}
							eventEndDate = new Date(params[6])
							if(isNaN(eventEndDate)) {
								sendError(res, new Error(`Event end date not formatted correctly: ${eventEndDate}`));
								return;
							}

							eventName = `#DeadlineReminder: ${courseName}`
							helper.addEventToCalendar(eventName, eventStartDate, eventEndDate, (err) => {
		        				if(err) {
		        					sendError(res, err);
		        					return;
		        				} else {
									res.writeHead(200, {"Content-Type": `text/plain`});
									res.write(`${courseName} deadline posting reminder from ${eventStartDate} to ${eventEndDate} created`)
									res.end();
		        				}
							})
						})
					break
					default:
						sendError(res, new Error(`Unrecognised event: ${eventType}`));
						return;
				}
			break
			case `courses`: 
				if(params.length == 3) {
					helper.getCourses(collegeName, (err, courses) => {
        				if(err) {
        					sendError(res, err);
        					return;
        				}
						res.writeHead(200, {"Content-Type": `text/plain`});
		    			res.write(JSON.stringify(courses))
						res.end();        			
					})
					return;
				}
				var courseName = decodeURIComponent(params[3])
				console.log(courseName)
				var query = params[4]
				if(query == `is_present`) {
					helper.isCoursePresent(collegeName, courseName, (err, isPresent) => {
        				if(err) {
        					sendError(res, err);
        					return;
        				}

						console.log(isPresent.toString())
						res.writeHead(200, {"Content-Type": `text/plain`});
		    			res.write(isPresent.toString())
						res.end();        			
					})
				} else {
					sendError(res, new Error(`Unrecognised query: ${query}`));
					return;
				}
			break
			case `find_date`:
				query = ''
				if(params[3]) {
					query = decodeURIComponent(params[3])
				}
	    		var dateNow = new Date(Date.now());
	    		var dateResult = chrono.parseDate(query.toUpperCase(), dateNow, { forwardDate: true });
				if(dateResult == null) dateResult = dateNow;
				res.writeHead(200, {"Content-Type": `text/plain`});
	    		res.write(dateResult.toString());
				res.end();
			break
			default:
				sendError(res, new Error(`Unrecognised request ${params[2]}`));
				return;
		}
    }
    catch(err) {
    	console.log(err);
    	sendError(res, new Error(`Oops! An error occurred.`));
    	return;
    }
}

const options = {
	key: fs.readFileSync(process.env.SSL_KEY_FILE).toString(),
	cert: fs.readFileSync(process.env.SSL_CERT_FILE).toString()
}


var server = https.createServer(options, handleRequest);
// var server = http.createServer(handleRequest);

server.listen(port);

console.log(`Node.js web server at port ${port} is running..`)
