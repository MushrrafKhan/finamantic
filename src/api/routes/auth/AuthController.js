const {
    models: { User , Static},
} = require('../../../../lib/models');
const mailer = require('../../../../lib/mailer');

const sms = require('../../../../lib/sms');
const { signToken } = require('../../util/auth');
const { signTempToken } = require('../../util/auth');
const { getPlatform } = require('../../util/common');
const {
    utcDateTime,
    randomName,
    getWeekNumber,
    generateOtp,
    logError,
    randomString,
    createS3SingnedUrl,
    generateResetToken,
    sendSms,
} = require('../../../../lib/util');
var _ = require('lodash');
const jwtToken = require('jsonwebtoken');
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const emailEnv = process.env.FROM_MAIL;
//const { compress } = require('compress-images/promise');

//const mailer = require('../../../../lib/mailer');

let apiEnv = process.env.NODE_ENV;
console.log('this is env:', apiEnv);
//var sgTransport = require('nodemailer-sendgrid-transport');
//var SGoptions = {
//  auth: {
//    api_key: SendGridKey
//  }
//};

class AuthController {
    async signup(req, res, next) {
        let { email, password, deviceToken, deviceType, name, phone, gender, age } = req.body;
        try {
            if(age<18){
                return res.send({
                    success:0,
                    data:{},
                    message:"Your age must be 18 or 18+"
                });
            }
            let checkEmailExists = await User.findOne({ email });
            if (checkEmailExists && checkEmailExists.email) {
                if (checkEmailExists.emailVerify == false) {
                    await User.deleteOne({email: email})
                    
                    let user = new User();
                    let otp;

                    if(process.env.sendgrid_status == '1'){
                        if (apiEnv == 'development') {
                            otp = generateOtp();
                        } else {
                            otp = generateOtp();
                        }
                    }else{
                        otp = 1234
                    }
                    const platform = req.headers['x-FinaMantic-platform'];
                    const version = req.headers['x-FinaMantic-version'];
                    user.email = email;
                    user.password = password;
                    user.phone = phone;
                    user.otp = otp;
                    user.name = name;
                    // user.otp = '123456';
                    user.authTokenIssuedAt = utcDateTime().valueOf();
                    user.emailToken = generateResetToken(12);
                    user.emailVerify = false;
                    user.age = age;
                    user.gender = gender;
                    if (deviceToken) {
                        user.deviceToken = deviceToken;
                        user.deviceType = deviceType;
                    }
                    user = await user.save();
                    let emailToSend = user.email;
                    let token = user.emailToken;

                    //Construct mail body here
                    const msg = {
                        to: emailToSend,
                        from: emailEnv, // Change to your verified sender
                        subject: 'FinaMantic: Verify Your Login',
                        text: 'Please enter the following OTP to verify your login : ' + user.otp,
                        html: '<strong>Please enter the following OTP to verify your login :' + user.otp + '</strong>',
                    };

                    if(process.env.sendgrid_status == '1'){
                        //Send Email Here
                        sgMail
                        .send(msg)
                        .then(() => {
                            console.log('Email sent');
                            const userJson = user.toJSON();
                            ['password', 'authTokenIssuedAt', 'otp', 'emailToken', '__v'].forEach(
                                key => delete userJson[key]
                            );
                            userJson.isDefaultLocation = false;
                            return res.send({
                                success: 1,
                                data: {
                                    language: req.headers['accept-language'],
                                    token,
                                    user: userJson,
                                },
                                message: 'OTP has been sent successfully.',
                            });
                        })
                        .catch(error => {
                            console.error(error);
                        });
                    }else{
                        const userJson = user.toJSON();
                            ['password', 'authTokenIssuedAt', 'otp', 'emailToken', '__v'].forEach(
                                key => delete userJson[key]
                            );
                            userJson.isDefaultLocation = false;
                        return res.send({
                            success: 1,
                            data: {
                                language: req.headers['accept-language'],
                                token,
                                user: userJson,
                            },
                            message: 'OTP has been sent successfully.',
                        });
                    }
                } else {
                    return res.send({
                        success: 0,
                        data: {
                            contactExist: true,
                            email: email,
                            phone: phone,
                        },
                        message: req.__('This email address already register in this app '),
                    });
                }
            }
            let x = await User.findOne({ email });
            console.log(x);
            if (!x) {
                let user = new User();
                let otp;
                if(process.env.sendgrid_status == '1'){
                    if (apiEnv == 'development') {
                        otp = generateOtp();
                    } else {
                        otp = generateOtp();
                    }
                }else{
                    otp = 1234
                }
                const platform = req.headers['x-FinaMantic-platform'];
                const version = req.headers['x-FinaMantic-version'];
                user.email = email;
                user.password = password;
                user.phone = phone;
                user.otp = otp;
                user.name = name;
                // user.otp = '123456';
                user.authTokenIssuedAt = utcDateTime().valueOf();
                user.emailToken = generateResetToken(12);
                user.emailVerify = false;
                user.age = age;
                user.gender = gender;
                if (deviceToken) {
                    user.deviceToken = deviceToken;
                    user.deviceType = deviceType;
                }
                user = await user.save();
                let emailToSend = user.email;
                let token = user.emailToken;

                //Construct mail body here
                const msg = {
                    to: emailToSend,
                    from: emailEnv, // Change to your verified sender
                    subject: 'FinaMantic: Verify Your Login',
                    text: 'Please enter the following OTP to verify your login : ' + user.otp,
                    html: '<strong>Please enter the following OTP to verify your login :' + user.otp + '</strong>',
                };

                //Send Email Here
                if(process.env.sendgrid_status == '1'){
                    sgMail
                    .send(msg)
                    .then(() => {
                        console.log('Email sent');
                        const userJson = user.toJSON();
                        ['password', 'authTokenIssuedAt', 'otp', 'emailToken', '__v'].forEach(
                            key => delete userJson[key]
                        );
                        userJson.isDefaultLocation = false;
                        return res.send({
                            success: 1,
                            data: {
                                language: req.headers['accept-language'],
                                token,
                                user: userJson,
                            },
                            message: 'OTP has been sent successfully.',
                        });
                    })
                    .catch(error => {
                        console.error(error);
                    });
                }else{
                    const userJson = user.toJSON();
                        ['password', 'authTokenIssuedAt', 'otp', 'emailToken', '__v'].forEach(
                            key => delete userJson[key]
                        );
                        userJson.isDefaultLocation = false;
                    return res.send({
                        success: 1,
                        data: {
                            language: req.headers['accept-language'],
                            token,
                            user: userJson,
                        },
                        message: 'OTP has been sent successfully.',
                    });
                }
            }
        } catch (err) {
            console.log(err);
            return next(err);
        }
    }
    async logIn(req, res, next) {
        try {
            const { email, password, deviceToken, deviceId, deviceType } = req.body;
            // console.log(req.body);
            let user;
            let msg;
            user = await User.findOne({ email: email, isDeleted: false });
            // console.log(user)
            if (!user) {
                return res.send({
                    success: 0,
                    data: {},
                    message: 'Invalid email or password',
                });
            }
            if (user.emailVerify == false) {
                return res.send({
                    success: 0,
                    data: {},
                    message: 'Please Complete your otp verification',
                });
            }
            msg = 'Invalid email or password';
            const passwordMatched = await user.comparePassword(password);
            if (!passwordMatched) {
                return res.send({ success: 0, message: msg });
            }
            //deviceId  ---> Single Value
            user.emailToken = generateResetToken(12);
            user.authTokenIssuedAt = utcDateTime().valueOf();
            user.deviceToken = deviceToken;
            user.deviceType = deviceType;
            await user.save();
            
            let token = user.emailToken;
            const jwttoken = signToken(user);
            
                if (user.isActive == false) {
                    return res.send({
                        success: 0,
                        data: {
                            userId: user._id,
                            emailVerified: user.emailVerify,
                            adminVerified: user.isActive,
                        },
                        message: 'Admin has yet to approve verification',
                    });
                }
                const userJson = user.toJSON();
                ['password', 'authTokenIssuedAt', 'otp', 'emailToken', '__v'].forEach(key => delete userJson[key]);
                return res.send({
                    success: 1,
                    data: {
                        language: req.headers['accept-language'],
                        token,
                        jwt: jwttoken,
                        user: userJson,
                    },
                    message: req.__('LOGIN_SUCCESS'),
                });
            
        } catch (err) {
            return next(err);
        }
    }
    
    // async logIn2(req, res, next) {
    //     try {
    //         const { email, password, deviceToken, deviceId, deviceType } = req.body;
    //         console.log(req.body);
    //         let user;
    //         let msg;
    //         user = await User.findOne({ email: email, isDeleted: false });
    //         console.log(user)
    //         if (!user) {
    //             return res.send({
    //                 success: 0,
    //                 data: {},
    //                 message: 'Invalid email or password',
    //             });
    //         }
    //         if (user.emailVerify == false) {
    //             return res.send({
    //                 success: 0,
    //                 data: {},
    //                 message: 'This email is not register in this application',
    //             });
    //         }
    //         msg = 'Invalid email or password';
    //         const passwordMatched = await user.comparePassword(password);
    //         if (!passwordMatched) {
    //             return res.send({ success: 0, message: msg });
    //         }
    //         //deviceId  ---> Single Value
    //         let deviceArr = user.deviceId;
    //         let newDevice = 'no';
    //         let otp;
    //         if (apiEnv == 'development') {
    //             otp = generateOtp();
    //         } else {
    //             otp = generateOtp();
    //         }
    //         user.otp = otp;
    //         user.emailToken = generateResetToken(12);
    //         if (deviceArr.indexOf(deviceId) !== -1) {
    //             newDevice = 'no';
    //         } else {
    //             newDevice = 'yes';
    //         }
    //         user.authTokenIssuedAt = utcDateTime().valueOf();
    //         user.deviceToken = deviceToken;
    //         user.deviceType = deviceType;
    //         await user.save();
    //         let token = user.emailToken;
    //         const jwttoken = signToken(user);
    //         console.log(newDevice);
    //         if (user.twoFA == true) {
    //             let emailToSend = user.email;
    //             //Construct mail body here
    //             const msg = {
    //                 to: emailToSend,
    //                 from: emailEnv, // Change to your verified sender
    //                 subject: 'Finamantic: Verify Your 2 FA ',
    //                 text: 'Please enter the following OTP to verify your 2 FA : ' + user.otp,
    //                 html: '<strong>Please enter the following OTP to verify your 2 FA :' + user.otp + ' </strong>',
    //             };
    //             //Send Email Here
    //             sgMail
    //                 .send(msg)
    //                 .then(() => {
    //                     //         console.log('Email sent');
    //                     const userJson = user.toJSON();
    //                     ['password', 'authTokenIssuedAt', 'otp', 'emailToken', '__v'].forEach(
    //                         key => delete userJson[key]
    //                     );
    //                     return res.send({
    //                         success: 1,
    //                         data: {
    //                             language: req.headers['accept-language'],
    //                             token,
    //                             email: user.email,
    //                         },
    //                         message: '2 FA verification OTP ',
    //                     });
    //                 })
    //                 .catch(error => {
    //                     console.error(error);
    //                 });
    //         }
    //         if (newDevice == 'yes') {
    //             let emailToSend = user.email;
    //             //Construct mail body here
    //             const msg = {
    //                 to: emailToSend,
    //                 from: emailEnv, // Change to your verified sender
    //                 subject: 'Finamantic: Verify Your Device',
    //                 text: 'Please enter the following OTP to verify your device : ' + user.otp,
    //                 html: '<strong>Please enter the following OTP to verify your device :' + user.otp + ' </strong>',
    //             };
    //             //Send Email Here
    //             sgMail
    //                 .send(msg)
    //                 .then(() => {
    //                     console.log('Email sent');

    //                     if (user.isActive == false) {
    //                         return res.send({
    //                             success: 0,
    //                             data: {
    //                                 userId: user._id,
    //                                 emailVerified: user.emailVerify,
    //                                 adminVerified: !user.isSuspended,
    //                             },
    //                             message: 'Admin has yet to approve verification',
    //                         });
    //                     }
    //                     const userJson = user.toJSON();
    //                     ['password', 'authTokenIssuedAt', 'otp', 'emailToken', '__v'].forEach(
    //                         key => delete userJson[key]
    //                     );
    //                     return res.send({
    //                         success: 1,
    //                         data: {
    //                             language: req.headers['accept-language'],
    //                             token,
    //                             jwt: jwttoken,
    //                             user: userJson,
    //                             newDevice: newDevice,
    //                         },
    //                         message: req.__('LOGIN_SUCCESS'),
    //                     });
    //                 })
    //                 .catch(error => {
    //                     console.error(error);
    //                 });
    //         } else {
    //             if (user.isActive == false) {
    //                 return res.send({
    //                     success: 0,
    //                     data: {
    //                         userId: user._id,
    //                         emailVerified: user.emailVerify,
    //                         adminVerified: user.isActive,
    //                     },
    //                     message: 'Admin has yet to approve verification',
    //                 });
    //             }
    //             const userJson = user.toJSON();
    //             ['password', 'authTokenIssuedAt', 'otp', 'emailToken', '__v'].forEach(key => delete userJson[key]);
    //             return res.send({
    //                 success: 1,
    //                 data: {
    //                     language: req.headers['accept-language'],
    //                     token,
    //                     jwt: jwttoken,
    //                     user: userJson,
    //                     newDevice: newDevice,
    //                 },
    //                 message: req.__('LOGIN_SUCCESS'),
    //             });
    //         }
    //     } catch (err) {
    //         return next(err);
    //     }
    // }
    async verifyOtp(req, res, next) {
        let { otp, email, token, deviceId } = req.body;
        console.log(req.body);
        try {
            let user;
            user = await User.findOne({
                email,
                isDeleted: false,
            });
            console.log(user);
            if (!user) {
                // return res.unauthorized(null, req.__('UNAUTHORIZED'));
                return res.send({
                    success: 0,
                    data: {},
                    message: 'unauthorized access',
                });
            }
            if (user) {
                if (user.otp == otp) {
                    if (user.emailToken == token) {
                        user.emailVerify = true;
                        user.deviceId.push(deviceId);

                        let newUser = await user.save();
                        const userJson = newUser.toJSON();
                        const jwttoken = signToken(user);
    
                        return res.send({
                            success: 1,
                            data: {
                                _id: newUser._id,
                                jwt: jwttoken,
                                user: userJson,
                                emailVerified: newUser.emailVerify,
                                token: token,
                            },
                            message: req.__('OTP_VERIFY_SUCCESS'),
                        });

                    } else if (user.resetToken == token) {
                        user.emailVerify = true;
                        user.deviceId.push(deviceId);

                        let newUser = await user.save();
                        const userJson = newUser.toJSON();
                        const jwttoken = signToken(user);
    
                        return res.send({
                            success: 1,
                            data: {
                                _id: newUser._id,
                                jwt: jwttoken,
                                user: userJson,
                                emailVerified: newUser.emailVerify,
                                token: token,
                            },
                            message: req.__('OTP_VERIFY_SUCCESS'),
                        });

                    }else{
                        return res.warn('', req.__('emailToken not match'));
                    }
                   
                } else {
                    return res.send({
                        success: 0,
                        data: {},
                        message: 'Kindly enter the correct verification code',
                    });
                }
            } else {
                return res.send({
                    success: 0,
                    data: {},
                    message: req.__('General error '),
                });
            }
        } catch (err) {
            return next(err);
        }
    }
    async skipVerify(req, res, next) {
        let { email } = req.body;
        try {
            let user;
            user = await User.findOne({
                email,
                isDeleted: false,
            });

            if (!user) {
                return res.unauthorized(null, req.__('UNAUTHORIZED'));
            }

            let timestamp1 = Date.now();
            console.log(timestamp1);
            let timestamp2 = user.like_time;
            // let time = 1636693749000;

            var hours = Math.abs(timestamp1 - timestamp2) / 36e5;
            //console.log(hours);

            let showPop = false;
            if (hours > 24) {
                showPop = true;
            } else {
                showPop = false;
            }

            if (user) {
                user.emailVerify = 'true';
                user.skipTwoStep = 'false';
                let newUser = await user.save();

                const userJson = newUser.toJSON();
                //console.log(newUser);
                const jwttoken = signToken(user);

                return res.success(
                    {
                        _id: newUser._id,
                        jwt: jwttoken,
                        user: userJson,
                        showPop: showPop,
                        emailVerified: newUser.emailVerify,
                    },
                    '2 step skipped and logged in successfully'
                );
            } else {
                return res.warn('', req.__('GENERAL_ERROR'));
            }
        } catch (err) {
            return next(err);
        }
    }
    async resendOtp(req, res, next) {
        let { email, token } = req.body;
        try {
            let user;
            user = await User.findOne({ email, isDeleted: false });
            if (!user) {
                return res.unauthorized(null, req.__('UNAUTHORIZED'));
            }
            if (user) {
                let otp;
                if(process.env.sendgrid_status == '1'){
                    otp = generateOtp();
                }else{
                    otp = 1234
                }
                user.otp = otp;
                // user.otp = '123456';
                let newUser = await user.save();
                //console.log(newUser);
                let forgotToken = newUser.resetToken;
                let emailToken = newUser.emailToken;

                if (token == forgotToken) {
                    if (newUser.email != '') {
                        let emailToSend = newUser.email;
                        //Construct mail body here
                        const msg = {
                            to: emailToSend,
                            from: emailEnv, // Change to your verified sender
                            subject: 'FinaMantic: Forgot Password OTP',
                            text: 'Please enter the following OTP to reset your password : ' + user.otp,
                            html:
                                '<strong>Please enter the following OTP to reset your password :' +
                                user.otp +
                                ' </strong>',
                        };
                        if(process.env.sendgrid_status == '1'){
                            //Send Email Here
                            sgMail
                                .send(msg)
                                .then(() => {
                                    console.log('Email sent');
    
                                    return res.send({
                                        success: 1,
                                        data: {},
                                        message: req.__('OTP_SEND_SUCCESS'),
                                    });
                                })
                                .catch(error => {
                                    console.error(error);
                                });
                        }else{
                            return res.send({
                                success: 1,
                                data: {},
                                message: req.__('OTP_SEND_SUCCESS'),
                            })
                        }
                    }
                } else {
                    if (newUser.email != '') {
                        let emailToSend = newUser.email;
                        //Construct mail body here
                        const msg = {
                            to: emailToSend,
                            from: emailEnv, // Change to your verified sender
                            subject: 'FinaMantic: Verify Email OTP',
                            text: 'Please enter the following OTP to verify your email : ' + user.otp,
                            html:
                                '<strong>Please enter the following OTP to verify your email :' +
                                user.otp +
                                ' </strong>',
                        };

                        if(process.env.sendgrid_status == '1'){
                            //Send Email Here
                            sgMail
                                .send(msg)
                                .then(() => {
                                    console.log('Email sent');
    
                                    return res.send({
                                        success: 1,
                                        data: {},
                                        message: req.__('OTP_SEND_SUCCESS'),
                                    });
                                })
                                .catch(error => {
                                    console.error(error);
                                });
                        }else{
                            return res.send({
                                success: 1,
                                data: {},
                                message: req.__('OTP_SEND_SUCCESS'),
                            });
                        }
                    }
                }

                return res.send({
                    success: 1,
                    language: req.headers['accept-language'],
                    message: req.__('OTP_SEND_SUCCESS'),
                });
            } else {
                return res.send({ success: 0, data: {}, message: req.__('GENERAL_ERROR') });
            }
        } catch (err) {
            return next(err);
        }
    }
    async forgotPassword(req, res, next) {
        let { email } = req.body;
        try {
            let user;

            // console.log("this is Email Address>>>>>>>",email);
            user = await User.findOne({
                email,
                isDeleted: false,
            });

            //  console.log("this is user>>>>>>>>>>>>>>",user);
            if (!user) {
                return res.send({
                    success: 0,
                    data: {},
                    message: req.__('This email is not register !'),
                });
            }

            if (user) {
                if (user.isActive == false) {
                    //account suspended
                    return res.send({
                        success: 0,
                        data: {},
                        message: 'Your account is not verified by admin',
                    });
                }
                //generated unique token and save in user table and send reset link
                let resetToken = randomString(10);
                // let resetToken = generateResetToken(12)
                let otp;
                if(process.env.sendgrid_status == '1'){
                    otp = generateOtp();
                }else{
                    otp = 1234;
                }    
                user.resetToken = resetToken;
                user.emailVerify = false;
                // user.mobileVerify = false;
                user.otp = otp;
                // user.otp = '123456';
                user.authTokenIssuedAt = utcDateTime().valueOf();
                await user.save();

                // console.log(user);

                if (user.email != '') {
                    let emailToSend = user.email;

                    //console.log('--------------test------------');
                    //Construct mail body here
                    const msg = {
                        to: emailToSend,
                        from: emailEnv, // Change to your verified sender
                        subject: 'FinaMantic: Forgot Password OTP',
                        text: 'Please enter the following OTP to reset your password : ' + user.otp,
                        html:
                            '<strong>Please enter the following OTP to reset your password :' + user.otp + ' </strong>',
                    };

                    if(process.env.sendgrid_status == '1'){
                        //Send Email Here
                        sgMail
                            .send(msg)
                            .then(() => {
                                console.log('Email sent');
    
                                return res.send({
                                    success: 1,
                                    data: {
                                        email: email,
                                        token: resetToken,
                                    },
                                    message: req.__('OTP_SEND_SUCCESS'),
                                });
                            })
                            .catch(error => {
                                console.error(error);
                            });
                    }else{
                        return res.send({
                            success: 1,
                            data: {
                                email: email,
                                token: resetToken,
                            },
                            message: req.__('OTP_SEND_SUCCESS'),
                        });
                    }
                }
            } else {
                //no user found
                return res.send({
                    success: 0,
                    data: {},
                    message: req.__('This email is not register !'),
                });
            }
        } catch (err) {
            return next(err);
        }
    }
    async resetPassword(req, res, next) {
        let { password, email } = req.body;
        try {
            const user = await User.findOne({
                email,
                isDeleted: false,
            });

            if (!user) {
                return res.unauthorized(null, req.__('UNAUTHORIZED'));
            }
            if (user) {
                user.password = password;
                let email = user.email;
                user.emailVerify = true;
                let newUser = await user.save();

                let emailToSend = newUser.email;
                //Construct mail body here
                const msg = {
                    to: emailToSend,
                    from: emailEnv, // Change to your verified sender
                    subject: 'FinaMantic: Password Updated',
                    text: 'Password has been Updated',
                    html: '<strong>Password has been Updated</strong>',
                };

                if(process.env.sendgrid_status == '1'){
                    //Send Email Here
                    sgMail
                        .send(msg)
                        .then(() => {
                            console.log('Email sent');
    
                            return res.send({
                                success: 1,
                                data: {},
                                message: req.__('OTP_SEND_SUCCESS'),
                            });
                        })
                        .catch(error => {
                            console.error(error);
                        });
                }else{
                    return res.send({
                        success: 1,
                        data: {},
                        message: req.__('OTP_SEND_SUCCESS'),
                    });
                }

                return res.send({
                    success: 1,
                    data: {},
                    message: req.__('PASSWORD_CHANGED'),
                });
            } else {
                return res.send({ success: 0, data: {}, message: req.__('GENERAL_ERROR') });
            }
        } catch (err) {
            return next(err);
        }
    }
    async reset(req, res, next) {
        let { otp, email, deviceId, password } = req.body;
        console.log(req.body);
        try {
            let user;
            user = await User.findOne({
                email,
                isDeleted: false,
            });
            console.log(user);
            if (!user) {
                // return res.unauthorized(null, req.__('UNAUTHORIZED'));
                return res.send({
                    status: 0,
                    data: {},
                    message: 'unauthorized access',
                });
            }
            if (user) {
                if (user.otp == otp) {
                    user.emailVerify = true;
                    user.password = password;
                    user.deviceId.push(deviceId);
                    let newUser = await user.save();
                    const userJson = newUser.toJSON();
                    const jwttoken = signToken(user);

                    return res.send({
                        success: 1,
                        _id: newUser._id,
                        jwt: jwttoken,
                        user: userJson,
                        emailVerified: newUser.emailVerify,
                        message: req.__('Password updated !'),
                    });
                } else {
                    return res.send({
                        success: 0,
                        data: {},
                        message: req.__('Please enter correct OTP '),
                    });
                }
            } else {
                return res.send({
                    success: 0,
                    data: {},
                    message: req.__('General error '),
                });
            }
        } catch (err) {
            return next(err);
        }
    }
    async socialLogIn(req, res, next) {
        try {
            const {
                email,
                social_type,
                social_id,
                deviceType,
                deviceId,
                deviceToken,
                email_manual,
                firstname,
                lastname,
                phone,
                image,
            } = req.body;
            let user;
            let profileAdded = false;
            const platform = req.headers['x-FinaMantic-platform'];
            const version = req.headers['x-FinaMantic-version'];
            let msg;

            //Check 1 -- find user with social ID in DB
            user = await User.findOne({ social_id: social_id, isDeleted: false });
            //console.log("=====1=====");
            let timestamp1 = Date.now();
            let showPop = false;

            if (user != null && user.like_time) {
                let timestamp2 = user.like_time;
                var hours = Math.abs(timestamp1 - timestamp2) / 36e5;

                //console.log(hours);
                if (hours > 24) {
                    showPop = true;
                } else {
                    showPop = false;
                }
            } else {
                showPop = true;
            }

            // let time = 1636693749000;
            //console.log(timestamp2);

            if (!user) {
                //Check 2 --> Check Email exist ?
                //email find if exist or not
                let checkEmailExists = await User.findOne({
                    email,
                });

                //console.log("=====2=====");
                if (checkEmailExists && checkEmailExists.email) {
                    return res.warn(
                        {
                            contactExist: true,
                            email: checkEmailExists.mobile,
                        },
                        req.__('EMAIL_EXISTS')
                    );
                } else {
                    //console.log("=====3=====");
                    //Sign up process goes here
                    let x = await User.findOne({ email });
                    if (!x) {
                        let user = new User();
                        let otp;
                        otp = generateOtp();
                        const platform = req.headers['x-FinaMantic-platform'];
                        const version = req.headers['x-FinaMantic-version'];
                        user.email = email;
                        user.password = email + '123';
                        user.role = 'normal';
                        user.otp = otp;
                        user.authTokenIssuedAt = utcDateTime().valueOf();
                        user.emailToken = generateResetToken(12);
                        user.emailVerify = false;

                        user.social_id = social_id;
                        user.social_type = social_type;
                        //user.avatar = image;
                        user.firstname = firstname;
                        user.lastname = lastname;

                        if (deviceToken) {
                            user.deviceToken = deviceToken;
                            user.deviceType = deviceType;
                        }

                        let deviceArr = user.deviceId;
                        let newDevice = 'no';

                        if (deviceArr.indexOf(deviceId) !== -1) {
                            //console.log("Exists");
                            newDevice = 'no';
                        } else {
                            newDevice = 'yes';
                        }

                        user = await user.save();

                        let token = user.emailToken;

                        let is_skip = user.skipTwoStep;
                        let isSkip;
                        if (is_skip == true && newDevice == 'yes') {
                            isSkip = 'no';
                        } else {
                            isSkip = 'yes';
                        }

                        const jwttoken = signToken(user);

                        if (newDevice == 'yes') {
                            let emailToSend = user.email;

                            //Construct mail body here
                            const msg = {
                                to: emailToSend,
                                from: emailEnv, // Change to your verified sender
                                subject: 'FinaMantic: Verify Your Device',
                                text: 'Please enter the following OTP to verify your device : ' + user.otp,
                                html:
                                    '<strong>Please enter the following OTP to verify your device :' +
                                    user.otp +
                                    ' </strong>',
                            };

                            //Send Email Here
                            sgMail
                                .send(msg)
                                .then(() => {
                                    console.log('Email sent');

                                    if (user.isSuspended) {
                                        return res.warn(
                                            {
                                                userId: user._id,
                                                emailVerified: user.emailVerify,
                                                adminVerified: !user.isSuspended,
                                            },
                                            'Admin has yet to approve verification'
                                        );
                                    }

                                    const userJson = user.toJSON();

                                    ['password', 'authTokenIssuedAt', 'otp', 'emailToken', '__v'].forEach(
                                        key => delete userJson[key]
                                    );

                                    return res.success(
                                        {
                                            language: req.headers['accept-language'],
                                            token,
                                            jwt: jwttoken,
                                            user: userJson,
                                            newDevice: newDevice,
                                            is_skip: isSkip,
                                            showPop: showPop,
                                        },
                                        req.__('LOGIN_SUCCESS')
                                    );
                                })
                                .catch(error => {
                                    console.error(error);
                                });
                        } else {
                            if (user.isSuspended) {
                                return res.warn(
                                    {
                                        userId: user._id,
                                        emailVerified: user.emailVerify,
                                        adminVerified: !user.isSuspended,
                                    },
                                    'Admin has yet to approve verification'
                                );
                            }

                            const userJson = user.toJSON();

                            ['password', 'authTokenIssuedAt', 'otp', 'emailToken', '__v'].forEach(
                                key => delete userJson[key]
                            );
                            let is_skip = userJson.skipTwoStep;
                            let isSkip;
                            if (is_skip == true && newDevice == 'yes') {
                                isSkip = 'no';
                            } else {
                                isSkip = 'yes';
                            }

                            return res.success(
                                {
                                    language: req.headers['accept-language'],
                                    token,
                                    jwt: jwttoken,
                                    user: userJson,
                                    is_skip: isSkip,
                                    showPop: showPop,
                                },
                                req.__('LOGIN_SUCCESS')
                            );
                        }
                    } else {
                        return res.warn('', req.__('EMAIL_EXISTS'));
                    }
                }
            } else {
                //Login the user here

                //deviceId  ---> Single Value
                let deviceArr = user.deviceId;
                let newDevice = 'no';
                let otp;
                otp = generateOtp();

                user.otp = otp;
                user.emailToken = generateResetToken(12);

                if (deviceArr.indexOf(deviceId) !== -1) {
                    //console.log("Exists");
                    newDevice = 'no';
                } else {
                    newDevice = 'yes';
                }

                user.authTokenIssuedAt = utcDateTime().valueOf();
                user.deviceToken = deviceToken;
                user.deviceType = deviceType;

                await user.save();

                let token = user.emailToken;

                let is_skip = user.skipTwoStep;
                let isSkip;
                if (is_skip == true && newDevice == 'yes') {
                    isSkip = 'no';
                } else {
                    isSkip = 'yes';
                }

                const jwttoken = signToken(user);

                console.log('--------------');
                if (newDevice == 'yes') {
                    let emailToSend = user.email;
                    //Construct mail body here
                    const msg = {
                        to: emailToSend,
                        from: emailEnv, // Change to your verified sender
                        subject: 'Finamantic: Verify Your Device',
                        text: 'Please enter the following OTP to verify your device : ' + user.otp,
                        html:
                            '<strong>Please enter the following OTP to verify your device :' + user.otp + ' </strong>',
                    };

                    //Send Email Here
                    sgMail
                        .send(msg)
                        .then(() => {
                            console.log('Email sent');

                            if (user.isSuspended) {
                                return res.warn(
                                    {
                                        userId: user._id,
                                        emailVerified: user.emailVerify,
                                        adminVerified: !user.isSuspended,
                                    },
                                    'Admin has yet to approve verification'
                                );
                            }
                            const userJson = user.toJSON();
                            ['password', 'authTokenIssuedAt', 'otp', 'emailToken', '__v'].forEach(
                                key => delete userJson[key]
                            );
                            return res.success(
                                {
                                    language: req.headers['accept-language'],
                                    token,
                                    jwt: jwttoken,
                                    user: userJson,
                                    newDevice: newDevice,
                                },
                                req.__('LOGIN_SUCCESS')
                            );
                        })
                        .catch(error => {
                            console.error(error);
                        });
                } else {
                    if (user.isSuspended) {
                        return res.warn(
                            { userId: user._id, emailVerified: user.emailVerify, adminVerified: !user.isSuspended },
                            'Admin has yet to approve verification'
                        );
                    }

                    const userJson = user.toJSON();

                    ['password', 'authTokenIssuedAt', 'otp', 'emailToken', '__v'].forEach(key => delete userJson[key]);
                    let is_skip = userJson.skipTwoStep;
                    let isSkip;
                    if (is_skip == true && newDevice == 'yes') {
                        isSkip = 'no';
                    } else {
                        isSkip = 'yes';
                    }

                    return res.success(
                        {
                            language: req.headers['accept-language'],
                            token,
                            jwt: jwttoken,
                            user: userJson,
                            is_skip: isSkip,
                            showPop: showPop,
                        },
                        req.__('LOGIN_SUCCESS')
                    );
                }
            }
        } catch (err) {
            return next(err);
        }
    }
    async generateToken(req, res) {
        let _id = req.params._id;
        const user = await User.findOne({ _id });
        const platform = req.headers['x-hrms-platform'];
        const token = signToken(user, platform);
        return res.success({
            token,
        });
    }
    async logOut(req, res) {
        console.log('========');
        const { user } = req;
        user.authTokenIssuedAt = null;
        user.deviceToken = null;
        await user.save();
        return res.send({
            success: 1,
            data: {},
            message: req.__('LOGOUT_SUCCESS'),
        });
    }
    async checkValidation(req, res, next) {
        let { mobile, email } = req.body;
        //admin.emailToken = generateResetToken();
        try {
            let user = await Concierge.findOne({ mobile: mobile });
            if (user) {
                return res.warn('', req.__('MOBILE_NO_EXISTS'));
            } else {
                user = await Concierge.findOne({ email });
                if (user) {
                    return res.warn('', req.__('EMAIL_EXISTS'));
                } else {
                    return res.success('', 'Success');
                }
            }
        } catch (err) {
            console.log(err);
            return next(err);
        }
    }

    async staticPages(req, res) {
        try {
            console.log('-=-=-');
            // console.log(req.body);
            let slg = req.params.slug;
            console.log(slg);
            if ('about-us' == slg) {
                console.log('---aboutus----');
                const cms = await Static.findOne({ slug: 'about-us' }).lean();
                
                res.send({
                    status: 1,
                    success: true,
                    message: 'aboutUs page fetch Success',
                    data: { cms },
                });
            } else if ('privacy-policy' == slg) {
                const cms = await Static.findOne({ slug: 'privacy-policy' }).lean();
                res.send({
                    status: 1,
                    success: true,
                    message: 'aboutUs page fetch Success',
                    data: { cms },
                });
            } else if ('terms_conditions' == slg) {
                const cms = await Static.findOne({ slug: 'terms-conditions' }).lean();
                res.send({
                    status: 1,
                    success: true,
                    message: 'aboutUs page fetch Success',
                    data: { cms },
                });
            }
        } catch (err) {
            res.status(400).end(err);
        }
    }
}

module.exports = new AuthController();
