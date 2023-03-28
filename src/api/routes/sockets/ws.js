const {
    models: { 
        User,
        Category,
        LikeDislike,
        GroupSwap,
        Notification,
        InvitedUser,
        Friend,
        AdminSettings,
        GroupSwaplike,
        GroupChat,
        Setting,
    },
  } = require('../../../../lib/models');
  const moment = require('moment');
const mongoose = require('mongoose');

  const { showDate, uploadImageLocal, uploadImage } = require('../../../../lib/util');
  const fs = require('fs');
  const multiparty = require('multiparty');
  var FCM = require('fcm-node');
  const async = require('async');
const objectId = require('../../../../lib/util/index');


  let sendMessage =async(gpId,user,msg)=>{
    try{
    //   let groupId = mongoose.Types.ObjectId(gpId);
    // let friendId = mongoose.Types.ObjectId(user);
    let groupId=gpId;
    let friendId=user;
    let message  = msg;
    // let {groupId,message}  = req.body;
    // let friendId=req.user._id;
    let savemessage= new GroupChat({
        groupId,
        friendId,
        message
    });
    await savemessage.save();
    }catch(err){
      console.log(err)
    }
  }

  let getgroupMsg = async(groupId) =>{
    try{

    }catch(err){
      console.log(err);
    }
  }

  module.exports = {
    sendMessage,
    getgroupMsg
  };