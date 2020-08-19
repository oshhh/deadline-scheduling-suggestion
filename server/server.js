var http = require('http'); // 1 - Import Node.js core module
var fs = require("fs");
var get_suggestions = require("./get_suggestions")

const port = process.env.PORT || 5000


/*
Request format: 
"/[college_name]:[duration]/[minDueDate]/[maxDueDate]"
college_name : iiitd (only valid college)
duration: days-hours-minutes
minDueDate : YYYY-MM-DDTHH:mm:ss.sssZ
maxDueDate : YYYY-MM-DDTHH:mm:ss.sssZ
*/

function handleRequest(req, res) {
    try {
        params = decodeURI(req.url).split("/");
        console.log(params);
        if(params.length < 6) {
            throw("insufficient parameters");
        }
        
        var collegeName = params[1];
        var courseName = params[2]
        var duration = params[3];
        var minDueDate = params[4];
        var maxDueDate = params[5];
        duration = duration.split("-");
        try {
            duration = {"date": parseInt(duration[0]), "hours": parseInt(duration[1]), "minutes": parseInt(duration[2])};
        } catch(err) {
            throw("Duration formatted incorrectly");
        }
        minDueDate = new Date(minDueDate);
        if(isNaN(minDueDate)) {
            throw("Minimum Due Date formatted incorrectly")
        }
        maxDueDate = new Date(maxDueDate);
        if(isNaN(maxDueDate)) {
            throw("Maximum Due Date formatted incorrectly");
        }
        
        fs.readFile(`./${collegeName}_students.json`, 'utf8', (err, string) => {
            if(err) {
                console.log(err);
                res.writeHead(200, {"Content-Type": "text/plain"});
                res.write(`Invalid Request: college ${collegeName} doesn't exist in our database\n`);
                res.end();
            } else {
                students = JSON.parse(string);

                var isCourse = false;
                for(var i in students) {
                    for(var j in students[i]) {
                        if(courseName == students[i][j]) isCourse = true;
                    }
                }

                if(!isCourse) {
                    res.writeHead(200, {"Content-Type": "text/plain"});
                    res.write(`Invalid Request: course ${courseName} doesn't exist in college ${collegeName}`);
                    res.end();
                    return;
                }

                get_suggestions.suggestDueDate(courseName, duration, minDueDate, maxDueDate, students, (suggestions) => {
                    res.writeHead(200, {"Content-Type": "text/plain"});
                    res.write(JSON.stringify({suggestions: suggestions}));
                    res.end();
                });

            }
        });
    }
    catch(err) {
        console.log(err);
        res.writeHead(200, {"Content-Type": "text/plain"});
        res.write("Invalid Request: " + err.toString() + "\n");
        res.end();
    } 
}

var server = http.createServer(handleRequest);

server.listen(port);

console.log('Node.js web server at port 5000 is running..')