const { google } = require('googleapis');


async function markEmailAsRead(auth, messageId) {
    const gmail = google.gmail({ version: 'v1', auth });
    try{
        await gmail.users.messages.modify({
          userId: 'me',
          id: messageId,
          requestBody: {
            removeLabelIds: ['UNREAD'],
          },
        });
        console.log(`Email ${messageId} marked as read.`);
      } catch (error) {
        console.error(`Failed to mark email as read: ${error.message}`);
    }
  }
  
  module.exports = { markEmailAsRead };