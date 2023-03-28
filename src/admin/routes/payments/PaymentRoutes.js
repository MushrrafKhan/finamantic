const express = require('express');
const router = express.Router();
const PaymentController = require('../payments/PaymentController');
const {verifyToken} = require('../../util/auth');


router.get('/',verifyToken,PaymentController.listPage);
router.get('/list',verifyToken,PaymentController.list);
router.get('/subscription',verifyToken,PaymentController.add);
router.post('/subscription',verifyToken,PaymentController.saveAdd);
router.get('/android-subscription',verifyToken,PaymentController.androidAdd);
router.post('/android-subscription',verifyToken,PaymentController.saveandroidAdd);
router.get('/view/:id',verifyToken,PaymentController.view);


module.exports = router;