const {
    models: { Admin,User, SwapType, Categories,Vendor, Posts, Restaurant, Rating, DupRestaurant },
} = require('../../../../lib/models');
const { generateResetToken, logError } = require('../../../../lib/util');
const mailer = require('../../../../lib/mailer');
const sms = require('../../../../lib/sms');

const { signToken } = require('../../util/auth');
const { utcDateTime } = require('../../../../lib/util');
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const emailEnv = process.env.FROM_MAIL;

class AuthController {
    async logInPage(req, res) {
        if (req.session.user) {
            return res.redirect('/');
        }
        return res.render('login');
    }

    async logIn(req, res) {
        if (req.session.user) {
            return res.redirect('/');
        }
        
        const { email, password } = req.body;
        const admin = await Admin.findOne({ email, isDeleted: false });
        
        if (!admin) {
            req.flash('error', req.__('INVALID_CREDENTIALS'));
            return res.redirect('/auth/log-in');
        }
        if (admin.isSuspended) {
            req.flash('error', req.__('YOUR_ACCOUNT_SUSPENDED'));
            return res.redirect('/auth/log-in');
        }
        
        
        const passwordMatched = await admin.comparePassword(password);
        
        if (!passwordMatched) {
            req.flash('error', req.__('INVALID_CREDENTIALS'));
            return res.redirect('/auth/log-in');
        }

        admin.authTokenIssuedAt = utcDateTime().valueOf();
        await admin.save();

        const adminJson = admin.toJSON();
        const token = signToken(admin);

        ['password', 'authTokenIssuedAt', '__v'].forEach(key => delete adminJson[key]);

        req.session.user = adminJson;
        req.session.token = token;
        req.flash('success', req.__('LOGIN_SUCCESS'));
        return res.redirect('/');
    }

    async logout(req, res) {
        req.session.user = null;
        req.session.token = null;
        req.flash('success', req.__('LOGOUT_SUCCESS'));
        return res.redirect('/auth/log-in');
    }

    async dashbaord(req, res) {

        const user_count = await User.countDocuments({'isDeleted':false});
        console.log(user_count)
        let new_users = await User.find({
            isDeleted: false
        })
        //.populate({'path':'state','model':'State'})
        .sort({created: 'desc'})
        .limit(5)
        .lean();
        
        

        return res.render('index', {
            user_count,
            new_users,
        });
    }

    async profilePage(req, res) {
        const { user } = req;
        return res.render('profile', {
            user,
        });
    }
    async profile(req, res) {
        const { user } = req;
        const { firstName, lastName, email, contactNumber } = req.body;

        user.firstName = firstName;
        user.lastName = lastName;
        user.email = email;
        user.contactNumber = contactNumber;
        await user.save();

        req.flash('success', req.__('PROFILE_UPDATED'));
        return res.redirect('/profile');
    }

    async changePasswordPage(req, res) {
        return res.render('change-password');
    }

    async changePassword(req, res) {
        const { user } = req;
        const { currentPassword, newPassword } = req.body;

        const passwordMatched = await user.comparePassword(currentPassword);
        if (!passwordMatched) {
            req.flash('error', req.__('PASSWORD_MATCH_FAILURE'));
            return res.redirect('/change-password');
        }

        user.password = newPassword;
        await user.save();

        req.flash('success', req.__('PASSWORD_CHANGED'));
        return res.redirect('/change-password');
    }

    async forgotPasswordPage(req, res) {
        if (req.session.user) {
            return res.redirect('/');
        }
        return res.render('forgot-password');
    }

    async forgotPassword(req, res) {
        if (req.session.user) {
            return res.redirect('/');
        }
        const { email } = req.body;

        const admin = await Admin.findOne({
            email,
            isDeleted: false,
        });

        if (!admin) {
            req.flash('error', req.__('USER_NOT_FOUND'));
            return res.redirect('/auth/forgot-password');
        }

        if (admin.isSuspended) {
            req.flash('error', req.__('YOUR_ACCOUNT_SUSPENDED'));
            return res.redirect('/auth/forgot-password');
        }

        admin.resetToken = generateResetToken();
        await admin.save();

        req.flash('success', req.__('FORGOT_PASSWORD_MAIL_SUCCESS'));
        res.redirect('/auth/reset-password?email='+email);
        
        const msg = {
                to: email,
                // from: 'ronie.ochoajr@gmail.com', 
                from: emailEnv,// Change to your verified sender
                subject: 'Finamantic: Forgot Password OTP',
                text: `Please enter the following OTP to reset your password : ${admin.resetToken}`,
                html: `<strong>Please enter the following Link to reset your password : ${process.env.SITE_URL}/auth/reset-password?email=${email}</strong>`,
            }

            //console.log(msg);

            //Send Email Here
            sgMail
                .send(msg)
                    .then(() => {
                        console.log('Email sent');

                        return  res.redirect('/auth/reset-password');
                    })
                    .catch((error) => {
                        console.error(error)
                    })
        
    }

    async resendOTP(req, res) {
        if (req.session.user) {
            return res.redirect('/');
        }
        
        const { email } = req.query;

        const admin = await Admin.findOne({
            email,
            isDeleted: false,
        });

        if (!admin) {
            req.flash('error', req.__('USER_NOT_FOUND'));
            return res.redirect('/auth/forgot-password');
        }

        if (admin.isActive == false) {
            req.flash('error', req.__('YOUR_ACCOUNT_SUSPENDED'));
            return res.redirect('/auth/forgot-password');
        }

        admin.resetToken = generateResetToken();
        await admin.save();

        req.flash('success', req.__('FORGOT_PASSWORD_MAIL_SUCCESS'));
        res.redirect('/auth/reset-password?email='+email);
       
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
        const msg = {
            to: email,
            // from: 'ronie.ochoajr@gmail.com',
            from: emailEnv, // Change to your verified sender
            subject: 'Finamatic: Forgot Password OTP',
            text: `Please enter the following OTP to reset your password : ${admin.resetToken}`,
            html: `<strong>Please enter the following Link to reset your password : ${process.env.SITE_URL}/auth/reset-password?email=${email}</strong>`,
        }

        //console.log(msg);

        //Send Email Here
        sgMail
            .send(msg)
                .then(() => {
                    console.log('Email sent');
                    return  res.redirect('/auth/reset-password?email='+email);
                })
                .catch((error) => {
                    console.error(error)
                })
                
    }

    async validateOTP(req, res){
        const { email } = req.query;
        const otp = req.body.otp;
        const admin = await Admin.findOne({
            email,
            isDeleted: false,
        });
        if(admin.resetToken == otp){
            //return res.success(true);
            res.render("reset-password",{email})
        }else{
            return res.success(false);
        }
    }

    async resetPasswordPage(req, res) {
        
        if (req.session.user) {
            return res.redirect('/');
        }
        const { email } = req.query;

        if (!email) {
            req.flash('error', req.__('INVALID_RESET_PASS_REQUEST'));
            return res.redirect('/auth/forgot-password');
        }

        const admin = await Admin.findOne({
            email,
            isDeleted: false,
        });

        console.log(admin);
        
        if (!admin || !admin.resetToken) {
            req.flash('error', req.__('INVALID_RESET_PASS_REQUEST'));
            return res.redirect('/auth/forgot-password');
        }

        if (admin.isActive == false) {
            req.flash('error', req.__('YOUR_ACCOUNT_SUSPENDED'));
            return res.redirect('/auth/forgot-password');
        }

        return res.render('send-otp',{email});
    }

    async resetPassword(req, res) {
        if (req.session.user) {
            return res.redirect('/');
        }
        const { email } = req.query;
        const { newPassword } = req.body;

        if (!email) {
            req.flash('error', req.__('INVALID_RESET_PASS_REQUEST'));
            return res.redirect('/auth/forgot-password');
        }

        const admin = await Admin.findOne({
            email,
            isDeleted: false
        });

        if (!admin) {
            req.flash('error', req.__('USER_NOT_FOUND'));
            return res.redirect('/auth/forgot-password');
        }

        if (admin.isActive == false) {
            req.flash('error', req.__('YOUR_ACCOUNT_SUSPENDED'));
            return res.redirect('/auth/forgot-password');
        }

        /*
        if (!(admin.resetToken === otp)) {
            req.flash('error', req.__('INVALID_OTP'));
            return res.redirect(req.headers['referer']);
        }
        */

        admin.password = newPassword;
        admin.resetToken = null;
        await admin.save();

        req.flash('success', req.__('PASSWORD_CHANGED'));
        return res.redirect('/auth/log-in');
    }

    async isEmailExists(req, res) {
        const { email, id } = req.body;
        const matchCond = {
            isDeleted: false,
            email: new RegExp(`^${email}$`,'i'),
        };
        id &&
        (matchCond._id = {
            $ne: id,
        });
        const count = await Admin.countDocuments(matchCond);

        return res.send(count === 0);
    }

    async counts(req, res) {
        const { dateFrom, dateTo } = req.body;
        let commonMatchCond = {};
        dateFrom &&
        (commonMatchCond.created = {
            $gte: utcDate(dateFrom),
            $lt: utcDate(
                moment(dateFrom)
                    .add(1, 'days')
                    .format('YYYY-MM-DD')
            ),
        });
        dateTo &&
        (commonMatchCond.created = {
            $gte: utcDate(dateFrom),
            $lt: utcDate(
                moment(dateTo)
                    .add(1, 'days')
                    .format('YYYY-MM-DD')
            ),
        });

        const [
            usersCount

        ] = await Promise.all([

            User.countDocuments({
                isDeleted: false,
                ...commonMatchCond,
            })
           
        ]);

        return res.success({
            usersCount
        });
    }


    async userResetPasswordPage(req, res) {
        
        const { resetToken } = req.query;

        if (!resetToken) {
            req.flash('error', req.__('INVALID_RESET_PASS_REQUEST'));
            return res.redirect(req.headers.referer);
        }

        const admin = await Admin.findOne({
            resetToken,
            isDeleted: false,
        });

        if (!admin || !admin.resetToken) {
            req.flash('error', req.__('INVALID_RESET_PASS_REQUEST'));
            return res.redirect(req.headers.referer);
        }

        if (admin.isActive == false) {
            req.flash('error', req.__('YOUR_ACCOUNT_SUSPENDED'));
            return res.redirect(req.headers.referer);
        }

        return res.render('user-reset-password');    }

    async userResetPassword(req, res) {
        if (req.session.user) {
            return res.redirect('/');
        }
        const { email } = req.query;
        const { otp, newPassword } = req.body;

        if (!email) {
            req.flash('error', req.__('INVALID_RESET_PASS_REQUEST'));
            return res.redirect('/auth/forgot-password');
        }

        const admin = await Admin.findOne({
            email,
            isDeleted: false
        });

        if (!admin) {
            req.flash('error', req.__('USER_NOT_FOUND'));
            return res.redirect('/auth/forgot-password');
        }

        if (admin.isActive == false) {
            req.flash('error', req.__('YOUR_ACCOUNT_SUSPENDED'));
            return res.redirect('/auth/forgot-password');
        }

        if (!(admin.resetToken === otp)) {
            req.flash('error', req.__('INVALID_OTP'));
            return res.redirect(req.headers['referer']);
        }

        admin.password = newPassword;
        admin.resetToken = null;
        await admin.save();

        req.flash('success', req.__('PASSWORD_CHANGED'));
        return res.redirect(req.headers.referer);
    }

    async vendorEmailChk(req, res) {
        const { email, id } = req.body;
        const matchCond = {
            isDeleted: false,
            email: new RegExp(`^${email}$`,'i'),
        };
        id &&
        (matchCond._id = {
            $ne: id,
        });
        const count = await Vendor.countDocuments(matchCond);

        return res.send(count === 0);
    }

}

module.exports = new AuthController();
