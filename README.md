# netflix-household-update-bot

Bot to avoid doing that annoying household update yourself. It checks your
Gmail periodically and confirms household updates, if any.

## How it works

1. GitHub Actions runs `node index.js` every 5 minutes.
2. `fetchEmails.js` lists unread mail from `info@account.netflix.com` with
   subject "Important: How to update your Netflix household" from the last
   15 minutes (the confirmation link expires after 15 minutes).
3. `extractConfirmationLink.js` pulls the "Yes, this was me" link out of the
   email (falls back to any `netflix.com/account/update-primary-location`
   link if Netflix ever renames the button).
4. `confirmNetflixHousehold.js` opens the link in headless Chrome. If you're
   not signed in, it switches to "Sign in with Code", enters your email,
   reads the 4-digit code out of your Gmail (`getNetflixCode.js`), signs in,
   then clicks the "Confirm Update" button.
5. Only on success is the email marked as read, so a failed attempt is
   retried on the next run while the link is still alive.

## Setup

1. `npm ci` (installs dependencies, including the Chrome build Puppeteer uses).
2. Follow the Gmail API setup docs and create a Google Cloud OAuth client.
3. Set these secrets in the repo (Settings → Secrets and variables →
   Actions) — the workflow reads them as environment variables:
   - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`
   - `GOOGLE_TOKEN` — the full token JSON **including `refresh_token`**, or
     auth breaks once the access token expires (~1 hour)
   - `NETFLIX_EMAIL` — the email address on the Netflix account
4. Local run: create a `.env` with the same values and run `node index.js`.
   (`.env`, `token.json` and `credentials.json` are gitignored — never
   commit them.)

## Tests

`npm test` runs `test-bot.js`: link extraction against a real Netflix
household email, nested-MIME body parsing, sign-in code extraction, and a
Puppeteer launch check. No real Gmail or Netflix calls, nothing is approved.

## Notes

- Run times can vary: GitHub's scheduled workflows don't always fire
  exactly on the 5-minute mark, and the link only lives 15 minutes, so an
  approval can occasionally be missed if Actions is delayed.
- `clickConfirmationLink.js` is unused (plain HTTP can't drive Netflix's
  JS confirm page) — the Puppeteer flow in `confirmNetflixHousehold.js` is
  the live path.
