const AWS = require('aws-sdk');
const mustache = require('mustache');
const fs = require('fs');

function sendEmail(email, type = 'text', subject, body) {
  var params = {
    Destination: { /* required */
      ToAddresses: [
        email,
      ]
    },
    Message: {
      Body: {
       },
       Subject: {
        Charset: 'UTF-8',
        Data: subject
       }
      },
    Source: 'irw.vanroosmalen@gmail.com',
    ReplyToAddresses: [
       'irw.vanroosmalen@gmail.com'
    ],
  };

  if(type === 'html') {
      params.Message.Body = {
          Html: {
           Charset: "UTF-8",
           Data: body
          }
      }
  } else {
    params.Message.Body = {
        Text: {
         Charset: "UTF-8",
         Data: body
        }
    }
  }

  return new AWS.SES({apiVersion: '2010-12-01'}).sendEmail(params).promise();
}

async function sendRegistrationEmail(email, link) {
  let file = await fs.readFileSync('./src/emailTemplates/registration.html', "utf8");
  let body = mustache.render(file, { link })

  return sendEmail(email, 'html', 'Welcome to Armada!', body)
}

async function sendForgotPasswordEmail(email, password) {
  let link = 'login link';
  let file = await fs.readFileSync('./src/emailTemplates/forgotPassword.html', "utf8");
  let body = mustache.render(file, { link, password })
  console.log("COOL", body)
  return sendEmail(email, 'html', 'Armamda - Password reset', body)
}

module.exports = {
    sendRegistrationEmail,
    sendForgotPasswordEmail
}
