const axios = require('axios');
const cheerio = require('cheerio');


async function clickConfirmationLink(link) {
    try {
      // Simulate a browser GET request
      const response = await axios.get(link);
      console.log('Initial confirmation clicked, response status:', response.status);

      // Step 2: Parse the response HTML to locate the "Confirm Update" hyperlink
    const html = response.data;
    const $ = cheerio.load(html);
    let confirmUpdateLink = null;
    $('a').each((i, el) => {
      const text = $(el).text().trim();
      if (text === 'Confirm Update') {
        confirmUpdateLink = $(el).attr('href');
        return false; // Exit the loop once the link is found
      }
    });
    if (confirmUpdateLink) {
        console.log(`Found "Confirm Update" link: ${confirmUpdateLink}`);
        // Step 3: Simulate clicking the "Confirm Update" link
        const confirmResponse = await axios.get(confirmUpdateLink);
        console.log('Final confirmation clicked, response status:', confirmResponse.status);
      } else {
        console.log('No "Confirm Update" link found on the page.');
      }
    } catch (error) {
      console.error('Error clicking confirmation link:', error.message);
    }
  }
  
  module.exports = { clickConfirmationLink };