'use strict';
const nodemailer = require('nodemailer');
const config = require('../config.json');

// Generate test SMTP service account from ethereal.email
// Only needed if you don't have a real mail account for testing
// nodemailer.createTestAccount((err, account) => {
function sendMail(subject, message) {
    //替换\n
    let mailBody = message;
    let regExp = /\x0a/g; //匹配\n
    if (message && message != undefined) {
        mailBody = message.replace(regExp, `</p><p>`);
    }
    // create reusable transporter object using the default SMTP transport
    let mailConfig = config.mail;
    let transporter = nodemailer.createTransport(mailConfig);

    // setup email data with unicode symbols
    let mailOptions = {
        from: '"EOS Monitor" <motorfriends@163.com>', // sender address
        to: 'qiushaoxi@163.com', // list of receivers
        subject: subject, // Subject line
        //text: 'Hello world?', // plain text body
        html: `<h1>EOS NODE WARNING:</h1>
        <p>`+ mailBody + `</p>`
        //html: '<b>Hello world?</b>' // html body
        //text: message
        //, // plain text body
        //html: '<b>Hello world?</b>' // html body
    };

    // send mail with defined transport object
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log(error);
        }
        console.log('Message sent: %s', info.messageId);
        // Preview only available when sending through an Ethereal account
        // console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));

        // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@blurdybloop.com>
        // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
    });
}

exports.sendMail = sendMail;