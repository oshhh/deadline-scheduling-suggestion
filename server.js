var https = require(`https`); // 1 - Import Node.js core module
var fs = require(`fs`);
var helper = require(`./helper`)
var calendar_helper = require(`./calendar_helper`)

const port = process.env.PORT || 5000

require('dotenv').config({path: __dirname + '/.env'});

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

        if(params[2] == `student_schedule`) {
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
        } 

        else if(params[2] == `get_suggestions`) {
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
		    
			helper.suggestDueDate(collegeName, courseName, duration, minDueDate, maxDueDate, (suggestions) => {
				res.writeHead(200, {"Content-Type": `text/plain`});
				res.write(JSON.stringify(suggestions));
				res.end();
			}); 
		}

		else if(params[2] == `inform_about_event`) {
			eventName = params[3]
			eventStartDate = new Date(params[4])
			eventEndDate = new Date(params[5])
			if(isNaN(eventStartDate)) {
				throw(`Event start date not formatted correctly: ${eventStartDate}`)
			}
			if(isNaN(eventEndDate)) {
				throw(`Event end date not formatted correctly: ${eventEndDate}`)
			}
			helper.addEventToCalendar(eventName, eventStartDate, eventEndDate, (err) => {
				res.writeHead(200, {"Content-Type": `text/plain`});
				res.write(err.toString())
				res.end();
			})
		}

		else if(params[2] == `courses`) {
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
		}

        else {
            throw(`unrecognised request ${params[2]}`);
        }

    }
    catch(err) {
        console.log(err);
        res.writeHead(200, {"Content-Type": `text/plain`});
	res.write(`Invalid Request: ` + err.toString() + `\n`);
        res.end();
    }
}

const options = {
	key: process.env.SSL_KEY_FILE,
	cert: process.env.SSL_CERT_FILE
}

var server = https.createServer(options, handleRequest);


server.listen(port);

console.log(`Node.js web server at port 5000 is running..`)
