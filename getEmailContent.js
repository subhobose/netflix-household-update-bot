const { google } = require('googleapis');

// Gmail messages are usually nested multipart (e.g. multipart/mixed
// containing multipart/alternative containing text/plain + text/html).
// The old code only looked at top-level parts, so the text/html part was
// missed whenever it was nested one level down, and the bot extracted no
// link at all. Walk the whole MIME tree instead.
function collectHtmlParts(part, out) {
  if (part.mimeType === 'text/html' && part.body && part.body.data) {
    out.push(Buffer.from(part.body.data, 'base64').toString('utf8'));
  }
  if (Array.isArray(part.parts)) {
    for (const sub of part.parts) collectHtmlParts(sub, out);
  }
}

async function getEmailContent(auth, messageId) {
    const gmail = google.gmail({ version: 'v1', auth });
    const res = await gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format: 'full',
    });
    const chunks = [];
    collectHtmlParts(res.data.payload, chunks);
    return chunks.join('\n');
  }

  module.exports = { getEmailContent };
