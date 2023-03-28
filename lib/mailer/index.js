//require('custom-env').env('api');
const Email = require('email-templates');
const path = require('path');
//require('dotenv').config();
//console.log('mailservice',process.env);

if (['smtp', 'sendgrid'].indexOf(process.env.MAIL_SERVICE) === -1) {
    throw new Error("Allowed mail service values are: 'smtp', 'sendgrid'");
}

const mailer = require(`./services/${process.env.MAIL_SERVICE}`);

const templateRenderer = new Email({
    views: {
        root: path.join(__dirname, 'templates'),
        options: {
            extension: 'ejs',
        },
    },
});

const sendMail = async (template, subject, email, emailData, from = process.env.FROM_MAIL,type) => {
    const locals = { custom: emailData };
    locals.site_title = process.env.SITE_TITLE || '';
    locals.email_logo = process.env.LOGO_PATH || '';
    if(emailData.email_type && process.env.NODE_ENV==='production'){
        from = 'HRMS<rconn@hrms.vet>';
    }
    let date = new Date();
    locals.current_year = date.getFullYear();
    const renderedTemplate = await templateRenderer.render(template, locals);
    if(type && type=='attachment'){
        type ='attachment'
    } else {
        type ='simple'
    }
    console.log("this is type>>>>>>>>>>>>",type);
    
    return mailer(email, from, subject, renderedTemplate,type);
};

module.exports = { sendMail };
