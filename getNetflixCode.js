const { google } = require('googleapis');
const { markEmailAsRead } = require('./markEmailAsRead');

async function getNetflixCode(auth) {
    const gmail = google.gmail({ version: 'v1', auth });

    // Set timestamp range to last 15 mins
    const currentTime = new Date();
    const twoMinutesAgo = new Date(currentTime - 2 * 60 * 1000); // 5 minutes ago
    const timestamp = Math.floor(twoMinutesAgo.getTime() / 1000); // Convert to seconds

    const res = await gmail.users.messages.list({
      userId: 'me',
      q: `from:info@account.netflix.com subject:"Netflix: your sign-in code" is:unread after:${timestamp}`, // adjust query as needed
      // q: 'from:info@account.netflix.com subject:"Netflix: your sign-in code" is:unread', // adjust query as needed
      maxResults: 1
    });

    if (!res.data.messages) {
      console.log("No sign-in code email found.");
      return null;
    }

    const messageId = res.data.messages[0].id;
    const message = await gmail.users.messages.get({
        userId: 'me',
        id: messageId
    });
    const payload = message.data.payload;
    const bodyData = payload.parts.find(part => part.mimeType === 'text/plain' || part.mimeType === 'text/html');
    const emailBody = bodyData ? Buffer.from(bodyData.body.data, 'base64').toString() : 'No body content found';

    const codeMatch = emailBody.match(/\b\d{4}\b/);  // Look for a 4-digit code
    await markEmailAsRead(auth, messageId); //not working
    return codeMatch ? codeMatch[0] : null;
}
  
  module.exports = { getNetflixCode };