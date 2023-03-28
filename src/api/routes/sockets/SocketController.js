const {
    models: { User, Friend, Review, Category, Master, Question, Match,Chat, Message, AdminSetting, Notification,Favorite,Tag },
} = require('../../../../lib/models');
const moment = require('moment');
const { showDate, uploadImageLocal, uploadImage } = require('../../../../lib/util');
const fs = require('fs');
const multiparty = require('multiparty');
var FCM = require('fcm-node');
const async = require('async');


class SocketController {

    async viewchat(req, res, next) {
        const {match_id,receiver_id} = req.body;
        const id = req.user._id
        try {
            let sendermessage = await Message.find({match_id:match_id, $or:[{sender:id},{receiver:receiver_id}]});
            console.log(sendermessage);
         

              
            return res.success(keywords, 'all Admin keywords');
        } catch (err) {
            console.log(err);
            return res.next(err);
        }
    }

}


module.exports = new SocketController();
