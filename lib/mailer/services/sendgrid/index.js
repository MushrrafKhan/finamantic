const sendgrid = require('@sendgrid/mail');

sendgrid.setApiKey(process.env.SENDGRID_API_KEY);
const fs = require("fs");
console.log(`${__dirname}`);
let pathToAttachment = `${__dirname}`+'/contract/contract.docx';
let attachment = fs.readFileSync(pathToAttachment).toString("base64");
const sendMail = (to, from, subject,html,type) => (type && type=='attachment') ? sendgrid.send({ to, from, subject, html,
    attachments: [
        {
          content: attachment,
          filename: "contract.docx",
          type: "application/docx",
          disposition: "attachment"
        }
      ]

}) : sendgrid.send({ to, from, subject, html});

module.exports = sendMail;
