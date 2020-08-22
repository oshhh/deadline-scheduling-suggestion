const studentsFreeMailer = require('../mailers/studentsFree');
const studentsBusyMailer = require('../mailers/studentsBusy');

module.exports.giveAssisgnment = function(req, res) {
    console.log(req.params.data);
    var data = req.params.data;
    var data_array = data.split("&");
    var proff_mail = data_array[0];
    var course_name = data_array[1];
    studentsFreeMailer.giveAssignment(proff_mail, course_name);
    return res.send("Mail send to professor saying students are free");
}

module.exports.dontGiveAssignment = function(req, res) {
    console.log(req.params.data);
    var data = req.params.data;
    var data_array = data.split("&");
    var proff_mail = data_array[0];
    var course_name = data_array[1];
    studentsBusyMailer.dontGiveAssignment(proff_mail, course_name);
    return res.send("Mail send to professor saying students are busy");
}