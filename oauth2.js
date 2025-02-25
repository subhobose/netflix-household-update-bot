//oauth2.js

const { google } = require('googleapis');

// Load credentials from environment variables
const client_id = process.env.GOOGLE_CLIENT_ID;
const client_secret = process.env.GOOGLE_CLIENT_SECRET;
const redirect_uri = process.env.GOOGLE_REDIRECT_URI;



// Create an OAuth2 client with your credentials
const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uri);

// Read token.json and set credentials
// Function to get an authenticated client
function getAuthenticatedClient() {
  return new Promise((resolve, reject) => {
    try {
      retrievedToken = process.env.GOOGLE_TOKEN;
      formattedToken = retrievedToken.replace(/([{,])\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":').replace(/:\s*([a-zA-Z0-9_]+)\s*(?=[,}])/g, ':"$1"');
      console.log(formattedToken);
      const token = JSON.parse(formattedToken);
      oAuth2Client.setCredentials(token);
      resolve(oAuth2Client);
    } catch (error) {
      reject('Error parsing GOOGLE_TOKEN: ' + error);
    }
  });
}

module.exports = { getAuthenticatedClient }