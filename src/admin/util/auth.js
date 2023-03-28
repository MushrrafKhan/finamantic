const jwt = require('jsonwebtoken');
const {
    models: { Admin },
} = require('./../../../lib/models');

const signToken = user => {
    const payload = {
        sub: user._id,
        iat: user.authTokenIssuedAt,
    };
    return jwt.sign(payload, process.env.JWT_SECRET);
};

const verifyToken = (req, res, next) =>
    jwt.verify(req.session.token, process.env.JWT_SECRET, async (err, decoded) => {
        if (err || !decoded || !decoded.sub) {
            req.session.user = null;
            req.session.token = null;
            //req.flash('error', req.__('UNAUTHORIZED'));
            return res.redirect('/auth/log-in');
        }

        const admin = await Admin.findOne({
            _id: decoded.sub,
            isDeleted: false,
            //authTokenIssuedAt: decoded.iat,
        });

        if (!admin) {
            req.session.user = null;
            req.session.token = null;
            req.flash('error', req.__('UNAUTHORIZED'));
            return res.redirect('/auth/log-in');
        }

        if (admin.isSuspended) {
            req.flash('error', req.__('YOUR_ACCOUNT_SUSPENDED'));
            return res.redirect('/auth/log-in');
        }

        req.user = admin;
        res.user = admin;
        const adminJson = admin.toJSON();
        ['password', 'authTokenIssuedAt', '__v'].forEach(key => delete adminJson[key]);
        req.session.user = adminJson;
        next();
    });

module.exports = { signToken, verifyToken };
