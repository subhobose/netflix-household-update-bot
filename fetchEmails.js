const { google } = require('googleapis');

async function listNetflixEmails(auth) {
    const gmail = google.gmail({ version: 'v1', auth });
    // Only look at recent requests: the confirmation link expires 15 minutes
    // after Netflix sends it, so anything older is already useless.
    // `after:` takes a unix epoch in seconds — verified live against Gmail:
    // `after:<now-30m>` returns only mail inside the window, while
    // `newer_than:15m` does NOT mean 15 minutes (`m` = months in Gmail
    // search), so never use newer_than here.
    const currentTime = new Date();
    const fifteenMinutesAgo = new Date(currentTime - 15 * 60 * 1000);
    const timestamp = Math.floor(fifteenMinutesAgo.getTime() / 1000);

    const res = await gmail.users.messages.list({
      userId: 'me',
      q: `from:info@account.netflix.com subject:"Important: How to update your Netflix household" is:unread after:${timestamp}`,
      maxResults: 5,
    });
    return res.data.messages || [];
  }

  module.exports = { listNetflixEmails };
