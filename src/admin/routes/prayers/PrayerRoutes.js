const express = require('express');
const router = express.Router();
const PrayerController = require('./PrayerController');
const {verifyToken} = require('../../util/auth');
const {validate} = require('../../util/validations');

router.get('/',verifyToken, PrayerController.listPage);
router.get('/list',verifyToken, PrayerController.list);
router.get("/add", verifyToken, PrayerController.addPrayerPage);
router.post("/add", verifyToken, PrayerController.addPrayerSave);
router.get("/edit/:id", verifyToken, PrayerController.editPrayerPage);
router.post("/edit/:id", verifyToken, PrayerController.editSave);
router.get('/view/:id',verifyToken,PrayerController.view);
router.get('/update-status',verifyToken,PrayerController.updateStatus);
router.get('/delete/:id',verifyToken,PrayerController.delete);
router.get('/delete-restore/:id',verifyToken,PrayerController.deleteRestore);


module.exports = router;