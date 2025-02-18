//oauth2.js
const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

// Path to your credentials and token files
const CREDENTIALS_PATH = path.join(__dirname, 'credentials.json');
const TOKEN_PATH = path.join(__dirname, 'token.json');

// Load client credentials from credentials.json
const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH));
const { client_id, client_secret, redirect_uris } = credentials.installed;

// Create an OAuth2 client with your credentials
const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

// Read token.json and set credentials
function getAuthenticatedClient() {
  return new Promise((resolve, reject) => {
    fs.readFile(TOKEN_PATH, (err, token) => {
      if (err) {
        reject('Error reading token.json: ' + err);
      } else {
        oAuth2Client.setCredentials(JSON.parse(token));
        resolve(oAuth2Client);
      }
    });
  });
}

module.exports = { getAuthenticatedClient };