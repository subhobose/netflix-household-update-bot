// index.js
const { getAuthenticatedClient } = require('./oauth2');
const { listNetflixEmails } = require('./fetchEmails');
const { getEmailContent } = require('./getEmailContent');
const { extractConfirmationLink } = require('./extractConfirmationLink');
const { clickConfirmationLink } = require('./clickConfirmationLink');
const { markEmailAsRead } = require('./markEmailAsRead');




async function processEmails() {
    try {
        const auth = await getAuthenticatedClient();
        const emails = await listNetflixEmails(auth);
        console.log(`Found ${emails.length} Netflix email(s).`);

        for (const email of emails) {
            const content = await getEmailContent(auth, email.id);
            const link = extractConfirmationLink(content);
            if (link) {
              console.log(`Clicking confirmation link: ${link}`);
              await clickConfirmationLink(link);
              await markEmailAsRead(auth, email.id);
            }
            else {
                console.log('No confirmation link found in email:', email.id);
              }
            }
    } catch (error) {
      console.error('Error fetching emails:', error);
    }
  }
  
  processEmails();