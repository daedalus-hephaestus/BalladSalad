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

    refresh_token: '1//04PNeVUXKmtAoCgYIARAAGAQSNwF-L9IrxYTRok4a_iS2P9xdc45MGI-455HopBhjo2sZ4k5vmXszPNxFS0Hw4TppkuPvcXMwWlM'

});
const accessToken = oauth2Client.getAccessToken();
const smtpTransport = nodemailer.createTransport({
    service: "gmail",
    auth: {
        type: "OAuth2",
        user: "daedalus.hephaestus@gmail.com",
        clientId: "***REMOVED***",
        clientSecret: "***REMOVED***",
        refreshToken: "1//04PNeVUXKmtAoCgYIARAAGAQSNwF-L9IrxYTRok4a_iS2P9xdc45MGI-455HopBhjo2sZ4k5vmXszPNxFS0Hw4TppkuPvcXMwWlM",
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