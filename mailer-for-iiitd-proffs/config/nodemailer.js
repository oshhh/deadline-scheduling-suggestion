const nodemailer = require('nodemailer');
const path = require('path');
const ejs = require('ejs');

let transporter = nodemailer.createTransport({
    service : 'gmail',
    host : 'smtp.gmail.com',
    port : 587,
    secure : false,
    auth : {
        user : '',
        pass : ''
    }
});

let renderTemplate = (relativePath) => {
    let mailHTML;
    ejs.renderFile(
        path.join(__dirname, '../views/mailers', relativePath),
        function(err, template) {
            if (err) {
                console.log('Error in running the template: '+err);
                return;
            }
            mailHTML = template;
        }
    )
    return mailHTML;
}

module.exports = {
    transporter : transporter,
    renderTemplate : renderTemplate
}