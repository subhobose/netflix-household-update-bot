require('dotenv').config();
const puppeteer = require('puppeteer');
const { getNetflixCode } = require('./getNetflixCode');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Returns true when the household update was confirmed, false otherwise.
// Callers must only mark the email as read on true — the old code swallowed
// every failure and the caller marked the mail read anyway, so a failed
// approval was never retried.
async function confirmNetflixHousehold(confirmationLink, auth) {
    const browser = await puppeteer.launch({
        // --disable-dev-shm-usage is required in GitHub Actions: the default
        // /dev/shm is tiny there and Chrome crashes without it.
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
        headless: true,
    });
    const page = await browser.newPage();

    try {
        console.log('Opening confirmation link');
        await page.goto(confirmationLink, { waitUntil: 'domcontentloaded', timeout: 60000 });

        // Are we already on the household-confirm page (signed-in session)?
        // NOTE: the old code checked `confirmUpdateBtn.length < 0`, which is
        // never true for an array, so the sign-in flow below NEVER ran and
        // every run died waiting 100s for a button on the login page.
        let confirmBtn = null;
        try {
            confirmBtn = await page.waitForSelector(
                'button[data-uia="set-primary-location-action"]', { timeout: 15000 });
        } catch {
            confirmBtn = null; // not signed in yet — fall through to login
        }

        if (!confirmBtn) {
            // Step 1: switch the login form to "Sign in with Code"
            const toggle = await page.waitForSelector(
                'button[data-uia="login-toggle-button"]', { timeout: 60000 });
            console.log("Clicking 'Sign in with Code'...");
            await toggle.click();
            await sleep(2000);

            // Step 2: enter the account email and request a sign-in code
            console.log('Entering email...');
            await page.waitForSelector('input[name="userLoginId"]', { timeout: 30000 });
            await page.type('input[name="userLoginId"]', process.env.NETFLIX_EMAIL, { delay: 100 });
            await page.click('button[type="submit"]');
            await sleep(2000); // wait for the code email to arrive

            // Step 3: retrieve the sign-in code from Gmail (poll up to ~100s)
            console.log('Waiting for sign-in code...');
            let signInCode = null;
            let attempts = 0;
            while (!signInCode && attempts < 10) {
                signInCode = await getNetflixCode(auth);
                if (!signInCode) {
                    console.log('Sign-in code not received yet, retrying...');
                    await sleep(10000);
                }
                attempts++;
            }

            if (!signInCode) {
                console.log('Failed to retrieve sign-in code.');
                return false;
            }

            console.log(`Received sign-in code: ${signInCode}`);

            // Step 4: enter the sign-in code and submit
            console.log('Entering sign-in code...');
            await page.waitForSelector('input[name="otp"]', { timeout: 30000 });
            await page.type('input[name="otp"]', signInCode, { delay: 100 });
            await page.click('button[type="submit"]');
            await sleep(3000);
        }

        // Step 5: click "Confirm Update" on the household page
        console.log("Finding 'Confirm Update' button...");
        confirmBtn = await page.waitForSelector(
            'button[data-uia="set-primary-location-action"]', { timeout: 60000 });
        console.log("Clicking 'Confirm Update'...");
        await confirmBtn.click();
        await sleep(3000);
        console.log('Household confirmation successful!');
        return true;
    } catch (error) {
        console.error('Error during Netflix household confirmation:', error);
        return false;
    } finally {
        await browser.close();
    }
}

module.exports = { confirmNetflixHousehold };
