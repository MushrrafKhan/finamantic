const mongoose = require('mongoose');
const moment = require('moment');
const fs = require('fs');
var path = require('path');
require('dotenv').config()
const {
    models: {Admin, EmailNotifcation}
} = require('../../lib/models');
const _ = require('lodash');
const AWS = require('aws-sdk');
const { SSL_OP_NETSCAPE_CHALLENGE_BUG } = require('constants');
AWS.config.update({
    accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY,
    region: process.env.AWS_S3_REGION,
    apiVersion: '2006-03-01',
    signatureVersion: 'v4',
    correctClockSkew: true,
    ACL: 'public-read'
});
s3 = new AWS.S3();


const generateSKU = async (vid) => {

    let SKU = '';
    return SKU;
}

const adminEmail = async()=>{
 let admin = await Admin.find({isDeleted:false, isSuspended:false});
 let email = '';
 if(admin && admin.length>0){
     _.each(admin, (adminData)=>{
      if(email==''){
          email = adminData.email;
      } else {
          email = email+','+adminData.email;
      }
     })
 }
 console.log(process.env.NODE_ENV);
 return email;
}

const addNotification = async(notification)=>{
    let notificationData = {};
    notificationData['notification'] = notification;
    let saveNotification = new EmailNotifcation(notificationData);
     await saveNotification.save();
   }

const randomString = (length = 30, charSet = 'ABC5DEfF&78%G7I5JKL8$MNO7PQR8ST5UVna$sdWXYZa5bjcFh6ijk123456789') => {
    let randomString = '';
    for (let i = 0; i < length; i++) {
        let randomPoz = Math.floor(Math.random() * charSet.length);
        randomString += charSet.substring(randomPoz, randomPoz + 1);
    }
    return randomString;
};

const randomName = (length = 20, charSet = 'ABC5DEfF78G7I5JKL8MNO7PQR8ST5UVNASDWXYZA5BJCFH6IJK123456789') => {
    let randomName = '';
    for (let i = 0; i < length; i++) {
        let randomPoz = Math.floor(Math.random() * charSet.length);
        randomName += charSet.substring(randomPoz, randomPoz + 1);
    }
    return randomName;
};

const generateOtp = ( length = 4, charSet = '1234567890' )=>{
    let randomString = '';
    for (let i = 0; i < length; i++) {
        let randomPoz = Math.floor(Math.random() * charSet.length);
        randomString += charSet.substring(randomPoz, randomPoz + 1);
    }
    //return randomString;
    if(process.env.NODE_ENV=='development'){
        return randomString;
    } else {
        return randomString;
    }

}

const generateCode = ( length = 6, charSet = '1234567890' )=>{
    let randomString = '';
    for (let i = 0; i < length; i++) {
        let randomPoz = Math.floor(Math.random() * charSet.length);
        randomString += charSet.substring(randomPoz, randomPoz + 1);
    }
    
    return randomString;

}

const escapeRegex = text => text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');

// eslint-disable-next-line no-console
const logError = console.error;

/**
 * @param {string} objectId
 * @return {boolean}
 */
const isValidObjectId = objectId => {
    if (mongoose.Types.ObjectId.isValid(objectId)) {
        const id = new mongoose.Types.ObjectId(objectId);
        return id.toString() === objectId;
    }
    return false;
};

const createObjectId = objectId => {
    return new mongoose.Types.ObjectId(objectId);
};

const utcDate = (date = new Date()) => {
    date = new Date(date);
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0));
};

const utcDateTime = (date = new Date()) => {
    date = new Date(date);
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds()));
};

const generateResetToken = (length = 4) => {
    return Math.floor(Math.pow(10, length - 1) + Math.random() * (Math.pow(10, length) - Math.pow(10, length - 1) - 1));
};

const showDate = (date, format = 'MM/DD/YYYY hh:mm A') => utcDate(date).toString() !== 'Invalid Date' ? moment.utc(date).format(format) : 'N/A';

const showTime = seconds => new Date(seconds * 1000).toISOString().substr(11, 8);

const fromNow = date => moment(date).fromNow();


const getWeekNumber = function(dt) { 
    var tdt = new Date(dt.valueOf());
    var dayn = (dt.getDay() + 6) % 7;
    tdt.setDate(tdt.getDate() - dayn + 3);
    var firstThursday = tdt.valueOf();
    tdt.setMonth(0, 1);
    if (tdt.getDay() !== 4) 
      {
     tdt.setMonth(0, 1 + ((4 - tdt.getDay()) + 7) % 7);
       }
    return 1 + Math.ceil((firstThursday - tdt) / 604800000); 

} 

const uploadImage =   (file, imgpath, callback)=> {
    if( file.originalFilename=="" ){
        callback(null, { "nofile":true } );
    }else{
        
        var filePath = file.path;
        var params = {
            Bucket: process.env.AWS_S3_BUCKET,
            Body: fs.createReadStream(filePath),
            Key: imgpath + "/" + Date.now() + "_" + path.basename(filePath),
            ContentType: file.headers['content-type'],
            ACL: 'public-read'
        };

        return new Promise(  (resolve,reject)=>{
            s3.upload(params, function (err, data) {
                if (err) {
                    reject(err);
                } else {
                    resolve(data);
                }
            });
        });
    }
};

const uploadS3 =   (file, uploadDirectory, callback)=> {
    if( file.originalFilename=="" ){
        callback(null, { "nofile":true } );
    }else{
        
        var filePath = file.path;
        var params = {
            Bucket: process.env.AWS_S3_BUCKET,
            Body: fs.createReadStream(filePath),
            Key: uploadDirectory + "/" + Date.now() + "_" + path.basename(filePath),
            ContentType: file.headers['content-type'],
            ACL: 'public-read'
        };

        return new Promise(  (resolve,reject)=>{
            s3.upload(params, function (err, data) {
                if (err) {
                    reject(err);
                } else {
                    resolve(data);
                }
            });
        });
    }
};


const uploadImageLocal =   (tmp_path, target_path, filename, callback)=> {

    if(tmp_path=="" ){
        
        callback(null, { "nofile":true } );

    } else {

        var source = fs.createReadStream(tmp_path);
        var dest = fs.createWriteStream(target_path);

        source.pipe(dest);
        source.on('end', function() { /* copied */ });
        source.on('error', function(err) { /* error */ });

        return `${process.env.SITE_URL}`+'/images/users/'+filename;
    }

};


const uploadVideoLocal =   (tmp_path, target_path, filename, callback)=> {

    if(tmp_path=="" ){
        callback(null, { "nofile":true } );
    }else{

        var source = fs.createReadStream(tmp_path);
        var dest = fs.createWriteStream(target_path);

        source.pipe(dest);
        source.on('end', function() { /* copied */ });
        source.on('error', function(err) { /* error */ });

        return `${process.env.SITE_URL}`+'/videos/'+filename;
    }

};

const uploadTechSheetLocal =   (tmp_path, target_path, filename, callback)=> {

    if(tmp_path=="" ){
        callback(null, { "nofile":true } );
    }else{

        var source = fs.createReadStream(tmp_path);
        var dest = fs.createWriteStream(target_path);

        source.pipe(dest);
        source.on('end', function() { /* copied */ });
        source.on('error', function(err) { /* error */ });

        return `${process.env.API_URL}`+'/products/'+filename;
    }
    
};

const uploadProductCsv1 =   (tmp_path, target_path, filename, callback)=> {

    if(tmp_path=="" ){
        callback(null, { "nofile":true } );
    }else{

        var source = fs.createReadStream(tmp_path);
        var dest = fs.createWriteStream(target_path);

        source.pipe(dest);
        source.on('end', function() { /* copied */ });
        source.on('error', function(err) { /* error */ });

        return `${process.env.SITE_URL}`+'/csv/'+filename;
    }
};


const uploadImageBase64 =   (file, imgpath, callback)=> {
    return new Promise( (resolve,reject)=>{
        //var buf = new Buffer(file.replace(file, ""),'base64')
        const buf = new Buffer.from(file.replace(/^data:image\/\w+;base64,/, ""), 'base64');
        const type = file.split(';')[0].split('/')[1];

        let s3 = new AWS.S3();
        s3.putObject({
            Bucket: process.env.AWS_S3_BUCKET, 
            Key: imgpath, 
            Body: buf,
            ContentType: `image/${type}`,
            ACL: 'public-read'
        }, function(err, data) {
            if (err) {
              reject(err)
            } else {
                resolve(data)
            }
        })
    })
};

const createS3SingnedUrl =   (filename)=> {

    return new Promise((resolve, reject) => {
        const key = `${filename}`;
        s3.getSignedUrl(
            'putObject',
            {
                Bucket: process.env.AWS_S3_BUCKET,
                Key: key,
                ACL: 'public-read',
            },
            (err, data) => {
                if (err) return reject(err);
                resolve(data);
                // resolve({
                //     url: data,
                //     preview: `${process.env.AWS_S3_BASE}${key}`,
                // });
            }
        );
    });
}
 

    // return new Promise( (resolve,reject)=>{
    //     let s3 = new AWS.S3();
    //     var presignedGETURL = s3.getSignedUrl('getObject', {
    //         Bucket: process.env.AWS_S3_BUCKET,
    //         Key: filename, //filename
    //         Expires: 600 //time to expire in seconds
    //     })
    //     resolve(presignedGETURL);
    // })


const timeToMinutes = (x) => {
      x = x.split(":");  
      return  parseInt(x[0])*60 + parseInt(x[1]);
};
const time24To12 = (time)=>{
    time = time.split(':');// here the time is like "16:14"
    let meridiemTime = time[0] >= 12 && (time[0]-12 || 12) + ':' + time[1] + ' PM' || (Number(time[0]) || 12) + ':' + time[1] + ' AM';
    return meridiemTime;
}

const deleteS3 =   (file, uploadDirectory, callback)=> {
    
        //var filePath = file.path;
        var res = file.split(uploadDirectory+"/");
        let keyOfFile=file;
        if(res && res.length>0){
            keyOfFile = res[1];
        }
        var params = {
            Bucket: process.env.AWS_S3_BUCKET,
            Key: uploadDirectory+"/"+keyOfFile
        };

        return new Promise(  (resolve,reject)=>{
            s3.deleteObject(params, function (err, data) {
                if (err) {
                    reject(err);
                } else {
                    resolve(data);
                }
            });
        });
   
};

const captilizeFirstLetterOfWord = (str) => {
    var splitStr = str.toLowerCase().split(' ');
    for (var i = 0; i < splitStr.length; i++) {
        splitStr[i] = splitStr[i].charAt(0).toUpperCase() + splitStr[i].substring(1);     
    }
      return splitStr.join(' '); 
 }

 const uploadImageAPI =   (file, imgpath, callback)=> {
    if( file.originalFilename=="" ){
        callback(null, { "nofile":true } );
    }else{
        var filePath = file.path;
        var params = {
            Bucket: process.env.AWS_S3_BUCKET,
            Body: fs.createReadStream(filePath),
            Key: imgpath + "/" + Date.now() + "_" + path.basename(filePath),
            ContentType: file.mimetype,
            // ContentType: file.headers['content-type'],
            ACL: 'public-read'
        };

        return new Promise(  (resolve,reject)=>{
            s3.upload(params, function (err, data) {
                if (err) {
                    reject(err);
                } else {
                    resolve(data);
                }
            });
        });
    }
};
// const uploadImage =   (file, imgpath, callback)=> {
//     if( file.originalFilename=="" ){
//         callback(null, { "nofile":true } );
//     }else{
        
//         var filePath = file.path;
//         var params = {
//             Bucket: process.env.AWS_S3_BUCKET,
//             Body: fs.createReadStream(filePath),
//             Key: imgpath + "/" + Date.now() + "_" + path.basename(filePath),
//             ContentType: file.headers['content-type'],
//             ACL: 'public-read'
//         };

//         return new Promise(  (resolve,reject)=>{
//             s3.upload(params, function (err, data) {
//                 if (err) {
//                     reject(err);
//                 } else {
//                     resolve(data);
//                 }
//             });
//         });
//     }
// };

 const showDateAccordingTimezone = (date, format = 'MM/DD/YYYY hh:mm A') => date.toString() !== 'Invalid Date' ? moment(date).format(format) : 'N/A';

module.exports = {
    escapeRegex,
    logError,
    isValidObjectId,
    utcDate,
    utcDateTime,
    randomString,
    randomName,
    generateResetToken,
    showDate,
    showDateAccordingTimezone,
    showTime,
    fromNow,
    generateOtp,
    uploadImage,
    uploadImageBase64,
    uploadImageLocal,
    uploadTechSheetLocal,
    uploadProductCsv1,
    uploadVideoLocal,
    uploadS3,
    createS3SingnedUrl,
    timeToMinutes,
    time24To12,
    generateSKU,
    deleteS3,
    adminEmail,
    addNotification,
    generateCode,
    getWeekNumber,
    captilizeFirstLetterOfWord,
    createObjectId,
    uploadImageAPI
};
