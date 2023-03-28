const express = require('express');
const router = express.Router();
const QuestionController = require('./QuestionController');
const {verifyToken} = require('../../util/auth');
const {validate} = require('../../util/validations');

router.get('/',verifyToken, QuestionController.listPage);
router.get('/list',verifyToken, QuestionController.list);
router.get("/add", verifyToken, QuestionController.addQuestionPage);
router.post("/add", verifyToken, QuestionController.addQuestionSave);
router.get("/edit/:id", verifyToken, QuestionController.editQuestionPage);
router.post("/edit/:id", verifyToken, QuestionController.editSave);
// router.get('/view/:id',verifyToken,PrayerController.view);
router.get('/update-status',verifyToken,QuestionController.updateStatus);
router.get('/delete/:id',verifyToken,QuestionController.delete);
router.get('/delete-restore/:id',verifyToken,QuestionController.deleteRestore);


module.exports = router;