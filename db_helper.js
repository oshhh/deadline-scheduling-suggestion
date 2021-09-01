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


async function getStudents(collegeName, courseName, callback) {
	query = `select id from college where name = '${collegeName}'`
	runQuery(query, (err, college) => {
    		if(err) return callback(err);
		if(college.length == 0) return callback(new Error(`Invalid Request: college '${collegeName}' doesn't exist in our database\n`), null);
		college_id = college[0]['id']
		query = `select admission_number, course.classroom_name from course_student, student, course where student.id = student_id and course.id = course_id and student.college_id = '${college_id}' and student.id in (select s.id from student as s, course_student as cs, course as c where s.id = cs.student_id and c.id = cs.course_id and c.classroom_name = '${courseName}');`;
		runQuery(query, (err, course_students) => {
      			if(err) return callback(err);
			students = {}
			for(i in course_students) {
				if(!(course_students[i]['admission_number'] in students)) {
					students[course_students[i]['admission_number']] = []
				}
				students[course_students[i]['admission_number']].push(course_students[i]['classroom_name'])
			}
			console.log(`students of ${courseName} fetched`);
			return callback(null, students);
		})
	})
}

async function isCoursePresent(collegeName, courseName, callback) {

	query = `select id from college where name = '${collegeName}'`
	runQuery(query, (err, college) => {
    if(err) return callback(err);
		console.log(college)
		if(college.length == 0) return callback(new Error(`Invalid Request: college ${collegeName} doesn't exist in our database\n`), null)
		college_id = college[0]['id']
		query = `select id from course where college_id = ${college_id} and classroom_name = '${courseName}'`
		runQuery(query, (err, course) => {
      if(err) return callback(err);
			return callback(null, course.length != 0)
		})
	})
}

async function getCourses(collegeName, callback) {
  query = `select id from college where name = '${collegeName}'`
	runQuery(query, (err, college) => {
    if(err) return callback(err);
		console.log(college)
		if(college.length == 0) return callback(new Error(`Invalid Request: college ${collegeName} doesn't exist in our database\n`), null)
		college_id = college[0]['id']
		query = `select name from course where college_id = ${college_id}`
		runQuery(query, (err, courses) => {
      if(err) return callback(err);
			return callback(null, courses);
		})
	})
}

// async function addNewCourse(collegeName, courseCode, professorName, professorEmail, students, callback) {
// 	var userName = professorEmail.split('@')[0]
// 	var professor = db.collection('colleges').doc(collegeName).collection('professors').doc(userName)
// 	await professor.set({
// 		name: professorName,
// 		email: professorEmail
// 	})
// 	await db.collection('colleges').doc(collegeName).collection('courses').doc(courseCode).set({
// 		name: courseCode,
// 		professor: professor
// 	})
// 	var course = db.collection('colleges').doc(collegeName).collection('courses').doc(courseCode)
// 	for(i in students) {
// 		student = students[i]
// 		console.log(`${courseCode}: ${student}`)
// 		var docref = db.collection('colleges').doc(collegeName).collection('students').doc(student)
// 		var doc = await docref.get()
// 		// if(!doc.exists) {
// 		// 	docref.set({
// 		// 		courses: [course]
// 		// 	})
// 		// } else {
// 		db.collection('colleges').doc(collegeName).collection('students').doc(doc.id).set({
// 			courses: admin.firestore.FieldValue.arrayUnion(course)
// 		}, {merge: true})
// 		// }
// 	}
// 	return callback()
// }


module.exports = {
  getStudents: getStudents,
  isCoursePresent: isCoursePresent,
  getCourses: getCourses,
};
