var nodemailer = require('nodemailer');
// var transporter = nodemailer.createTransport('smtps://user%40gmail.com:pass@smtp.gmail.com');
require('dotenv').config()
var transporter = nodemailer.createTransport("SMTP", {
    service: "gmail",
    auth: {
        user: process.env.MAILER_EMAIL,
        pass: process.env.MAILER_PASSWORD
    }
});

module.exports = {
    signup: function(email, code) {
        var mailOptions = {
            from: '"YSJournal" <submissions@ysjournal.com', // sender address
            to: email,
            subject: 'Welcome to the YSJ', // Subject line
            html: '<p>Hi,<br>We signed you up to our Journal Management System (JMS). Please click on the following link to complete your registration. <br> https://manage.ysjournal.com/signup?code=' + code +'&email=' + email + '<br> If you encounter technical issues please contact technicalissues@ysjournal.com.</p>' // html body
        };
        module.exports.sendEmail(mailOptions);
        console.log("Email for code sent to" + email);
    },

    // setup e-mail data with unicode symbols
    articleUpdated: function(author, editor, article, status) {
        var mailOptions = {
            from: '"YSJournal" <submissions@ysjournal.com', // sender address
            to: author + ',' + editor,
            subject: 'You article has been updated', // Subject line
        
            html: '<p><b>Hi,</b><br>You article ' + article + ' has been updated to ' + status + '</p>' // html body
        };
        module.exports.sendEmail(mailOptions);
        console.log("Email Sent to" + author + editor);
    },

    sendEmail: function(mailOptions) {
        // send mail with defined transport object
        transporter.sendMail(mailOptions, function(error, info){
            if(error){
                return console.log(error);
            }
            console.log('Message sent: ' + info.response);
        });
    },

    newEditor: function(email, title) {
        var mailOptions = {
            from: '"YSJournal" <submissions@ysjournal.com', // sender address
            to: email,
            subject: 'New article assigned', // Subject line
        
            html: '<p><b>Hi,</b><br>You have been assigned the article: ' + title + '</p>' // html body
        }

        module.exports.sendEmail(mailOptions);
    },

    trackerAlert: function() {

    }
};
