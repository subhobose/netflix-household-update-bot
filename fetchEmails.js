const { google } = require('googleapis');

async function listNetflixEmails(auth) {
    const gmail = google.gmail({ version: 'v1', auth });
    const res = await gmail.users.messages.list({
      userId: 'me',
      q: 'from:info@account.netflix.com subject:"Important: How to update your Netflix household" is:unread', // adjust query as needed
    });
    return res.data.messages || [];
  }
  
  module.exports = { listNetflixEmails };