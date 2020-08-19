var http = require('http'); // 1 - Import Node.js core module
var fs = require("fs");
var get_suggestions = require("./get_suggestions")

const port = process.env.PORT || 3000


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
        params = req.url.split("/");
        console.log(params);
        if(params.length < 6) {
            throw("insufficient parameters");
        }
        
        var college_name = params[1];
        var course_name = params[2]
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
        
        fs.readFile(`./${college_name}_students.json`, 'utf8', (err, string) => {
            if(err) {
                console.log(err);
                res.writeHead(200, {"Content-Type": "text/plain"});
                res.write("Invalid Request: college name is wrong\n");
                res.end();
            } else {
                students = JSON.parse(string);

                get_suggestions.suggestDueDate(duration, minDueDate, maxDueDate, students, (suggestions) => {
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

server.listen(5000);

console.log('Node.js web server at port 5000 is running..')