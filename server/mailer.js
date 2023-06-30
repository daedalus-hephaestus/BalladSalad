const fs = require('fs');
const nodemailer = require('nodemailer');
const { google } = require('googleapis');
const OAuth2 = google.auth.OAuth2;
const oauth2Client = new OAuth2(
    '***REMOVED***',
    '***REMOVED***',
    'https://developers.google.com/oauthplayground'
);
oauth2Client.setCredentials({

    refresh_token: '***REMOVED***'

});
const accessToken = oauth2Client.getAccessToken();
const smtpTransport = nodemailer.createTransport({
    service: "gmail",
    auth: {
        type: "OAuth2",
        user: "daedalus.hephaestus@gmail.com",
        clientId: "***REMOVED***",
        clientSecret: "***REMOVED***",
        refreshToken: "***REMOVED***",
        accessToken: accessToken,
        tls: {

            rejectUnauthorized: false

        }
    }
});

function mail(heading, message, address) { // sends an email

    let mailOptions = {

        from: 'daedalus.hephaestus@gmail.com',
        to: address,
        subject: heading,
        generateTextFromHTML: true,
        html: message

    };

    smtpTransport.sendMail(mailOptions, (error, response) => {

        error ? console.log(error) : console.log(response);
        smtpTransport.close();
        
    });
    
}


module.exports = mail;