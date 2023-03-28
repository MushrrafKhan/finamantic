const express = require('express');
const router = express.Router();
const fs = require('fs');
global._ = require('lodash')


const AuthController = require('./auth/AuthController');
const validations = require('./auth/AuthValidations');
const { validate } = require('../util/validations');
const { verifyToken } = require('../util/auth');

const routes = fs.readdirSync(__dirname);

routes.forEach(route => {
    if (route === 'index.js') return;
    router.use(`/${route}`, require(`./${route}`));
});

router.get('/',verifyToken,AuthController.dashbaord);
router.get('/profile',verifyToken,AuthController.profilePage);
router.post('/profile',verifyToken,validate(validations.profile),AuthController.profile);
router.get('/change-password',verifyToken,AuthController.changePasswordPage);
router.post('/change-password',verifyToken,validate(validations.updatePassword),AuthController.changePassword);
router.post('/counts',verifyToken,validate(validations.counts, 'body', {}, 'self', true), AuthController.counts);
router.post('/is-email-exists',verifyToken,validate(validations.isEmailExists),AuthController.isEmailExists);
router.post('/vendor-email-chk',AuthController.vendorEmailChk);

module.exports = router;
