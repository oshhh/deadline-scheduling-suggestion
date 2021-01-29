var https = require(`https`); // 1 - Import Node.js core module
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
    console.log(err);
    res.writeHead(200, {"Content-Type": `text/plain`});
	res.write(`Invalid Request: ` + err.toString() + `\n`);
    res.end();
}

async function handleRequest(req, res) {
	// to avoid CORS error
	res.setHeader('Access-Control-Allow-Origin', '*');

    try {
        params = decodeURI(req.url).split(`/`);
        console.log(params);

        if(params.length < 3) {
        	throw("insufficient parameters");
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
	        		throw(`only valid value of 4th parameter is "week"`);
	        	}
        	break
	        case `get_suggestions`:
	        	var courseName = params[3];
			    var duration = params[4];
			    var minDueDate = params[5];
			    var maxDueDate = params[6];
			    duration = duration.split(`-`);
			    try {
			        duration = {days: parseInt(duration[0]), hours: parseInt(duration[1]), minutes: parseInt(duration[2])};
			    } catch(err) {
			        throw(`Duration formatted incorrectly`);
			    }
			    minDueDate = new Date(minDueDate);
			    if(isNaN(minDueDate)) {
			        throw(`Minimum Due Date formatted incorrectly`)
			    }
			    console.log(maxDueDate)
			    maxDueDate = new Date(maxDueDate);
			    console.log(maxDueDate)
			    if(isNaN(maxDueDate)) {
				console.log(maxDueDate)
				throw(`Maximum Due Date formatted incorrectly`);
			    }
			    
				helper.suggestDueDate(collegeName, courseName, duration, minDueDate, maxDueDate, (err, suggestions) => {
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
								throw(`Course ${courseName} not found in college ${collegeName}`)
							}
							eventStartDate = new Date(params[5])
							if(isNaN(eventStartDate)) {
								throw(`Event start date not formatted correctly: ${eventStartDate}`)
							}
							eventEndDate = new Date(params[6])
							if(isNaN(eventEndDate)) {
								throw(`Event end date not formatted correctly: ${eventEndDate}`)
							}

							eventName = `#Quiz: ${courseName}`
							helper.addEventToCalendar(eventName, eventStartDate, eventEndDate, (err) => {
		        				if(err) {
		        					sendError(res, err);
		        					return;
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
								throw(`Course ${courseName} not found in college ${collegeName}`)
							}
							eventStartDate = new Date(params[5])
							if(isNaN(eventStartDate)) {
								throw(`Event start date not formatted correctly: ${eventStartDate}`)
							}
							eventEndDate = new Date(params[6])
							if(isNaN(eventEndDate)) {
								throw(`Event end date not formatted correctly: ${eventEndDate}`)
							}

							eventName = `#Deadline: ${courseName}`
							helper.addEventToCalendar(eventName, eventStartDate, eventEndDate, (err) => {
		        				if(err) {
		        					sendError(res, err);
		        					return;
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
								throw(`Course ${courseName} not found in college ${collegeName}`)
							}
							eventStartDate = new Date(params[5])
							if(isNaN(eventStartDate)) {
								throw(`Event start date not formatted correctly: ${eventStartDate}`)
							}
							eventEndDate = new Date(params[6])
							if(isNaN(eventEndDate)) {
								throw(`Event end date not formatted correctly: ${eventEndDate}`)
							}

							eventName = `#DeadlineReminder: ${courseName}`
							helper.addEventToCalendar(eventName, eventStartDate, eventEndDate, (err) => {
		        				if(err) {
		        					sendError(res, err);
		        					return;
		        				}
							})
						})
					break
					default:
						sendError(new Error(`Unrecognised event: ${eventType}`))
				}
			break
			case `courses`: 
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
					sendError(new Error(`Unrecognised query: ${query}`))
				}
			break
			case `find_date`:
	    		var dateNow = new Date(Date.now());
	    		var dateResult = chrono.parseDate(params[3].toUpperCase(), dateNow, { forwardDate: true });
				res.writeHead(200, {"Content-Type": `text/plain`});
	    		res.write(dateResult.toString());
				res.end();
			break
			default:
				sendError(new Error(`Unrecognised request: ${params[2]}`));
		}
    }
    catch(err) {
    	console.log(err);
    	sendError(new Error(`Oops! An error occurred.`))
    }
}

const options = {
	key: fs.readFileSync(process.env.SSL_KEY_FILE).toString(),
	cert: fs.readFileSync(process.env.SSL_CERT_FILE).toString()
}

var server = https.createServer(options, handleRequest);


server.listen(port);

console.log(`Node.js web server at port ${port} is running..`)
