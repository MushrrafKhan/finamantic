const express = require('express');
const router = express.Router();
const ChapterController = require('./ChapterController');
const { verifyToken } = require('../../util/auth');
const { validate } = require('../../util/validations');
const { Chapter } = require('../../../../lib/models/models');


router.get('/',verifyToken,ChapterController.listPage);
router.get('/list', verifyToken,ChapterController.list);
router.get('/add',verifyToken,ChapterController.addPage);
router.post('/save-chapter',verifyToken,ChapterController.add);
router.get('/view/:id',verifyToken,ChapterController.view);
router.get('/update-status',verifyToken,ChapterController.updateStatus);
router.get('/edit/:_id',verifyToken,ChapterController.editPage);
router.post('/edit/:_id',verifyToken,ChapterController.edit);
router.get('/delete/:id',verifyToken,ChapterController.delete);
router.get('/delete-chapter/:id',verifyToken,ChapterController.chapterRestore);

module.exports = router;


