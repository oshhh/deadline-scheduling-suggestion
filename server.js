var http = require(`http`); 
var fs = require(`fs`);
var helper = require(`./helper`)
var calendar_helper = require(`./calendar_helper`)

const port = process.env.PORT || 5000


/*
Request format: 
`/[college_name]:[duration]/[minDueDate]/[maxDueDate]`
college_name : iiitd (only valid college)
duration: days-hours-minutes
minDueDate : YYYY-MM-DDTHH:mm:ss.sssZ
maxDueDate : YYYY-MM-DDTHH:mm:ss.sssZ
*/

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
	        		helper.getStudentSchedule(collegeName, courseName, duration, (schedule) => {
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
			    maxDueDate = new Date(maxDueDate);
			    if(isNaN(maxDueDate)) {
			        throw(`Maximum Due Date formatted incorrectly`);
			    }
			    
				helper.suggestDueDate(collegeName, courseName, duration, minDueDate, maxDueDate, (suggestions) => {
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
						var isPresent = await helper.isCoursePresent(collegeName, courseName)
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
							res.write(err.toString())
							res.writeHead(200, {"Content-Type": `text/plain`});
							res.end();
						})

					break
					case `backpack_deadline`:
						courseName = params[4]
						var isPresent = await helper.isCoursePresent(collegeName, courseName)
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
							res.write(err.toString())
							res.writeHead(200, {"Content-Type": `text/plain`});
							res.end();
						})
					break
					case `backpack_deadline_reminder`:
						courseName = params[4]
						var isPresent = await helper.isCoursePresent(collegeName, courseName)
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
							res.write(err.toString())
							res.writeHead(200, {"Content-Type": `text/plain`});
							res.end();
						})
					break
					default:
						throw(`Unrecognised event: ${eventType}`)
				}
				courseName = params[4]
				eventStartDate = new Date(params[5])
				eventEndDate = new Date(params[6])
				if(isNaN(eventStartDate)) {
					throw(`Event start date not formatted correctly: ${eventStartDate}`)
				}
				if(isNaN(eventEndDate)) {
					throw(`Event end date not formatted correctly: ${eventEndDate}`)
				}
				helper.addEventToCalendar(eventName, eventStartDate, eventEndDate, (err) => {
					res.write(err.toString())
					res.writeHead(200, {"Content-Type": `text/plain`});
					res.end();
				})
			break
			case `courses`: 
				var courseName = decodeURIComponent(params[3])
				console.log(courseName)
				var query = params[4]
				if(query == `is_present`) {
					var isPresent = await helper.isCoursePresent(collegeName, courseName)
					console.log(isPresent.toString())
					res.writeHead(200, {"Content-Type": `text/plain`});
	    			res.write(isPresent.toString())
					res.end();        		
				} else if(query == `add_course`) {
					professorName = params[5]
					professorEmail = params[6]
					req.on('data', (data) => {
						data = data.toString()
						students = data.split(',')
						helper.addNewCourse(collegeName, courseName, professorName, professorEmail, students, () => {
							console.log('done')
						})
						res.writeHead(200, {"Content-Type": `text/plain`});
						res.end();
					})
				}
			break
			default:
				throw(`unrecognised request ${params[2]}`);
		}
    }
    catch(err) {
        console.log(err);
        res.write(`Invalid Request: ` + err.toString() + `\n`);
        res.writeHead(200, {"Content-Type": `text/plain`});
        res.end();
    }
}

var server = http.createServer(handleRequest);


server.listen(port);

console.log(`Node.js web server at port 5000 is running..`)
