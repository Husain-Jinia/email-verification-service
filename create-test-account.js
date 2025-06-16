const nodemailer = require('nodemailer');

async function createTestAccount() {
    const testAccount = await nodemailer.createTestAccount();
    console.log('Test Account:', {
        user: testAccount.user,
        pass: testAccount.pass,
        smtp: testAccount.smtp
    });
}

createTestAccount();
