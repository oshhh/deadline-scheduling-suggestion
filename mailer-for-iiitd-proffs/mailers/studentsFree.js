const nodemailer = require('../config/nodemailer');

exports.giveAssignment = (proff_mail, course_name) => {
    let htmlString = nodemailer.renderTemplate('/giveAssignment.ejs');
    nodemailer.transporter.sendMail({
        from : 'soumyadeepsp@gmail.com',
        to : proff_mail,
        subject : 'Students of the course '+course_name+' are free',
        html : htmlString,
    }, (err, info) => {
        if (err) {
            console.log('Error in sending mail: '+err);
            return;
        }
        console.log('Message sent');
    });
}