const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');
require('dotenv').config({path: __dirname + '/.env'});

const CLASSROOM_CALENDAR_ID = 'iiitd.ac.in_classroom'
// const CLASSROOM_CALENDAR_ID = 'classroom'
const BACKPACK_CALENDAR_ID = 'backpack'
const EVENTS = 'iiitd_events'
const STUDENT_CALENDAR = 'osheen18059@iiitd.ac.in'

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/calendar'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
	const {client_secret, client_id, redirect_uris} = credentials.installed;
	const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

	// Check if we have previously stored a token.
	token = process.env.TOKEN;
	if (token == "") return getAccessToken(oAuth2Client, callback);
	oAuth2Client.setCredentials(JSON.parse(token));
	callback(oAuth2Client);
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getAccessToken(oAuth2Client, callback) {
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
      console.log(JSON.stringify(token))
			callback(oAuth2Client);
		});
	});
}

function listCalendars(auth, callback) {
  const calendar = google.calendar({version: 'v3', auth});
  calendar.calendarList.list({
  }, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);
    const calendars = res.data.items;
    callback(auth, calendars);
  });	
}

/**
 * Lists the next 10 events on the user's primary calendar.
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function listEvents(auth, calendarId, start, callback) {
  const calendar = google.calendar({version: 'v3', auth});
  calendar.events.list({
    calendarId: calendarId,
    timeMin: start,
    singleEvents: true,
    orderBy: 'startTime',
  }, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);
    const events = res.data.items;
    callback(auth, events);
  });
}

function getAllEvents(start, callback) {
  // Load client secrets from a local file.
  credentials_json = JSON.parse(process.env.GOOGLE_CREDENTIALS);
  // Authorize a client with credentials, then call the Google Calendar API.
  authorize(credentials_json, (auth) => {
    listCalendars(auth, (auth, calendars) => {
      var calendar_count = 0;
      calendars.forEach((calendar) => {
        if(calendar.id.substring(0, CLASSROOM_CALENDAR_ID.length) == CLASSROOM_CALENDAR_ID || calendar.id.substring(0, BACKPACK_CALENDAR_ID.length) == BACKPACK_CALENDAR_ID || calendar.id.substring(0, EVENTS.length) == EVENTS) {
          calendar_count ++;
        }          
      });
      var assignments = [];
      calendars.forEach((calendar) => {
        if(calendar.id.substring(0, CLASSROOM_CALENDAR_ID.length) == CLASSROOM_CALENDAR_ID || calendar.id.substring(0, BACKPACK_CALENDAR_ID.length) == BACKPACK_CALENDAR_ID || calendar.id.substring(0, EVENTS.length) == EVENTS) {
          console.log(calendar.summary)
          listEvents(auth, calendar.id, start, (auth, events) => {
            console.log(calendar.summary)
            console.log(events)
            calendar_count --;
            events.forEach((event) => {
              if(event.summary.substring(0, 10) != 'Assignment') return
              assignments.push({
                course_name: event.organizer.displayName,
                coursework_name: event.summary,
                start_date: new Date(event.created),
                end_date: new Date(event.end.dateTime != null ? event.end.dateTime : `${event.start.date}T18:29:00Z`),
              });
            });
            if(calendar_count == 0) {
              callback(assignments);
            }
          });
        }
      });
    });
  });
}

function insertEvent(event_name, event_start_date, event_end_date, callback) {

  console.log(event_start_date.toISOString())
  console.log(event_end_date.toISOString())

  // Load client secrets from a local file.
  credentials_json = JSON.parse(process.env.GOOGLE_CREDENTIALS);
  // Authorize a client with credentials, then call the Google Calendar API.
  authorize(credentials_json, (auth) => {
    const calendar = google.calendar({version: 'v3', auth});
    calendar.events.insert({
      calendarId: STUDENT_CALENDAR,
      resource: {
        end: {
          dateTime: event_end_date.toISOString()
        },
        start: {
          dateTime: event_start_date.toISOString()
        },
        summary: event_name
      }
    }, (err) => {
      callback(err)
    })
  })
}


module.exports = {
  getAllEvents: getAllEvents,
  insertEvent: insertEvent
}
