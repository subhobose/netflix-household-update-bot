const cheerio = require('cheerio');

function extractConfirmationLink(emailHtml) {
 // Load the email's HTML content into Cheerio
 const $ = cheerio.load(emailHtml);

 // Find an anchor tag (<a>) with the exact button text
 let confirmationLink = null;
 $('a').each((i, el) => {
   const linkText = $(el).text().trim();
   if (linkText === 'Yes, this was me') {
     confirmationLink = $(el).attr('href');
     return false; // Break out of the loop once found
   }
 });

 return confirmationLink;
}

module.exports = { extractConfirmationLink };