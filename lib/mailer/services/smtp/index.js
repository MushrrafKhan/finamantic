const nodeMailer = require('nodemailer');

const transport = nodeMailer.createTransport({
    pool: true,
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE.toLowerCase() === 'true',
    service: process.env.SMTP_SERVICE,
    auth: {
        user: process.env.SMTP_USERNAME,
        pass: process.env.SMTP_PASSWORD,
    },
});

const sendMail = (to, from, subject, html) => transport.sendMail({ to, from, subject, html });

module.exports = sendMail;
