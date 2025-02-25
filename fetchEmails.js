const { google } = require('googleapis');

async function listNetflixEmails(auth) {
    const gmail = google.gmail({ version: 'v1', auth });
    // Set timestamp range to last 15 mins
    const currentTime = new Date();
    const fifteenMinutesAgo = new Date(currentTime - 15 * 60 * 1000); // 15 minutes ago
    const timestamp = Math.floor(fifteenMinutesAgo.getTime() / 1000); // Convert to seconds

    const res = await gmail.users.messages.list({
      userId: 'me',
      q: `from:info@account.netflix.com subject:"Important: How to update your Netflix household" is:unread after:${timestamp}`, // adjust query as needed
      // q: 'from:info@account.netflix.com subject:"Important: How to update your Netflix household" is:unread', // adjust query as needed
      maxResults: 1,
    });
    return res.data.messages || [];
  }
  
  module.exports = { listNetflixEmails };