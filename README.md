# Deadline Scheduling Suggestion

This project aims to create:
1. A server that when given the college name, course name, duration of assignment, minimum and maximum due dates, suggestions the best due date for the assignment of that course, considering what other assignments the students of this course have. 
2. A chrome extension for backpack and classroom that adds to these platforms the functionality of getting suggestions of release date and due date of an assignment/deadline.
The project consists of 2 parts:
## Server: 
hosted on heroku: `https://deadline-scheduling-suggestion.herokuapp.com/`    
Takes in the college name, duration, minimum due date and maximum due date.    
**HTTP Request Format:** `https://deadline-scheduling-suggestion.herokuapp.com/[college_name]/[course_name]/[duration]/[min due date]/[max due date]` 

**college_name:**   
`iiitd` is the only supported college name.   

**course_name:**   
Name of the course for which suggestion for assignment deadline is required.  

**duration:**     
The amount of time that the professor wants to give to the assignment.  
Format: `days-hours-minutes`     
Example: if the assignment is to be given 1 day 5 hrs for completion, duration = `1-5-0`     

**min_due_date:**    
A range of allowed dates for the due date of the assignment is required. `min_due_date` is the earliest date that can be the due date of the assignment.    
Format: `YYYY-MM-DDTHH:mm:ss.sssZ`    
Example: if the assignment's due date to be between `2020-08-17, 5 PM` and `2020-08-20, 5 PM` then min_due_date = `2020-08-17T17:00:00.000Z`.   

**max_due_date:**    
A range of allowed dates for the due date of the assignment is required. `max_due_date` is the farthest date that can be the due date of the assignment.    
Format: `YYYY-MM-DDTHH:mm:ss.sssZ`    
Example: if the professor wants the assignment's due date to be between `2020-08-17, 5 PM` and `2020-08-20, 5 PM` then max_due_date = `2020-08-20T17:00:00.000Z`.   

## Chrome Extension:
Published: 
