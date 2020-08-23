# Deadline Scheduling Suggestion

This API is a part of a bigger project that aims to create:
1. An API that answers the following kinds of queries:    
 1.1. when given the college name, course name, duration of assignment, minimum and maximum due dates, suggestions the best due date for the assignment of that course, considering what other assignments the students of this course have.     
 1.2. when given the college name, course name returns the score (avg number of assignments per student in the next 7 days) and assignments that the students have in the current week.  
2. A chrome extension for classroom that adds to these platforms the functionality of getting suggestions of release date and due date of an assignment/deadline. ([Repository](https://github.com/oshhh/google-classroom-extension))      
3. A mailer to send regular (weekly) mails to profs about how free/busy the students are in the coming week. ([Repository](https://github.com/oshhh/weekly-mailer))

hosted on heroku: `https://deadline-scheduling-suggestion.herokuapp.com/`    

## 1  Get Suggestions

### HTTP Request Format
`https://deadline-scheduling-suggestion.herokuapp.com/[college_name]/[course_name]/get_suggestions/[duration]/[min due date]/[max due date]` 

### Parameters
<ins>college_name</ins>    
`iiitd` is the only supported college name.   

#### course_name    
Name of the course for which suggestion for assignment deadline is required.  

#### duration    
The amount of time that the professor wants to give to the assignment.  
Format: `days-hours-minutes`     
Example: if the assignment is to be given 1 day 5 hrs for completion, duration = `1-5-0`     

#### min_due_date  
A range of allowed dates for the due date of the assignment is required. `min_due_date` is the earliest date that can be the due date of the assignment.    
Format: `YYYY-MM-DDTHH:mm:ss.sssZ`    
Example: if the assignment's due date to be between `2020-08-17, 5 PM` and `2020-08-20, 5 PM` then min_due_date = `2020-08-17T17:00:00.000Z`.   

#### max_due_date  
A range of allowed dates for the due date of the assignment is required. `max_due_date` is the farthest date that can be the due date of the assignment.    
Format: `YYYY-MM-DDTHH:mm:ss.sssZ`    
Example: if the professor wants the assignment's due date to be between `2020-08-17, 5 PM` and `2020-08-20, 5 PM` then max_due_date = `2020-08-20T17:00:00.000Z`.   

### Response
```
{
  suggestions: [
    {
      start_date: type- Date, 
      end_date: type- Date, 
      clash: {
        score: type - float, // avg number of assignments each student of this course has in this duration
        reason: [
          {
            course_name: type- string, 
            coursework_name: type- string,
            start_date: type- date,
            end_date: type- date,
          }, // assignment
          ... 
        ]// list of assignments
      }
    } // suggestion
    ...
  ] // list of suggestions
}
```

## 1  Student Schedule

### HTTP Request Format
`https://deadline-scheduling-suggestion.herokuapp.com/[college_name]/[course_name]/student_schedule/week`

### Response
```
{
  score: type - float, // avg number of assignments each student of this course has in this duration (week)
  reason: [
    {
      course_name: type- string, 
      coursework_name: type- string,
      start_date: type- date,
      end_date: type- date,
    }, // assignment
    ... 
  ]// list of assignments
}
```
