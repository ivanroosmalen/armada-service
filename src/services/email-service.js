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

async function sendRegistrationEmail(email, password, locale = 'en') {
  let file = await fs.readFileSync(`./src/emailTemplates/registration-${locale}.html`, "utf8");
  let body = mustache.render(file, { password })
  return sendEmail(email, 'html', locale === 'en' ? 'Welcome to Armada!' : 'Bem vindo a Armada!', body)
}

async function sendForgotPasswordEmail(email, password, locale = 'en') {
  let file = await fs.readFileSync(`./src/emailTemplates/forgotPassword-${locale}.html`, "utf8");
  let body = mustache.render(file, { password })
  return sendEmail(email, 'html', locale === 'en' ? 'Armada - Password reset' : 'Armada - Redefinição de senha', body)
}

module.exports = {
    sendRegistrationEmail,
    sendForgotPasswordEmail
}
