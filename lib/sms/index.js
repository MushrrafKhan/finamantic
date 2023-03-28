const accountSid = process.env.TWILIO_SID,
    authToken = process.env.TWILIO_AUTH_TOKEN,
    client = require('twilio')(accountSid, authToken),
    { models: { User } } = require('./../../lib/models');


const sendSMS = async (mobile, message) => {
    // const user = await User.findOne({ mobile }).lean();
    
    try {

        await client.messages.create({
            body: message,
            to: mobile,  // Text this number
            from: process.env.TWILIO_MOBILE_NUMBER // From a valid Twilio number
        })
        .then((message) => console.log('messageid : '+message.sid));

        
    } catch (e) {
        return false;
    }
}

module.exports = { sendSMS };