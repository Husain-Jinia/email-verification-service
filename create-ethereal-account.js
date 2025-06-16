const nodemailer = require('nodemailer');

async function createAccount() {
    try {
        const testAccount = await nodemailer.createTestAccount();
        console.log('Test Account Created:', {
            user: testAccount.user,
            pass: testAccount.pass,
            smtp: testAccount.smtp,
            web: testAccount.web
        });
    } catch (error) {
        console.error('Error creating test account:', error);
    }
}

createAccount();
