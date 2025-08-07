require('dotenv').config();
const puppeteer = require('puppeteer');
const { getNetflixCode } = require('./getNetflixCode');
const { timeout } = require('puppeteer');



async function confirmNetflixHousehold(confirmationLink, auth) {
    const browser = await puppeteer.launch({ 
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--js-flags="--max-old-space-size=256"'], // Arguments for Chromium
        headless: true }); // Set headless: true for silent execution
    const page = await browser.newPage();
    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    try {
        console.log(`Opening confirmation link`);
        await page.goto(confirmationLink, { waitUntil: 'networkidle2' });

        let confirmUpdateBtn = await page.$$('button[data-uia="set-primary-location-action"]');

        if (confirmUpdateBtn.length<0){
        
            // Step 1: Click "Sign in with Code"
            await page.waitForSelector('button[data-uia="login-toggle-button"]', {timeout: 100000});
            const signInWithCodeBtn = await page.$$('button[data-uia="login-toggle-button"]');
            
            if (signInWithCodeBtn.length > 0) {
                console.log("Clicking 'Sign in with Code'...");
                await signInWithCodeBtn[0].click();
                // await page.waitForNavigation({ waitUntil: 'networkidle2' });
                await sleep(2000);
            } else {
                console.log("Already signed in?");
            }

            // Step 2: Enter email and request sign-in code
            console.log("Entering email...");
            await page.type('input[name="userLoginId"]', process.env.NETFLIX_EMAIL, { delay: 100 });
            await page.click('button[type="submit"]'); // Click next/request code button
            await sleep(2000) // Wait for the email to arrive

            // Step 3: Retrieve the sign-in code from Gmail
            console.log("Waiting for sign-in code...");
            let signInCode = null;
            let attempts = 0;
            while (!signInCode && attempts < 10) {
                signInCode = await getNetflixCode(auth);
                if (!signInCode) {
                    console.log("Sign-in code not received yet, retrying...");
                    // await page.waitForTimeout(5000); // Wait 5 seconds before retrying
                    await sleep(10000);
                }
                attempts++;
            }

            if (!signInCode) {
                console.log("Failed to retrieve sign-in code.");
                await browser.close();
                return;
            }

            console.log(`Received sign-in code: ${signInCode}`);

            // Step 4: Enter the sign-in code and submit
            console.log("Entering sign-in code...");
            await page.type('input[name="otp"]', signInCode, { delay: 1000 });
            await page.click('button[type="submit"]'); // Click login button
            await page.waitForNavigation({ waitUntil: 'networkidle2' });
        }

        // Step 5: Click "Confirm Update"
        console.log("Finding 'Confirm Update' button...");
        await page.waitForSelector('button[data-uia="set-primary-location-action"]', {timeout: 100000});
        confirmUpdateBtn = await page.$$('button[data-uia="set-primary-location-action"]');

        if (confirmUpdateBtn.length > 0) {
            console.log("Clicking 'Confirm Update'...");
            await confirmUpdateBtn[0].click();
            await sleep(3000);
            console.log("Household confirmation successful!");
        } else {
            console.log("No 'Confirm Update' button found.");
        }
    }
    catch (error){
        console.error("Error during Netflix household confirmation:", error);
    }
    finally{
        await browser.close();
    }

}
module.exports = { confirmNetflixHousehold };   