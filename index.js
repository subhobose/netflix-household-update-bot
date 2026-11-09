// index.js
const { getAuthenticatedClient } = require('./oauth2');
const { listNetflixEmails } = require('./fetchEmails');
const { getEmailContent } = require('./getEmailContent');
const { extractConfirmationLink } = require('./extractConfirmationLink');
const { markEmailAsRead } = require('./markEmailAsRead');
const { confirmNetflixHousehold } = require('./confirmNetflixHousehold');

async function processEmails() {
    try {
        const auth = await getAuthenticatedClient();
        const emails = await listNetflixEmails(auth);
        console.log(`Found ${emails.length} Netflix email(s).`);

        for (const email of emails) {
            try {
                const content = await getEmailContent(auth, email.id);
                const link = extractConfirmationLink(content);
                if (!link) {
                    console.log('No confirmation link found in email:', email.id);
                    continue;
                }
                console.log(`Clicking confirmation link: ${link}`);
                const confirmed = await confirmNetflixHousehold(link, auth);
                if (confirmed) {
                    // Only mark as read on success: a failed confirmation
                    // stays unread so the next run (5 min later) retries it
                    // while the 15-minute link is still alive.
                    await markEmailAsRead(auth, email.id);
                } else {
                    console.log(`Confirmation failed for email ${email.id}; leaving unread to retry.`);
                }
            } catch (emailError) {
                console.error(`Error processing email ${email.id}:`, emailError);
            }
        }
    } catch (error) {
      console.error('Error fetching emails:', error);
    }
  }

  processEmails();
