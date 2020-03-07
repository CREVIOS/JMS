var nodemailer = require('nodemailer');


    var transporter = nodemailer.createTransport('smtps://user%40gmail.com:pass@smtp.gmail.com');
    
    // setup e-mail data with unicode symbols
    function articleUpdated() {
        var mailOptions = {
            from: '"YSJournal" <submissions@ysjournal.com', // sender address
            to: '<%=author>, <%editor>',
            subject: 'You article has been updated', // Subject line
        
            html: '<p><b>Hi,</b><br>You article <%=article> has been updated to <%=status></p>' // html body
        };
    }
    // send mail with defined transport object
    transporter.sendMail(mailOptions, function(error, info){
        if(error){
            return console.log(error);
        }
        console.log('Message sent: ' + info.response);
    });