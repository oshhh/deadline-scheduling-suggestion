const mysql = require('mysql');
require('dotenv').config({path: __dirname + '/.env'});

db_config = {
  host: "localhost",
  port: 3306,
  database: "scheduler_dev",
  user: "client-scheduler",
  password: process.env.SQL_DB_PASSWORD,
  insecureAuth : true
}

var con = null

console.log(db_config)

function handleDisconnect() {
  console.log("connecting to SQL")
  console.log(db_config)
  con = mysql.createConnection(db_config); // Recreate the con, since
                                                  // the old one cannot be reused.

  con.connect(function(err) {              // The server is either down
    if(err) {                                     // or restarting (takes a while sometimes).
      console.log('error when connecting to db:', err);
      setTimeout(handleDisconnect, 2000); // We introduce a delay before attempting to reconnect,
    }                                     // to avoid a hot loop, and to allow our node script to
  });                                     // process asynchronous requests in the meantime.
                                          // If you're also serving http, display a 503 error.
  con.on('error', function(err) {
    console.log(`ERROR: ${err.toString()}`);
    if(err.code === 'PROTOCOL_CONNECTION_LOST') { // Connection to the MySQL server is usually
      handleDisconnect();                         // lost due to either server restart, or a
    }
  });
}

handleDisconnect();

function runQuery(query, callback) {
  console.log("Query Run: " + query);
  result = con.query(query, function (err, result) {
  if (err) {
    console.log("Error in SQL Query")
    console.log(err);
    return callback(err);
    return;
  } else {
    if(callback != null) return callback(err, result);
  }

  });
}


async function getStudents(courseId, callback) {
  query = `select student_id, course_id from course_student where "${courseId}" in (select cs.course_id from course_student as cs where cs.student_id == course_student.student_id);`;
  runQuery(query, (err, course_students) => {
          if(err) return callback(err);
    students = {}
    for(i in course_students) {
      if(!(course_students[i]['student_id'] in students)) {
        students[course_students[i]['student_id']] = []
      }
      students[course_students[i]['student_id']].push(course_students[i]['course_id'])
    }
    console.log(`students of ${courseId} fetched`);
    return callback(null, students);
  })
}

async function isCoursePresent(courseId, callback) {
  query = `select course_id from course where course_id = '${courseId}';`
  runQuery(query, (err, course) => {
    if(err) return callback(err);
    return callback(null, course.length != 0)
  })
}

async function getCourses(callback) {
  query = `select course_id, name from course;`
  runQuery(query, (err, courses) => {
    if(err) return callback(err);
    courseNames = {}
    courses.forEach(course => {
      courseNames[course['id']] = course['name']
    });
    return callback(null, courseNames);
  })
}

async function getCalendarNames(callback) {
	query = `select course_id, classroom_name from course;`
  runQuery(query, (err, courses) => {
    if(err) return callback(err);
    courseNames = {}
    courses.forEach(course => {
      courseNames[course['course_id']] = course['classroom_name']
    });
    return callback(null, courseNames);
  })
}

module.exports = {
  getStudents: getStudents,
  isCoursePresent: isCoursePresent,
  getCourses: getCourses,
  getCalendarNames: getCalendarNames,
};
