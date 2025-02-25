const { google } = require('googleapis');

async function getEmailContent(auth, messageId) {
    const gmail = google.gmail({ version: 'v1', auth });
    const res = await gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format: 'full',
    });
    // The email body may be base64 encoded
    const parts = res.data.payload.parts || [res.data.payload];
    let emailBody = '';
    parts.forEach(part => {
      if (part.mimeType === 'text/html') {
        emailBody += Buffer.from(part.body.data, 'base64').toString('utf8');
      }
    });
    return emailBody;
  }
  
  module.exports = { getEmailContent };