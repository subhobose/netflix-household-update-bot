const { google } = require('googleapis');
const { markEmailAsRead } = require('./markEmailAsRead');

// Same nested-MIME problem as getEmailContent: the text part can sit inside
// multipart/alternative, and a message may have no `parts` array at all
// (single-part body straight on the payload). Walk the tree and take the
// first text/plain part, falling back to text/html.
function collectTextParts(part, out) {
  if ((part.mimeType === 'text/plain' || part.mimeType === 'text/html')
      && part.body && part.body.data) {
    out.push({
      mimeType: part.mimeType,
      text: Buffer.from(part.body.data, 'base64').toString('utf8'),
    });
  }
  if (Array.isArray(part.parts)) {
    for (const sub of part.parts) collectTextParts(sub, out);
  }
}

async function getNetflixCode(auth) {
    const gmail = google.gmail({ version: 'v1', auth });

    // `after:` takes a unix epoch in seconds — verified live against Gmail.
    // Do NOT use `newer_than:10m` here: in Gmail search `m` = months,
    // so that would match everything from the last 10 months.
    const currentTime = new Date();
    const twoMinutesAgo = new Date(currentTime - 2 * 60 * 1000);
    const timestamp = Math.floor(twoMinutesAgo.getTime() / 1000);

    const res = await gmail.users.messages.list({
      userId: 'me',
      q: `from:info@account.netflix.com subject:"Netflix: your sign-in code" is:unread after:${timestamp}`,
      maxResults: 1
    });

    if (!res.data.messages || res.data.messages.length === 0) {
      console.log("No sign-in code email found.");
      return null;
    }

    const messageId = res.data.messages[0].id;
    const message = await gmail.users.messages.get({
        userId: 'me',
        id: messageId
    });
    const parts = [];
    collectTextParts(message.data.payload, parts);
    const plain = parts.find(p => p.mimeType === 'text/plain');
    const emailBody = plain ? plain.text : (parts[0] ? parts[0].text : '');
    if (!emailBody) {
      console.log("Sign-in code email had no readable body.");
      return null;
    }

    // The code email says something like "Your sign-in code is 1234".
    // Prefer a 4-digit number near the word "code" so a year or other
    // 4-digit number elsewhere in the mail can't be mistaken for it.
    const nearCode = emailBody.match(/code[^0-9]{0,40}(\d{4})/i);
    const codeMatch = nearCode || emailBody.match(/\b\d{4}\b/);
    if (codeMatch) {
      await markEmailAsRead(auth, messageId);
      return codeMatch[1] || codeMatch[0];
    }
    return null;
}

  module.exports = { getNetflixCode };
