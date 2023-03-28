const nodeMailer = require('nodemailer');
var AWS = require("aws-sdk");
/*var sns = new AWS.SNS({
    accessKeyId: process.env.SNS_USER_AWS_ACCESS_KEY,
    secretAccessKey: process.env.SNS_USER_AWS_SECRET_KEY,
    region: process.env.SNS_USER_AWS_REGION
  }); */

  const sendSms = async (county_code, phone,otp) => {

    var secureCode = Math.floor(100000 + Math.random() * 900000);
    secureCode = secureCode.toString().substring(0, 4);
    secureCode = parseInt(secureCode);
    if (process.env.environment === "dev" || process.env.environment === "demo") {
      secureCode = "1234";
    }
    
    return secureCode;

};
module.exports = { sendSms };