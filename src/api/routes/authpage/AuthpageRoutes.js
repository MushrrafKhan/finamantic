const express = require('express');
const router = express.Router();
const AuthpageController = require('./AuthpageController');
const { validate } = require('../../util/validations');
//const validations = require('./AuthValidations');
const {verifyToken} = require('../../util/auth');

const {
    models: { Vendor,  },
} = require('../../../../lib/models');


router.get(
    '/reset-password',
    AuthpageController.resetPassword
)

router.post(
    '/reset-password',
    AuthpageController.resetPasswordPost
)

router.get(
    '/email-verify',
    AuthpageController.emailVerify
)

router.get(
    '/success',
    AuthpageController.success
)


module.exports = router;
