const express = require('express');
const router = express.Router();
const SettingsController = require('./SettingsController');
const {verifyToken} = require('../../util/auth');
const validations = require('./SettingsValidations');
const {validate} = require('../../util/validations');

router.get('/',
    verifyToken,
    SettingsController.settingsPage
);

router.post('/',
    verifyToken,
    validate(validations.settings),
    SettingsController.settingsUpdate
);

module.exports = router;
