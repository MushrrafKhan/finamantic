const express = require('express');
const router = express.Router();
const UtilController = require('./UtilController');
const { validate } = require('../../util/validations');
const validations = require('./UtilValidations');
const { verifyToken } = require('../../util/auth');

router.get('/upload-file',
    verifyToken,
    validate(validations.uploadFile, 'query'),
    UtilController.uploadFile
);

module.exports = router;
