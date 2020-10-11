const AWS = require('aws-sdk');
const mustache = require('mustache');
const fs = require('fs');

function sendEmail(emails, type = 'text', subject, body) {
  var params = {
    Destination: { /* required */
      BccAddresses: emails
    },
    Message: {
      Body: {
       },
       Subject: {
        Charset: 'UTF-8',
        Data: subject
       }
      },
    Source: 'Armada MA <noreply@armadama.com>',
    ReplyToAddresses: [
       'noreply@armadama.com'
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
  return sendEmail([ email ], 'html', locale === 'en' ? 'Welcome to Armada!' : 'Bem vindo a Armada!', body)
}

async function sendForgotPasswordEmail(email, password, locale = 'en') {
  let file = await fs.readFileSync(`./src/emailTemplates/forgotPassword-${locale}.html`, "utf8");
  let body = mustache.render(file, { password })
  return sendEmail([ email ], 'html', locale === 'en' ? 'Armada - Password reset' : 'Armada - Redefinição de senha', body)
}

async function sendNotificationEmail(emails, notification, locale = 'en') {
  let file = await fs.readFileSync(`./src/emailTemplates/notification-${locale}.html`, "utf8");
  let body = mustache.render(file, { academyName: notification.academy.name, message: notification.message.replace(/\n/g, "<br />") })
  return sendEmail(emails, 'html', `Message from ${notification.academy.name} - Armada`, body)
}

async function sendSubscriptionEmail(emails, academy = {}, locale = 'en') {
  let file = await fs.readFileSync(`./src/emailTemplates/subscription-${locale}.html`, "utf8");
  let body = mustache.render(file, { academyName: academy.name, memberLimit: (academy.memberLimit === 10000 ? 'unlimited' : academy.memberLimit) } )
  return sendEmail(emails, 'html', locale === 'en' ? 'Armada subscription created / updated' : 'Assinatura da Armada criada / atualizada', body)
}

async function sendSubscriptionCancelledEmail(emails, academy = {}, locale = 'en') {
  let file = await fs.readFileSync(`./src/emailTemplates/subscriptionCancel-${locale}.html`, "utf8");
  let body = mustache.render(file, { academyName: academy.name })
  return sendEmail(emails, 'html', locale === 'en' ? 'Armada subscription cancelled' : 'Assinatura cancelada', body)
}

async function sendIncompleteSubscriptionEmail(emails, academy, locale = 'en') {
  let file = await fs.readFileSync(`./src/emailTemplates/badSubscription-${locale}.html`, "utf8");
  let body = mustache.render(file, { academyName: academy.name, academyId: academy._id })
  return sendEmail(emails, 'html', 'Subscription incomplete', body)
}

async function sendRegistrationFromAcademyEmail(emails, data, locale = 'en') {
  let file = await fs.readFileSync(`./src/emailTemplates/registrationFromAcademy-${locale}.html`, "utf8");
  let body = mustache.render(file, { password: data.newPassword, academyName: data.academy.name })
  return sendEmail(emails, 'html', locale === 'en' ? `${data.academy.name} membership - Welcome to Armada MA!` : `Filiação de ${data.academy.name} - Bem vindo a Armada MA!`, body)
}

async function sendJoinFromAcademyEmail(emails, data, locale = 'en') {
  let file = await fs.readFileSync(`./src/emailTemplates/joinFromAcademy-${locale}.html`, "utf8");
  let body = mustache.render(file, { academyName: data.academy.name })
  return sendEmail(emails, 'html', locale === 'en' ? `You are now a member of ${data.academy.name} - Armada MA` : `Você agora é um membro de ${data.academy.name} - Armada MA`, body)
}

module.exports = {
    sendRegistrationEmail,
    sendForgotPasswordEmail,
    sendNotificationEmail,
    sendSubscriptionEmail,
    sendSubscriptionCancelledEmail,
    sendIncompleteSubscriptionEmail,
    sendRegistrationFromAcademyEmail,
    sendJoinFromAcademyEmail
}
