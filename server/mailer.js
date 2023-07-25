const fs = require('fs');
const hidden_data = require('./hidden_data');
const nodemailer = require('nodemailer');
const { google } = require('googleapis');
/*const OAuth2 = google.auth.OAuth2;
const oauth2Client = new OAuth2(
    hidden_data.oauth_id,
    hidden_data.oauth_secret,
    'https://developers.google.com/oauthplayground'
);
oauth2Client.setCredentials({

    refresh_token: hidden_data.oauth_refresh

});
const accessToken = oauth2Client.getAccessToken();
const smtpTransport = nodemailer.createTransport({
    service: "gmail",
    auth: {
        type: "OAuth2",
        user: hidden_data.email,
        clientId: hidden_data.oauth_id,
        clientSecret: hidden_data.oauth_secret,
        refreshToken: hidden_data.oauth_refresh,
        accessToken: accessToken,
        tls: {

            rejectUnauthorized: false

        }
    }
});
*/
function mail(heading, message, address) { // sends an email

    let mailOptions = {

        from: hidden_data.email, // the sender
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