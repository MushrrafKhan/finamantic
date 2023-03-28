const express = require('express');
const router = express.Router();
const SocketController = require('./SocketController');
const { verifyToken } = require('../../util/auth');


router.post('/view_chat',verifyToken,SocketController.viewchat);




module.exports = router;