const { google } = require('googleapis');


async function markEmailAsRead(auth, messageId) {
    const gmail = google.gmail({ version: 'v1', auth });
    await gmail.users.messages.modify({
      userId: 'me',
      id: messageId,
      requestBody: {
        removeLabelIds: ['UNREAD'],
      },
    });
  }
  
  module.exports = { markEmailAsRead };