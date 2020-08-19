const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');
require('dotenv').config({path: __dirname + '/.env'});

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];
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
			process.env['TOKEN'] = JSON.stringify(token);
			console.log(token);
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
        if(calendar.id.substring(0, 9) == "classroom" || calendar.id.substring(0, 8) == "backpack" || calendar.id.substring(0, 12) == "iiitd_events") {
          calendar_count ++;
        }          
      });
      var assignments = [];
      calendars.forEach((calendar) => {
        if(calendar.id.substring(0, 9) == "classroom" || calendar.id.substring(0, 8) == "backpack" || calendar.id.substring(0, 12) == "iiitd_events") {
          listEvents(auth, calendar.id, start, (auth, events) => {
            calendar_count --;
            events.forEach((event) => {
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

module.exports = {
  getAllEvents: getAllEvents
}
