const express = require('express');
const router = express.Router();
const StaticController = require('./StaticController')
const {verifyToken} = require('../../util/auth')
// const validation = require('./StaticValidation')


router.get("/privacy-policy",verifyToken, StaticController.privacypolicyPage);
router.get("/about-us", verifyToken,  StaticController.aboutusPage);
router.get("/term-condition", verifyToken,  StaticController.termAndCondition);
router.get("/faq", verifyToken,  StaticController.faq);
router.post("/cmsdata/:id",verifyToken, StaticController.cmsdata);




module.exports = router;