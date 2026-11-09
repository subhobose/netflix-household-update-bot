const cheerio = require('cheerio');

function extractConfirmationLink(emailHtml) {
 // Load the email's HTML content into Cheerio
 const $ = cheerio.load(emailHtml);

 // The button in the real Netflix mail reads "Yes, this was me" (verified
 // against a live household-update email). Match it tolerantly — extra
 // whitespace or a case change in a future mail shouldn't break the bot.
 let confirmationLink = null;
 $('a').each((i, el) => {
   const linkText = $(el).text().replace(/\s+/g, ' ').trim().toLowerCase();
   if (linkText === 'yes, this was me') {
     confirmationLink = $(el).attr('href');
     return false; // Break out of the loop once found
   }
 });

 // Fallback: the confirmation URL always points at Netflix's
 // update-primary-location page, whatever the button text says.
 if (!confirmationLink) {
   $('a').each((i, el) => {
     const href = $(el).attr('href') || '';
     if (href.includes('netflix.com/account/update-primary-location')) {
       confirmationLink = href;
       return false;
     }
   });
 }

 return confirmationLink;
}

module.exports = { extractConfirmationLink };
