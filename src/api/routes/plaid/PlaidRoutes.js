const express = require('express');
const router = express.Router();
const PlaidController = require('./PlaidController');
const { verifyToken } = require('../../util/auth');



router.post('/info',verifyToken,PlaidController.Plaid_info);
router.post('/create_link_token',verifyToken,PlaidController.Link_Token);
router.post('/set_access_token',verifyToken,PlaidController.set_access_token);
router.get('/auth',verifyToken,PlaidController.auth);
router.get('/transactions',verifyToken,PlaidController.transactions);
router.get('/identity',verifyToken,PlaidController.identity);
router.get('/balance',verifyToken,PlaidController.balance);
router.get('/item',verifyToken,PlaidController.item);
router.get('/accounts',verifyToken,PlaidController.accounts);


module.exports = router;