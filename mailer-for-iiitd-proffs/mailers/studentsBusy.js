const nodemailer = require('../config/nodemailer');

exports.dontGiveAssignment = (proff_mail, course_name) => {
    let htmlString = nodemailer.renderTemplate('/dontGiveAssignment.ejs');
    nodemailer.transporter.sendMail({
        from : 'soumyadeepsp@gmail.com',
        to : proff_mail,
        subject : 'Students of the course '+course_name+' are busy',
        html : htmlString,
    }, (err, info) => {
        if (err) {
            console.log('Error in sending mail: '+err);
            return;
        }
        console.log('Message sent');
    });
}