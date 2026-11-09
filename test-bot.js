// Local tests for the fixed bot. No real Gmail/Netflix calls, no approvals.
// Run: node test-bot.js
const assert = require('assert');
const fs = require('fs');

// ---- 1. extractConfirmationLink against the REAL household email HTML ----
const { extractConfirmationLink } = require('./extractConfirmationLink');
const realHtml = fs.readFileSync(
  '/home/hatch/workspace/email/gmail/220a8f395a572fab8ca858d5f79e6769fe90a7310332921ba53b699ac3e461be.html',
  'utf8'
);
const link = extractConfirmationLink(realHtml);
console.log('1. extracted link:', link && link.slice(0, 80) + '...');
assert(link && link.startsWith('https://www.netflix.com/account/update-primary-location?nftoken='),
  'should extract the update-primary-location link from the real email');
assert(link.includes('operation=update'), 'link should carry operation=update');

// Fallback path: button text changed, href still update-primary-location.
const altered = realHtml.replace('Yes, this was me', 'Confirm this device');
assert(extractConfirmationLink(altered) === link, 'fallback should find the same link by URL');
console.log('   fallback (renamed button) OK');

// ---- 2. getEmailContent with a NESTED multipart payload ----
const { google } = require('googleapis');
const b64 = (s) => Buffer.from(s, 'utf8').toString('base64');
const nestedPayload = {
  mimeType: 'multipart/mixed',
  parts: [
    {
      mimeType: 'multipart/alternative',
      parts: [
        { mimeType: 'text/plain', body: { data: b64('plain text') } },
        { mimeType: 'text/html', body: { data: b64('<a href="https://x">Yes, this was me</a>') } },
      ],
    },
  ],
};
google.gmail = () => ({
  users: { messages: { get: async () => ({ data: { payload: nestedPayload } }) } },
});
const { getEmailContent } = require('./getEmailContent');
(async () => {
  const html = await getEmailContent({}, 'fake-id');
  assert(html.includes('Yes, this was me'), 'recursive walk should find nested text/html');
  console.log('2. getEmailContent nested MIME OK:', JSON.stringify(html));

  // ---- 3. getNetflixCode: finds the code, ignores other 4-digit numbers ----
  const codePayload = {
    mimeType: 'multipart/alternative',
    parts: [
      { mimeType: 'text/plain', body: { data: b64('Your Netflix sign-in code is 4821. This code expires in 15 minutes. (c) 2026 Netflix') } },
    ],
  };
  let markedRead = null;
  google.gmail = () => ({
    users: {
      messages: {
        list: async () => ({ data: { messages: [{ id: 'code-msg-1' }] } }),
        get: async () => ({ data: { payload: codePayload } }),
        modify: async ({ id }) => { markedRead = id; return {}; },
      },
    },
  });
  // getNetflixCode requires ./markEmailAsRead, which uses google.gmail too — already stubbed above.
  delete require.cache[require.resolve('./getNetflixCode')];
  delete require.cache[require.resolve('./markEmailAsRead')];
  const { getNetflixCode } = require('./getNetflixCode');
  const code = await getNetflixCode({});
  assert.strictEqual(code, '4821', `expected code 4821, got ${code}`);
  assert.strictEqual(markedRead, 'code-msg-1', 'code email should be marked read after use');
  console.log('3. getNetflixCode OK: code =', code);

  // ---- 4. puppeteer launches with the bot's CI args ----
  const puppeteer = require('puppeteer');
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
    headless: true,
  });
  const page = await browser.newPage();
  await page.goto('data:text/html,<button data-uia="set-primary-location-action">Confirm</button>', { waitUntil: 'domcontentloaded' });
  const btn = await page.$('button[data-uia="set-primary-location-action"]');
  assert(btn, 'confirm-button selector should match');
  await browser.close();
  console.log('4. puppeteer launch + selector check OK');

  console.log('\nALL TESTS PASSED');
})().catch((e) => { console.error('TEST FAILED:', e); process.exit(1); });
