const {
    models: {
        User,
        Goal,
        Notification,
        Category,
        Chapter,
        Prayer,
        Question,
        Answer,
        ReflectionAns,
        Premium,
        ShareChap,
        PartnerAns,
        Static,
    },
} = require('../../../../lib/models');
var mongoose = require('mongoose');
const moment = require('moment');
const { showDate, uploadImageLocal, uploadImage, category } = require('../../../../lib/util');
const { Configuration, PlaidApi, PlaidEnvironments } = require('plaid');
const fs = require('fs');
const multiparty = require('multiparty');
const emailEnv = process.env.FROM_MAIL;
var FCM = require('fcm-node');
var serverKey = process.env.SERVER_KEY; //put your server key here
var fcm = new FCM(serverKey);
const multer = require('multer');
const async = require('async');
const {
    utcDateTime,
    generateOtp,
    logError,
    randomString,
    getS3SingnedUrl,
    createS3SingnedUrl,
    generateResetToken,
    sendSms,
    utcDate,
    uploadImageBase64,
    uploadImageAPI,
} = require('../../../../lib/util');
var _ = require('lodash');
const cron = require('node-cron');
var request = require('request');
const { promisify } = require('util');
const unlinkAsync = promisify(fs.unlink);
const sgMail = require('@sendgrid/mail');
const ShareChapterModel = require('../../../../lib/models/models/ShareChapter.model');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// PLAID API Configrations here ...
const PLAID_CLIENT_ID = process.env.PLAID_CLIENT_ID;
const PLAID_SECRET = process.env.PLAID_SECRET;
const PLAID_ENV = process.env.PLAID_ENV || 'sandbox';
const PLAID_PRODUCTS = (process.env.PLAID_PRODUCTS || 'transactions').split(',');
const PLAID_COUNTRY_CODES = (process.env.PLAID_COUNTRY_CODES || 'US').split(',');
const PLAID_REDIRECT_URI = process.env.PLAID_REDIRECT_URI || '';
const PLAID_ANDROID_PACKAGE_NAME = process.env.PLAID_ANDROID_PACKAGE_NAME || '';
let ACCESS_TOKEN = null;
let PUBLIC_TOKEN = null;
let ITEM_ID = null;
let PAYMENT_ID = null;
let TRANSFER_ID = null;
const configuration = new Configuration({
    basePath: PlaidEnvironments[PLAID_ENV],
    baseOptions: {
        headers: {
            'PLAID-CLIENT-ID': PLAID_CLIENT_ID,
            'PLAID-SECRET': PLAID_SECRET,
            'Plaid-Version': '2020-09-14',
        },
    },
});
const client = new PlaidApi(configuration);
const prettyPrintResponse = response => {
    // console.log('===========================');
    console.log('---------------------------');
    console.log(response.data);
    // console.log(util.inspect(response.data, { colors: true, depth: 4 }));
};
const authorizeAndCreateTransfer = async accessToken => {
    // We call /accounts/get to obtain first account_id - in production,
    // account_id's should be persisted in a data store and retrieved
    // from there.
    console.log(accessToken);
    const accountsResponse = await client.accountsGet({
        access_token: accessToken,
    });
    const accountId = accountsResponse.data.accounts[0].account_id;

    const transferAuthorizationResponse = await client.transferAuthorizationCreate({
        access_token: accessToken,
        account_id: accountId,
        type: 'credit',
        network: 'ach',
        amount: '1.34',
        ach_class: 'ppd',
        user: {
            legal_name: 'FirstName LastName',
            email_address: 'foobar@email.com',
            address: {
                street: '123 Main St.',
                city: 'San Francisco',
                region: 'CA',
                postal_code: '94053',
                country: 'US',
            },
        },
    });
    prettyPrintResponse(transferAuthorizationResponse);
    const authorizationId = transferAuthorizationResponse.data.authorization.id;

    const transferResponse = await client.transferCreate({
        idempotency_key: '1223abc456xyz7890001',
        access_token: accessToken,
        account_id: accountId,
        authorization_id: authorizationId,
        type: 'credit',
        network: 'ach',
        amount: '12.34',
        description: 'Payment',
        ach_class: 'ppd',
        user: {
            legal_name: 'FirstName LastName',
            email_address: 'foobar@email.com',
            address: {
                street: '123 Main St.',
                city: 'San Francisco',
                region: 'CA',
                postal_code: '94053',
                country: 'US',
            },
        },
    });
    prettyPrintResponse(transferResponse);
    console.log(transferResponse.data.transfer.id);
    return transferResponse.data.transfer.id;
};
// PLAID API configrations end here ...

//cron running at every day midnight for goals
cron.schedule('0 0 * * *', async () => {
    try {
        let currentDate = moment().toISOString();
        let goals = await Goal.find({ dateTo: { $lte: currentDate }, isActive: true });
        console.log(goals);
        const job = await Goal.updateMany(
            {
                dateTo: { $lte: currentDate },
                isActive: true,
            },
            {
                $set: { isActive: false },
            }
        );
    } catch (err) {
        console.log(err);
    }
});

class UserController {
    async profileAccountInfo(req, res, next) {
        try {
            let _id = req.user._id;
            let user = await User.findOne({ _id });
            // const response = await client.categoriesGet({});
            // const categories = response.data.categories;
            // console.log(categories);
            if (!user) {
                return res.send({
                    success: 0,
                    data: {},
                    message: 'User not found !',
                });
            }
            let imagePath = '';
            if (user.image != '') {
                imagePath = `${process.env.AWS_BASE_URL}${user.image}`;
            }
            if (req.user.isActive) {
                return res.send({
                    success: 1,
                    data: {
                        image: imagePath,
                        user: user,
                        // categories: categories,
                    },
                    message: 'user profile ',
                });
            } else {
                return res.send({
                    success: 0,
                    isActive: req.user.isActive,
                    data: {},
                    message: 'Admin has yet to approve verification',
                });
            }
        } catch (err) {
            console.log(err);
            return res.next(err);
        }
    }
    async updatePassword(req, res) {
        const { user } = req;
        if (req.user.isActive) {
            const { currentPassword, newPassword } = req.body;
            const matched = await user.comparePassword(currentPassword);
            if (!matched) {
                return res.send({
                    success: 0,
                    data: {},
                    message: req.__('PASSWORD_MATCH_FAILURE'),
                });
            }
            const matcheAddedPassword = await user.comparePassword(newPassword);
            if (matcheAddedPassword) {
                return res.send({
                    success: 0,
                    data: {},
                    message: 'Old password and new passowrd can not be same',
                });
            }
            user.password = newPassword;
            await user.save();
            return res.send({
                success: 1,
                data: {},
                message: 'Password updated successfully.',
            });
        } else {
            return res.send({
                success: 0,
                isActive: req.user.isActive,
                data: {},
                message: 'Admin has yet to approve verification',
            });
        }
    }
    async allUser(req, res, next) {
        try {
            let _id = req.user._id;
            let user = await User.findOne({ _id });
            if (!user) {
                return res.send({
                    success: 0,
                    data: {},
                    message: 'User not found !',
                });
            }
            let contact = await User.find({ emailVerify: true, _id: { $ne: _id } });
            return res.success(contact, 'All User Successfully');
        } catch (err) {
            return res.next(err);
        }
    }
    async homeScreen(req, res, next) {
        try {
            let { access_token } = req.body;
            let user = req.user._id;
            let category = [];
            let other = 0;
            //  let dateNow=new Date()
            let findGoals = await Goal.find({ user: user, dateTo: { $gte: new Date() } }).sort({ created: 1 });
        //    console.log(findGoals)
            // console.log(findGoals[0])
            //let findGoals_ = await Goal.find({ user: user,dateTo:{$gte:new Date()} }).sort({ dateFrom: -1 });
            if (findGoals.length == 0) {
                return res.send({
                    status: 0,
                    data: {},
                    message: 'User goals not found',
                });
            }
            const startDate = moment(findGoals[0].dateFrom).format('YYYY-MM-DD');
           // console.log("-----------------------------------------------------------------------------",startDate)
            const endDate = moment(new Date()).format('YYYY-MM-DD');
            console.log(startDate);
            console.log(endDate);
            
            const configs = {
                access_token: access_token,
                start_date: startDate,
                end_date: endDate,
                options: {
                    count: 250,
                    offset: 0,
                },
            };
            let transactions = []
            if((new Date().getTime()) > (new Date(startDate).getTime())){
                const transactionsResponse = await client.transactionsGet(configs);
                transactions = transactionsResponse.data.transactions;
                 //console.log(transactions)
            }
            // const endDate = moment().format('YYYY-MM-DD');
            // console.log('----------=---------');

            let categoryField = [];
            let recentTransactions = [];
            let categoryList = [];
            //   let tempArr=[];

            // findGoals.map(x => {
            //     let spnt = 0;
            //     transactions.map(async i => {
            //         const dateTO = moment(endDate).valueOf();
            //         const dateFROM = moment(x.dateFrom).valueOf();
            //         const DATE = moment(i.date).valueOf();
            //         //   console.log(dateTO,dateFROM,DATE)
            //         //  console.log(i.category[0] == x.category)
            //         if (i.category[0] == x.category && dateTO >= DATE && dateFROM <= DATE && i.amount > 0) {
            //             spnt = spnt + i.amount;
            //             totalSpent = totalSpent + i.amount;
            //             let categoryInfo = await Category.findOne({ name: i.category[0] }).lean();
            //             let recentExpenses = {};
            //             recentExpenses.amount = i.amount;
            //             recentExpenses.category = i.category[0];
            //             recentExpenses.image = categoryInfo.image;
            //             recentExpenses.date = i.date;
            //             recentTransactions.push(recentExpenses);
            //         }
            //     });
            //     let obj = {};
            //     obj.category = x.category;
            //     obj.exp = spnt;
            //     categoryField.push(obj);
            // });

            findGoals.map(x => {
                categoryList.push(x.category);
            });

            let categoryBUDGET={};
            categoryList.map(async e=>{
                let _GOAL = await Goal.find({ user: user,category:e ,dateTo: { $gte: new Date() } }).sort({ created: 1 }).lean();
                let _t=0;
                _GOAL.map(x=>{
                    _t+=Number(x.budget)
                })
                categoryBUDGET[e]=_t;
            })
           

            let categoryInfo = await Category.find({}).lean();
            if(transactions.length> 0){
                transactions.map(async i => {
                    console.log("----------------------------------++++++++++++++++++++++++++++++++++++++++++++++++")
                    const DATE = moment(i.date).valueOf();
                    let GOAL = await Goal.find({ user: user,category:i.category[0], dateTo: { $gte: new Date() } }).sort({ created: 1 }).lean();
                    let t=0;
                   if(GOAL[0]){
                    console.log("------------------MMMMMMMMMMMMMMMMM----------------++++++++++++++++++++++++++++++++++++++++++++++++",categoryField)
                    const STARTDATE = moment(GOAL[0].dateFrom).format('YYYY-MM-DD');
                    const dateTO = moment(endDate).valueOf();
                    const dateFROM = moment(STARTDATE).valueOf();
                    if (categoryList.includes(i.category[0]) && dateTO >= DATE && dateFROM <= DATE && i.amount > 0) {
                        GOAL.map(x=>{
                            t+=Number(x.budget)
                        })
                        categoryBUDGET[i.category[0]]=t;
                        let recentExpenses = {};
                        // console.log(i)
                        categoryInfo.map(cate => {
                            if (cate.name == i.category[0]) recentExpenses.image = cate.image;
                        });
                        recentExpenses.amount = i.amount;
                        recentExpenses.category = i.category[0];
                        recentExpenses.date = i.date;
                        recentTransactions.push(recentExpenses);

                        let obj = {};
                        obj.category = i.category[0];
                        obj.exp = i.amount;
                        obj.budget=t;
                        categoryField.push(obj);
                        console.log("----------------------------------++++++++++++++++++++++++++++++++++++++++++++++++",categoryField)
                    }
                   }
                    // console.log(categoryList.includes(i.category[0]) && dateTO >= DATE && dateFROM <= DATE && i.amount > 0)
                    
                });
            }
           
            //  console.log('=============ggggg===========');
            //    console.log(categoryField_)

            let totalBudget_ = await Goal.find({ user: user, dateTo: { $gte: new Date() } }).lean();
            let totalAmount = 0;
            totalBudget_.map(i => {
                totalAmount = totalAmount + Number(i.budget);
            });

              console.log("LLLLLLLLLLLLLLLLLLLLLLLLLLLL",categoryField)
            let key_ = 'category';
            // console.log(categoryField)

            let categoryField_ = []
            if(categoryField.length > 0){
                categoryField_ = categoryField.reduce((acc, cur) => {
                    const item = acc.length > 0 && acc.find(({ category }) => category === cur.category);
                    if (item) {
                        item.exp += cur.exp;
                    } else acc.push({ category: cur.category, exp: cur.exp,budget:cur.budget });
                    return acc;
                }, []);
            }
            let categoryOTH=[];
            if(categoryField_.length > 0){
                categoryField_.map(x=>{
                    categoryOTH.push(x.category)
                })
               
            }
            console.log("-------------------------------------------------------------------------]]]]]]]]]]]]]]]]]",categoryBUDGET)
            let tempaArr=[];

            categoryList.map(r=>{
                if(categoryOTH.includes(r)||tempaArr.includes(r)){

                }else{
                    tempaArr.push(r)
                    let obj={};
                    obj.category=r;
                    obj.exp=0;
                    obj.budget=categoryBUDGET[r];
                    categoryField_.push(obj)
                }
            })

            var totalSpent = 0;

            if(categoryField_.length > 0){
                categoryField_.forEach(x => {
                    totalSpent += x.exp;
                });
            }
            // console.log('========================',totalBudget_);
            let t = 0;
            let d=0;
            if (categoryField_.length > 2) {
                categoryField_.forEach(x => {
                    t += x.exp;
                    d+=x.budget;
                });
                // console.log(t)
                // console.log(categoryField_[0].exp + categoryField_[1].exp+categoryField_[2].exp)
                t = t - (categoryField_[0].exp + categoryField_[1].exp);
                d=d-(categoryField_[0].budget + categoryField_[1].budget);

                let data = [];
                let obj = {};
                obj.totalSpent = totalSpent;
                // obj.totalSpent = 8000;

                let obj1 = {};
                obj1.totalAmount = totalAmount;
                // obj1.totalAmount = 14000;

                let obj2 = {};
                // console.log(recentTransactions);

                //    let recentTransactions_=[];

                const key = 'category';

                // const recentTransactions_ = [...new Map(recentTransactions.map(item => [item[key], item])).values()];
                // console.log(recentTransactions_)

                obj2.recentTransactions = recentTransactions;

                let obj3 = {};
                obj3.categoryField = [];
                let obj4 = {};
                console.log(categoryField_)
                if (categoryField_.length > 3) {
                    obj4.category = 'Other';
                } else {
                    obj4.category = categoryField_[2].category;
                }
                obj4.exp = t;
                obj4.budget=d;
                // console.log(t)
                obj3.categoryField.push(categoryField_[0], categoryField_[1], obj4);
                data.push(obj, obj1, obj2, obj3);
                return res.send({
                    success: 1,
                    data,
                   // transactions:transactions,
                    message: 'Transactions data get successfully',
                });
            } else {
                // console.log(categoryField_)

                let data = [];
                let obj = {};
                obj.totalSpent = totalSpent;
                // obj.totalSpent = 8000;

                let obj1 = {};
                obj1.totalAmount = totalAmount;
                // obj1.totalAmount = 14000;
                
                let obj2 = {};
                // const recentTransactions_ = [...new Map(recentTransactions.map(item => [item[key], item])).values()];
                //   console.log(recentTransactions_)
                obj2.recentTransactions = recentTransactions;

                let obj3 = {};
                obj3.categoryField = [];

                
                if(categoryField_[0]){
                obj3.categoryField.push(categoryField_[0]);
                }
                if(categoryField_[1]){
                obj3.categoryField.push(categoryField_[1]);
                }
                
                data.push(obj, obj1, obj2, obj3);
                return res.send({
                    success: 1,
                    data,
                   // transactions:transactions,
                    message: 'Transactions data get successfully',
                });
            }
        } catch (err) {
            console.log(err);
            return res.next(err);
        }
    }

    /* async homeScreen_old(req, res, next) {
        try {
            let user = req.user._id;
            let category = [];
            let other = 0;
            let findGoals = await Goal.find({ user: user }).populate({ path: 'category', model: Category });
            // .where({isActive:true});

            findGoals.forEach(cate => {
                // console.log(category.length)
                if (category.length >= 2) {
                    let ct = cate.spent;
                    let c = parseInt(ct);
                    other = other += c;
                } else {
                    category.push(cate);
                }
            });

            category.push({ otherCount: other });

            // console.log(category.length)
            // category.forEach((d)=>{
            //     let data = {}
            //     data.d
            //     console.log(data)
            // })

            let x = 0;
            let y = 0;
            findGoals.forEach(gl => {
                let spend = gl.spent;
                let sp = parseInt(spend);
                y = y += sp;
                let a = gl.budget;
                let data = parseInt(a);
                x = x += data;
            });
            return res.send({
                status: 1,
                totalAmount: x,
                totalSpent: y,
                diffCategory1: category[0],
                diffCategory2: category[1],
                diffCategory3: category[2],
                data: findGoals,
                message: 'home screen data',
            });
        } catch (err) {
            console.log(err);
            return res.next(err);
        }
    } */

    async goalImg(req, res, next) {
        try {
            let form = new multiparty.Form();
            let goal = {};
            form.parse(req, async function(err, fields, files) {
                let fileupload = files.images[0];
                _.forOwn(fields, (field, key) => {
                    goal[key] = field[0];
                });
                try {
                    let image = await uploadImage(fileupload, 'goal');
                    goal['images'] = image.Key;
                    return res.send({
                        success: 1,
                        data: {
                            goal,
                        },
                        message: 'image is added',
                    });
                } catch (err) {
                    console.log(err);
                }
            });
        } catch (err) {
            console.log(err);
            return res.next(err);
        }
    }
    async searchPartner(req, res, next) {
        try {
            let query = {};
            if (req.query.search) {
                const searchValue = new RegExp(
                    req.query.search
                        .split(' ')
                        .filter(val => val)
                        .map(value => value.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'))
                        .join('|'),
                    'i'
                );
                query.$or = [{ name: searchValue }];
            }
            let user = await User.find(query)
                .select('name image ')
                .where({ emailVerify: true });
            console.log(user);
            return res.send({
                success: 1,
                data: {
                    user,
                },
                message: 'search values',
            });
        } catch (err) {
            console.log(err);
            return res.next(err);
        }
    }
    async inviteFrndContact(req, res, next) {
        try {
            let senderId = req.user._id;
            if (req.user.isActive) {
                let { contact } = req.body;
                let appUser = [];
                let partnerUser = [];
                let inviteViaMsg = [];
                let goal = await Goal.findOne({ user: req.user._id }).lean();
                let chapt = await ShareChap.findOne({ senderId: req.user._id }).lean();
                if(goal){
                    console.log('--goal--')
                    let contct = {}
                    let ShareUser = await User.findOne({_id:ObjectId(goal.shareWith)})
                    contct.email = ShareUser.email;
                    contct.name = ShareUser.name;
                    contct._id = ShareUser._id;
                    partnerUser.push(contct);
                    return res.send({
                        success: 1,
                        data: {
                            appUser: partnerUser,
                            sendInviteViaMessage: inviteViaMsg,

                        },
                        message: 'contact list check',
                    });
                }else if(chapt){
                    console.log('--chapt--')
                    let contct = {}
                    let ShareUser = await User.findOne({_id:ObjectId(chapt.receiverId)})
                    console.log(ShareUser)
                    contct.email = ShareUser.email;
                    contct.name = ShareUser.name;
                    contct._id = ShareUser._id;
                    partnerUser.push(contct);
                    return res.send({
                        success: 1,
                        data: {
                            appUser: partnerUser,
                            sendInviteViaMessage: inviteViaMsg
                        },
                        message: 'contact list check',
                    });
                }
                async.mapSeries(
                    contact,
                    async function(contct) {
                        let x = {};
                        let y = {};

                        const regex = / /g;

                        let contact_ = contct.mobile.replace(regex, '');

                        // console.log(contact_);
                        const reg = /^\+91/i;
                        let contact__ = contact_.replace(reg, '');
                        // console.log(contact__)

                        let user = await User.findOne({ _id:{$ne:req.user._id}, phone: contact__, emailVerify: true }).lean();
                        // console.log((user&&(chapt&&user._id.equals(chapt.receiverId))))
                        if (user) {
                            // console.log("______________________________________________________________________________________________")
                            contct.email = user.email;
                            contct._id = user._id;
                            appUser.push(contct);
                            // x.name = name;
                            // x.phone = contct.mobile;
                            // x.message = 'Not part of app please send invitation';
                            // console.log('User not Found send notifications');
                        } else {
                            // console.log("______________________________________________________________________________________________")
                            inviteViaMsg.push(contct);
                        }
                    },
                    function() {
                        return res.send({
                            success: 1,
                            data: {
                                appUser: appUser,
                                sendInviteViaMessage: inviteViaMsg,
                            },
                            message: 'contact list check',
                        });
                    }
                );
            } else {
                return res.send({
                    success: 0,
                    isActive: req.user.isActive,
                    data: {},
                    message: 'Admin has yet to approve verification',
                });
            }
        } catch (err) {
            console.log(err);
            return res.next(err);
        }
    }
    async inviteFrndEmail(req, res, next) {
        try {
            let { email } = req.body;
            if (req.user.isActive) {
                let a = new URL(`${process.env.SITE_URL}`);
                let port = a.port;
                let message = `${req.user.name} has invited you to view the goal`;
                let data = `${req.protocol}://${req.hostname}:${port}`;

                const msg = {
                    to: email,
                    // from: 'baldianupamdev@yopmail.com',
                    from: emailEnv, // Change to your verified sender
                    subject: 'FinaMantic: Your invited For Goal View',
                    text: message,
                    html: '<strong>' + data + '</strong>' + '<br>' + message,
                };

                if(process.env.sendgrid_status == '1'){
                    //Send Email Here
                    // console.log(msg)
                    sgMail
                        .send(msg)
                        .then(() => {
                            return res.send({
                                success: 1,
                                data: {},
                                message: 'Email invitation has sended !',
                            });
                        })
                        .catch(error => {
                            console.error(error);
                        });
                }else{
                    return res.send({
                        success: 1,
                        data: {},
                        message: 'Email invitation has sended !',
                    });
                }
            } else {
                return res.send({
                    success: 0,
                    isActive: req.user.isActive,
                    data: {},
                    message: 'Admin has yet to approve verification',
                });
            }
        } catch (err) {
            console.log(err);
            return res.next(err);
        }
    }
    async categoryList(req, res, next) {
        try {
            const response_ = await client.categoriesGet({});
            const categorie = response_.data.categories;

            let Category = [];
            categorie.map(x => {
                Category.push(x.hierarchy[0]);
            });
            let cate_ = [...new Set(Category)];
            let categories = [];
            cate_.map(x => {
                let obj = {};
                obj.name = x;
                obj._id = x;
                categories.push(obj);
            });
            console.log(categories);
            return res.send({
                success: 1,
                data: {
                    categories,
                },
                message: 'All category list !',
            });
        } catch (err) {
            console.log(err);
            return res.next(err);
        }
    }
    async addGoal(req, res, next) {
        try {
            if (req.user.isActive) {
                let {
                    dateFrom,
                    dateTo,
                    title,
                    budget,
                    spent,
                    category,
                    description,
                    shareWith,
                    images,
                    amount,
                } = req.body;
                let user = req.user._id;
                let user2 = req.user;
                let user_name = req.user;
                console.log(req.body);
                let filter_img = [];
                images.forEach(i => {
                    console.log(i);
                    if (i == null || i == '') {
                        console.log('No Img');
                    } else {
                        filter_img.push(i);
                    }
                });
                let goalCount = await Goal.find({ user: user }).countDocuments();
                let share = await Goal.find({ user: user }).countDocuments();
                // console.log('-------------')
                // console.log(share)
                // console.log('-------------')

                // console.log(goalCount);
                if (req.user.subscription == false) {
                    if (goalCount < 10) {
                        dateTo=new Date(new Date(dateTo).setHours((new Date(dateTo).getHours()+23)));
                        dateTo=new Date(new Date(dateTo).setMinutes((new Date(dateTo).getMinutes()+59)));
                        let addGoal = new Goal({
                            dateFrom,
                            dateTo,
                            user,
                            title,
                            budget,
                            spent,
                            category,
                            description,
                            shareWith,
                            images: filter_img,
                            amount,
                        });
                        await addGoal.save(async (err, result) => {
                            let title = `${req.user.name} has invited you to view the goal`;
                            let notifi = new Notification({
                                senderId: req.user._id,
                                receiverId: result.shareWith,
                                title: title,
                                goalId: result._id,
                                chapterId: null,
                                statusType: "goal",
                                accessToken: user2.accessToken
                            });
                            await notifi.save();

                            let notifiUser = await User.findOne({ _id: result.shareWith });
                            if (notifiUser) {
                                var deviceToken = notifiUser.deviceToken;
                            }
                            // deviceToken = '';
                            // console.log('-------notifi------')
                            // console.log(deviceToken)
                            // console.log('-------notifi------')
                            var message = {
                                "to": deviceToken,

                                "notification": {
                                    "sound": "default",
                                    "title": 'Friend goal',
                                    
                                    "body": `Your friend ${user_name.name} has sent you a goal`,
                                },
                            };
                             console.log('-------notifi------')
                            console.log(message)
                            console.log('-------notifi------')
                            fcm.send(message, function(err, response) {
                                if (err) {
                                    console.log('firbase error ',err)
                                    console.log('firbase error ',err)
                                    console.log('Something has gone wrong!');
                                } else {
                                    console.log('Successfully sent with response: ', response);
                                }
                            });
                            return res.send({
                                success: 1,
                                data: { result },
                                message: 'Goal is added !',
                            });
                        });
                    } else {
                        return res.send({
                            success: 0,
                            data: {},
                            message: 'Please purchase subscription for unlimited goals',
                        });
                    }
                } else {
                    dateTo=new Date(new Date(dateTo).setHours((new Date(dateTo).getHours()+23)));
                    dateTo=new Date(new Date(dateTo).setMinutes((new Date(dateTo).getMinutes()+59)));
                    let addGoal = new Goal({
                        dateFrom,
                        dateTo,
                        user,
                        title,
                        budget,
                        spent,
                        category,
                        description,
                        shareWith,
                        images: filter_img,
                        amount,
                    });
                    await addGoal.save(async (err, result) => {
                        let title = `${req.user.name} has invited you to view the goal`;
                        let notifi = new Notification({
                            senderId: req.user._id,
                            receiverId: result.shareWith,
                            title: title,
                            goalId: result._id,
                            chapterId: null,
                            statusType: "goal",
                            accessToken: user2.accessToken
                        });
                        await notifi.save();

                        let notifiUser = await User.findOne({ _id: result.shareWith });
                        let deviceToken = notifiUser.deviceToken;
                        // console.log('-------notifi------')
                        // console.log(deviceToken)
                        // console.log('-------notifi------')
                        var message = {
                            "to": deviceToken,

                            "notification": {
                                "sound": "default",
                                "title": 'Friend goal',
                                "type": "CONFIRM",
                                "body": `Your friend ${user_name.name} has sent you a goal`,
                            },
                        };


                        fcm.send(message, function(err, response) {
                            if (err) {
                                console.log('firbase error111111 ',err)
                                console.log('Something has gone wrong!');
                            } else {
                                console.log('Successfully sent with response: ', response);
                            }
                        });

                        return res.send({
                            success: 1,
                            data: { result },
                            message: 'Goal is added !',
                        });
                    });
                }
            } else {
                return res.send({
                    success: 0,
                    isActive: req.user.isActive,
                    data: {},
                    message: 'Admin has yet to approve verification',
                });
            }
        } catch (err) {
            console.log(err);
            return next(err);
        }
    }

    /* async addGoal_old(req, res, next) {
        try {
            if (req.user.isActive) {
                let { dateFrom, dateTo, title, budget, spent, category, description, shareWith, images } = req.body;
                let user = req.user._id;

                let filter_img = [];
                images.forEach(i => {
                    console.log(i);
                    if (i == null || i == '') {
                        console.log('No Img');
                    } else {
                        filter_img.push(i);
                    }
                });
                let goalCount = await Goal.find({ user: user }).countDocuments();
                console.log(goalCount);
                if (req.user.subscription == false) {
                    if (goalCount < 10) {
                        let addGoal = new Goal({
                            dateFrom,
                            dateTo,
                            user,
                            title,
                            budget,
                            spent,
                            category,
                            description,
                            shareWith,
                            images: filter_img,
                        });
                        await addGoal.save(async (err, result) => {
                            shareWith.forEach(async usr => {
                                let title = `${req.user.name} has invited you to view the goal`;
                                let notifi = new Notification({
                                    senderId: req.user._id,
                                    receiverId: usr,
                                    title: title,
                                    goalId: result._id,
                                    chapterId: null,
                                });
                                await notifi.save();
                            });
                            // async.mapSeries(
                            //     shareWith,
                            //     async function(usr){
                            //         var appUser = []
                            //         var noAppUser = []
                            //         let allUser = await User.findOne({_id:usr})
                            //         if(allUser){
                            //             appUser.push(allUser)
                            //         }else{
                            //             noAppUser.push(allUser)
                            //         }
                            //     },
                            //     function(){
                            //         console.log("====appUser=====",appUser)
                            //         console.log("====noAppUser=====",noAppUser)
                            //     }
                            // )

                            // shareWith.forEach(async usr => {

                            //     var appUser = []
                            //     var noAppUser = []
                            //     let allUser = await User.findOne({_id:usr})
                            //     if(allUser){
                            //         appUser.push(allUser)
                            //     }else{
                            //         noAppUser.push(allUser)
                            //     }

                            //     // function resolveAfter2Seconds() {
                            //     //     return new Promise(resolve => {
                            //     //       setTimeout(() => {
                            //     //         resolve('resolved');
                            //     //       }, 2000);
                            //     //     });
                            //     //   }

                            //     //   async function asyncCall() {
                            //     //     console.log('calling');
                            //     //     let allUser = await User.findOne({_id:usr})

                            //     //     const result = await resolveAfter2Seconds();
                            //     //     console.log(result);
                            //     //     // expected output: "resolved"
                            //     //   }

                            //     //   asyncCall();
                            // })
                            // console.log("====appUser=====",appUser)
                            // console.log("====noAppUser=====",noAppUser)
                            return res.send({
                                success: 1,
                                data: { result },
                                message: 'Goal is added !',
                            });
                        });
                    } else {
                        return res.send({
                            success: 0,
                            data: {},
                            message: 'Please purchase subscription for unlimited goals',
                        });
                    }
                } else {
                    let addGoal = new Goal({
                        dateFrom,
                        dateTo,
                        user,
                        title,
                        budget,
                        spent,
                        category,
                        description,
                        shareWith,
                        images: filter_img,
                    });
                    await addGoal.save(async (err, result) => {
                        shareWith.forEach(async usr => {
                            let title = `${req.user.name} has invited you to view the goal`;
                            let notifi = new Notification({
                                senderId: req.user._id,
                                receiverId: usr,
                                title: title,
                                goalId: result._id,
                                chapterId: null,
                            });
                            await notifi.save();
                        });

                        return res.send({
                            success: 1,
                            data: { result },
                            message: 'Goal is added !',
                        });
                    });
                }
            } else {
                return res.send({
                    success: 0,
                    isActive: req.user.isActive,
                    data: {},
                    message: 'Admin has yet to approve verification',
                });
            }
        } catch (err) {
            console.log(err);
            return next(err);
        }
    }*/

    /* async allGoals_old(req, res, next) {
        try {
            let _id = req.user._id;
            if (req.user.isActive) {
                const doc = await Goal.aggregate([
                    {
                        $match: { user: _id },
                    },
                    {
                        $lookup: {
                            from: 'users',
                            localField: 'shareWith',
                            foreignField: '_id',
                            as: 'shareWith',
                        },
                        $lookup: {
                            from: 'categories',
                            localField: 'category',
                            foreignField: 'name',
                            as: 'category',
                        },
                    },
                ]);
                return res.send({
                    success: 1,
                    data: { doc },
                    message: 'all goals with category',
                });
            } else {
                return res.send({
                    success: 0,
                    isActive: req.user.isActive,
                    data: {},
                    message: 'Admin has yet to approve verification',
                });
            }
        } catch (err) {
            console.log(err);
            return res.next(err);
        }
    }*/

    async allGoals(req, res, next) {
        try {
            let _id = req.user._id;
            if (req.user.isActive) {
                const doc = await Goal.aggregate([
                    {
                       
                        $match:{$or:[{ user: _id },{ shareWith: _id }], dateTo: { $gte: new Date() }}
                    },
                    {
                        $group: {
                            _id: '$category',
                            cates: { $first: '$category' },
                            goalIds: { $push: '$_id' },
                        },
                    },
                    {
                        $lookup: {
                            from: 'categories',
                            localField: '_id',
                            foreignField: 'name',
                            as: 'cate',
                        },
                    },
                    {
                        $lookup: {
                            from: 'goals',
                            localField: 'goalIds',
                            foreignField: '_id',
                            as: 'goalsDetail',
                        },
                    },
                    {
                        $lookup: {
                            from: 'users',
                            localField: 'goalsDetail.shareWith',
                            foreignField: '_id',
                            as: 'shareWith',
                        },
                    },
                    {
                        $sort:{
                            "goalsDetail.created":-1
                        }
                    }
                ]);
                return res.send({
                    success: 1,
                    data: { doc },
                    message: 'All goals get successfully',
                });
            } else {
                return res.send({
                    success: 0,
                    isActive: req.user.isActive,
                    data: {},
                    message: 'Admin has yet to approve verification',
                });
            }
        } catch (err) {
            console.log(err);
            return res.next(err);
        }
    }

    async goalInCategory(req, res, next) {
        try {
            if (req.user.isActive) {
                //   let goalId = ObjectId(req.body.category);
                let goals = await Goal.find({ category: req.body.category, $or:[{user:req.user._id},{shareWith:req.user._id}] }).populate({
                    path: 'shareWith',
                    select: 'image name',
                    model: 'User',
                }).populate({path: 'user', select: 'image name accessToken ', model:User})
                return res.send({
                    success: 1,
                    data: {
                        goals: goals,
                        category: req.body.category,
                    },
                    message: 'All goals according to category',
                });
            } else {
                return res.send({
                    success: 0,
                    isActive: req.user.isActive,
                    data: {},
                    message: 'Admin has yet to approve verification',
                });
            }
        } catch (err) {
            console.log(err);
            return res.next(err);
        }
    }
    async frndViewGoal(req, res, next) {
        try {
            let user = req.user._id;
            let { access_token } = req.body;
            let _id = ObjectId(req.body.goalId);
            if (req.user.isActive) {
                let currentUser = {
                    name: req.user.name,
                    image: req.user.image,
                };
                let category = req.body.category;

                let goals = await Goal.findOne({ user, _id })
                    .populate({ path: 'shareWith', model: User })
                    .lean();
                console.log(goals);
                let goals_ = await Goal.find({ user, category: goals.category });
                var budget = 0;
                let flag = false;
                goals_.map(y => {
                    // console.log(y._id.equals(_id));
                    if (!y._id.equals(_id) && !flag) {
                        budget = budget + Number(y.budget);
                    } else {
                        flag = true;
                    }
                });

                const startDate = moment(goals_[0].dateFrom).format('YYYY-MM-DD');
                const endDate = moment(new Date()).format('YYYY-MM-DD');
                // console.log(findGoals);
                // console.log(findGoals_);
                // const endDate = moment().format('YYYY-MM-DD');
                const configs = {
                    access_token: access_token,
                    start_date: startDate,
                    end_date: endDate,
                    options: {
                        count: 250,
                        offset: 0,
                    },
                };
                // console.log('----------=---------');
                const transactionsResponse = await client.transactionsGet(configs);
                let transactions = transactionsResponse.data.transactions;

                let spnt = 0;
                transactions.map(i => {
                    if (i.category[0] == goals.category && i.amount > 0) {
                        spnt = spnt + i.amount;
                    }
                });
                let amount_spent = 0;
                if (budget > spnt) {
                    amount_spent = 0;
                } else {
                    if (budget + Number(goals.budget) < spnt) {
                        amount_spent = Number(goals.budget);
                    } else {
                        amount_spent = spnt - budget;
                    }
                }

                let categoryInfo = await Category.findOne({ name: goals.category });
                let budget_ = Number(goals.budget);

                goals.amount_spent = amount_spent;
                goals.total_amount = budget_;
                goals.categoryInfo = categoryInfo;

                return res.send({
                    success: 1,
                    goals,

                    message: 'View goals',
                });
            } else {
                return res.send({
                    success: 0,
                    isActive: req.user.isActive,
                    data: {},
                    message: 'Admin has yet to approve verification',
                });
            }
        } catch (err) {
            console.log(err);
            return res.next(err);
        }
    }
    async viewGoal(req, res, next) {
        try {
            let user = req.user._id;
            let { access_token } = req.body;
            let _id = ObjectId(req.body.goalId);
            // console.log('------------')
            if (req.user.isActive) {
                let currentUser = {
                    name: req.user.name,
                    image: req.user.image,
                };
                let category = req.body.category;
                let goals = await Goal.findOne({_id })
                    .populate({ path: 'shareWith', model: User })
                    .populate({path: 'user', select: 'image name ', model:User})
                    .lean();
                console.log(goals);
                let goals_ = await Goal.find({ user:goals.user, category: goals.category });
                var budget = 0;
                let flag = false;
                goals_.map(y => {
                    // console.log(y._id.equals(_id));
                    if (!y._id.equals(_id) && !flag) {
                        budget = budget + Number(y.budget);
                    } else {
                        flag = true;
                    }
                });

                const startDate = moment(goals_[0].dateFrom).format('YYYY-MM-DD');
                const endDate = moment(new Date()).format('YYYY-MM-DD');
                // console.log(findGoals);
                // console.log(findGoals_);
                // const endDate = moment().format('YYYY-MM-DD');
                const configs = {
                    access_token: access_token,
                    start_date: startDate,
                    end_date: endDate,
                    options: {
                        count: 250,
                        offset: 0,
                    },
                };
                 console.log('----------=---------',new Date().getTime(),new Date(startDate).getTime());
                let transactions=[];
                if(((new Date().getTime()) > (new Date(startDate).getTime()))){
                const transactionsResponse = await client.transactionsGet(configs);
                     transactions = transactionsResponse.data.transactions;
                }
                let spnt = 0;
                if(transactions.length>0){
                    transactions.map(i => {
                        if (i.category[0] == goals.category && i.amount > 0) {
                            spnt = spnt + i.amount;
                        }
                    });
                }
               
                let amount_spent = 0;
                if (budget > spnt) {
                    amount_spent = 0;
                } else {
                    if (budget + Number(goals.budget) < spnt) {
                        amount_spent = Number(goals.budget);
                    } else {
                        amount_spent = spnt - budget;
                    }
                }

                let categoryInfo = await Category.findOne({ name: goals.category });
                console.log(categoryInfo)
                let budget_ = Number(goals.budget);

                goals.amount_spent = amount_spent;
                goals.total_amount = budget_;
                goals.categoryInfo = categoryInfo;

                return res.send({
                    success: 1,
                    goals,

                    message: 'View goals',
                });
            } else {
                return res.send({
                    success: 0,
                    isActive: req.user.isActive,
                    data: {},
                    message: 'Admin has yet to approve verification',
                });
            }
        } catch (err) {
            console.log(err);
            return res.next(err);
        }
    }
    async updateProfile(req, res, next) {
        try {
            let _id = req.user._id;
            if (req.user.isActive) {
                let user = await User.findOne({ _id });
                if (user) {
                    const upload = multer({ dest: 'uploads/' }).single('image');
                    upload(req, res, async err => {
                        if (err) {
                            return res.send({
                                success: 0,
                                data: {},
                                message: 'Something went wrong!',
                            });
                        }
                        const file = req.file;
                        if (!file) {
                            user.name = req.body.name;
                            user.phone = req.body.phone;
                            user.age = req.body.age;
                            user.gender = req.body.gender;
                            user = await user.save();
                            const userJson = user.toJSON();
                            return res.send({
                                success: 1,
                                data: userJson,
                                message: req.__('Profile updated successfully'),
                            });
                        } else {
                            let image = await uploadImageAPI(file, 'user');
                            console.log(image);
                            user.image = image.Key;
                            user.name = req.body.name;
                            user.phone = req.body.phone;
                            user.age = req.body.age;
                            user.gender = req.body.gender;
                            await unlinkAsync(file.path);
                            user = await user.save();
                            const userJson = user.toJSON();
                            return res.send({
                                success: 1,
                                data: {
                                    imageUrl: image.Location,
                                    userJson: userJson,
                                },
                                message: req.__('Profile updated successfully'),
                            });
                        }
                    });
                } else {
                    return res.send({
                        success: 0,
                        data: {},
                        message: req.__('USER_NOT_FOUND'),
                    });
                }
            } else {
                return res.send({
                    success: 0,
                    isActive: req.user.isActive,
                    data: {},
                    message: 'Admin has yet to approve verification',
                });
            }
        } catch (err) {
            console.log(err);
            return res.next(err);
        }
    }
    async enableNotification(req, res, next) {
        try {
            if (req.user.isActive) {
                let _id = req.user._id;
                let status = req.body.status;
                let user = await User.findOne({ _id });
                user.isNotification = status;
                await user.save();
                if (status == true) {
                    return res.send({
                        success: 1,
                        data: user,
                        message: `Notification is on`,
                    });
                } else {
                    return res.send({
                        success: 1,
                        data: user,
                        message: `Notification is off`,
                    });
                }
            } else {
                return res.send({
                    success: 0,
                    isActive: req.user.isActive,
                    data: {},
                    message: 'Admin has yet to approve verification',
                });
            }
        } catch (err) {
            console.log(err);
            return next(err);
        }
    }
    async booksAndPrayer(req, res, next) {
        try {
            let user = req.user._id;
            if (req.user.isActive) {
                let chapter = await Chapter.find({ isActive: true, isDeleted: false }).select('chapter_no');
                console.log(chapter);
                return res.send({
                    success: 1,
                    data: { chapter },
                    message: 'All chapter number ',
                });
            } else {
                return res.send({
                    success: 0,
                    isActive: req.user.isActive,
                    data: {},
                    message: 'Admin has yet to approve verification',
                });
            }
        } catch (err) {
            console.log(err);
            return res.next(err);
        }
    }
    async chaterDetails(req, res, next) {
        try {
            let user = req.user._id;
            if (req.user.isActive) {
                let chId = req.body.chapter;
                let chapterDetails = await Chapter.findOne({ _id: chId });
                let findQuestion = await Answer.countDocuments({ user, chapter: chId });
                let refAnswer = await ReflectionAns.countDocuments({ user, chapter: chId });
                let isAnswered;
                if (refAnswer > 0 || findQuestion > 0) {
                    isAnswered = true;
                } else {
                    isAnswered = false;
                }
                console.log(isAnswered);
                return res.send({
                    success: 1,
                    isAnswered: isAnswered,
                    data: { chapterDetails },
                    message: ' Chapter Details  ',
                });
            } else {
                return res.send({
                    success: 0,
                    isActive: req.user.isActive,
                    data: {},
                    message: 'Admin has yet to approve verification',
                });
            }
        } catch (err) {
            console.log(err);
            return res.next(err);
        }
    }
    async prayerChapterWise(req, res, next) {
        try {
            if (req.user.isActive) {
                let chapter = req.body.chapter;
                let chapterNo = await Chapter.findOne({ _id: chapter });
                let prayers = await Prayer.find({ chapter: chapter });
                return res.send({
                    success: 1,
                    data: {
                        chapter: `Chapter ${chapterNo.chapter_no}`,
                        prayers: prayers,
                    },
                    message: 'Prayer of  praticular chapter',
                });
            } else {
                return res.send({
                    success: 0,
                    isActive: req.user.isActive,
                    data: {},
                    message: 'Admin has yet to approve verification',
                });
            }
        } catch (err) {
            console.log(err);
        }
    }
    async chapterQuestions(req, res, next) {
        try {
            if (req.user.isActive) {
                let chapterId = req.body.chapter;
                let chapter = await Chapter.findOne({ _id: chapterId });
                console.log(chapter);
                let questions = await Question.find({ chapter: chapterId }).where({
                    isActive: true,
                    isDeleted: false,
                });
                return res.send({
                    succuss: 1,
                    data: {
                        chapter: `Chapter ${chapter.chapter_no}`,
                        questions,
                    },
                    message: 'all question list according to chapter',
                });
            } else {
                return res.send({
                    success: 0,
                    isActive: req.user.isActive,
                    data: {},
                    message: 'Admin has yet to approve verification',
                });
            }
        } catch (err) {
            console.log(err);
            return res.next(err);
        }
    }
    async chapterReflectionQuestion(req, res, next) {
        try {
            if (req.user.isActive) {
                let chapterId = req.query.chapter;
                let chapter = await Chapter.findOne({ _id: chapterId });
                let questions = await Question.find({ chapter: chapterId }).where({
                    questionType: 'description',
                    isActive: true,
                    isDeleted: false,
                });
                return res.send({
                    status: 1,
                    chapter: `Chapter ${chapter.chapter_no}`,
                    questions,
                    message: 'all Reflection  list according to chapter',
                });
            } else {
                return res.send({
                    success: 0,
                    isActive: req.user.isActive,
                    data: {},
                    message: 'Admin has yet to approve verification',
                });
            }
        } catch (err) {
            console.log(err);
            return res.next(err);
        }
    }
    async chapterAnswer(req, res, next) {
        try {
            if (req.user.isActive) {
                let user = req.user._id;
                let { chapter, answers, reflection } = req.body;
                let answer_array = [];
                let obj = {};
                // console.log(req.body);
                answers.forEach(async ans => {
                    console.log(ans);
                    chapter = ans.chapter;
                    obj = {
                        questionId: ans.questionId,
                        dayOfWeek: ans.dayOfWeek,
                        timeOfDay: ans.timeOfDay,
                        subjectOfPrayer: ans.subjectOfPrayer,
                    };

                    answer_array.push(obj);
                });

                let partners = new Answer({
                    chapter: chapter,
                    user,
                    answers: answer_array,
                });
                await partners.save();
                reflection.forEach(async ref => {
                    //  console.log(ref)
                    let reflections = new ReflectionAns({
                        user,
                        chapter: ref.chapter,
                        questionId: ref.questionId,
                        description: ref.description,
                    });
                    await reflections.save();
                });
                return res.send({
                    status: 1,
                    data: {},
                    message: ' your answer is saved ',
                });
            } else {
                return res.send({
                    success: 0,
                    isActive: req.user.isActive,
                    data: {},
                    message: 'Admin has yet to approve verification',
                });
            }
        } catch (err) {
            console.log(err);
            return res.next(err);
        }
    }
    async shareChPartner(req, res, next) {
        try {
            if (req.user.isActive) {
                let senderId = req.user._id;
                let user_name = req.user.name;
                let { chapter, receiverId, questionId } = req.body;
                receiverId.forEach(async function(usr) {
                    let share = new ShareChap({
                        senderId,
                        receiverId: usr,
                        chapter,
                        questionId,
                    });
                    await share.save(async (err, result) => {
                        let title = `${req.user.name} has invited you to view answer of chapter`;
                        let notifi = new Notification({
                            senderId: req.user._id,
                            receiverId: usr,
                            title: title,
                            chapterId: chapter,
                            goalId: null,
                            statusType: "goal"
                        });
                        await notifi.save();
                    });

                    let notifiUser = await User.findOne({ _id: usr });
                    let deviceToken = notifiUser.deviceToken;
                    // console.log('-------notifi------')
                    // console.log(deviceToken)
                    // console.log('-------notifi------')
                    var message = {
                        "to": deviceToken,

                        "notification": {
                            "sound": "default",
                            "title": 'Share chapter',
                            //"type": "CONFIRM",
                            "body": `Your friend ${user_name} shared a chapter with you`,
                        },
                    };
                    fcm.send(message, function(err, response) {
                        if (err) {
                            console.log('Something has gone wrong!');
                        } else {
                            console.log('Successfully sent with response: ', response);
                        }
                    });
                });
                return res.send({
                    status: 1,
                    message: 'Partner invited succussfully !',
                });
            } else {
                return res.send({
                    success: 0,
                    isActive: req.user.isActive,
                    data: {},
                    message: 'Admin has yet to approve verification',
                });
            }
        } catch (err) {
            console.log(err);
            return res.next(err);
        }
    }
    async getPartnerChpDetail(req, res, next) {
        try {
            if (req.user.isActive) {
                let user = req.user._id;
                let chapterId = await ShareChap.find({ receiverId: user })
                    .populate({ path: 'senderId', select: 'image name ', model: User })
                    .populate({ path: 'chapter', select: '', model: Chapter });
                console.log(chapterId);
                return res.send({
                    status: 1,
                    data: chapterId,
                    message: 'chapter details',
                });
            } else {
                return res.send({
                    success: 0,
                    isActive: req.user.isActive,
                    data: {},
                    message: 'Admin has yet to approve verification',
                });
            }
        } catch (err) {
            console.log(err);
            return res.next(err);
        }
    }
    async givePartnerAns(req, res, next) {
        try {
            let user = req.user._id;
            if (req.user.isActive) {
                let { chapter, answers, senderId } = req.body;
                // console.log(req.body);
                answers.forEach(async ans => {
                    let partners = new PartnerAns({
                        chapter,
                        user,
                        senderId,
                        questionId: ans.questionId,
                        dayOfWeek: ans.dayOfWeek,
                        timeOfDay: ans.timeOfDay,
                        subjectOfPrayer: ans.subjectOfPrayer,
                    });
                    await partners.save();
                });
                return res.send({
                    status: 1,
                    message: 'your answer is saved !',
                });
            } else {
                return res.send({
                    success: 0,
                    isActive: req.user.isActive,
                    data: {},
                    message: 'Admin has yet to approve verification',
                });
            }
        } catch (err) {
            console.log(err);
            return res.next(err);
        }
    }
    async reflectionAnswer(req, res, next) {
        try {
            let { chapter, questionId, description } = req.body;
            let user = req.user._id;
            let reflections = new ReflectionAns({
                user,
                chapter,
                questionId,
                description,
            });

            await reflections.save((err, result) => {
                return res.send({
                    status: 1,
                    data: result,
                    message: 'your answer is saved !',
                });
            });
        } catch (err) {
            console.log(err);
            return res.next(err);
        }
    }
    async getSharedChapter(req, res, next) {
        try {
            let user = req.user._id;
            await ShareChap.aggregate([
                {
                    $unwind: '$chapter',
                },
                { $match: { senderId: user } },
                {
                    $group: {
                        _id: '$chapter',
                    },
                },
            ]).exec(function(err, transactions) {
                Chapter.populate(transactions, { path: '_id' }, function(err, getChapterShared) {
                    return res.send({
                        status: 1,
                        getChapterShared,
                        message: 'Get shared Chapter number ',
                    });
                });
            });
        } catch (err) {
            console.log(err);
            return res.next(err);
        }
    }
    async getPartnersAns(req, res, next) {
        try {
            let user = req.user._id;
            let { chapter } = req.body;

            let getAnswers = await PartnerAns.find({ senderId: user, chapter: chapter })
                .populate({ path: 'chapter', model: Chapter })
                .populate({ path: 'questionId', model: Question })
                .populate({ path: 'senderId', select: 'name image ', model: User });
            console.log(getAnswers);
            return res.send({
                status: 1,
                data: getAnswers,
                message: 'getPartners answers',
            });
        } catch (err) {
            console.log(err);
            return res.next(err);
        }
    }
    async notification(req, res, next) {
        try {
            if (req.user.isActive) {
                let user = req.user._id;
                let notif = await Notification.find({ receiverId: user })
                    .populate({ path: 'chapterId', select: 'chapter_no', model: Chapter })
                    .populate({ path: 'senderId', select: 'name image ', model: User })
                    .populate({ path: 'goalId', select: 'title', model: Goal }).sort({ created: -1 });
                return res.send({
                    status: 1,
                    notification: notif,
                    message: 'all notifications',
                });
            } else {
                return res.send({
                    success: 0,
                    isActive: req.user.isActive,
                    data: {},
                    message: 'Admin has yet to approve verification',
                });
            }
        } catch (err) {
            console.log(err);
            return res.next(err);
        }
    }
    async subscriptionlist(req, res, next) {
        try {
            if (req.user.isActive) {
                let device_type = req.body.device_type;
                let subscriptions = await Premium.find({ device_type }).lean();
                console.log(subscriptions);
                let features = subscriptions[0].features.split(',');
                // console.log("----", features)
                let arr = [];
                features.map(f => {
                    let obj = {};
                    obj.features = f;
                    arr.push(obj);
                });
                // let feat = {};
                subscriptions[0].features = arr;
                return res.send({
                    success: 1,
                    data: { subscriptions },
                    // features: arr,
                    message: 'subscription list ',
                });
            } else {
                return res.send({
                    success: 0,
                    isActive: req.user.isActive,
                    data: {},

                    message: 'Admin has yet to approve verification ',
                });
            }
        } catch (err) {
            console.log(err);
            return res.next(err);
        }
    }

    async subscriptionAdd(req, res, next) {
        try {
            let subscriptionId = req.body.subscriptionId;
            let id_ = req.user._id;
            let user = await User.findOne({ _id: id_, isDeleted: false });
            if (!user) {
                return res.notFound('', req.__('USER_NOT_FOUND'));
            }
            (user.subscription = true), (user.subscriptionId = subscriptionId), (user.subscriptionDate = new Date());

            let newUser = await user.save();

            res.success(newUser, 'Subscription Add Successfully');
        } catch (err) {
            console.log(err);
            return res.next(err);
        }
    }
    async linkAccount(req, res, next) {
        try {
            const configs = {
                user: {
                    // This should correspond to a unique id for the current user.
                    client_user_id: req.user._id,
                },
                client_name: 'Plaid Quickstart',
                country_codes: PLAID_COUNTRY_CODES,
                products: PLAID_PRODUCTS,
                language: 'en',
            };
            console.log('===========/api/create_link_token==========');

            if (PLAID_REDIRECT_URI !== '') {
                configs.redirect_uri = PLAID_REDIRECT_URI;
            }

            if (PLAID_ANDROID_PACKAGE_NAME !== '') {
                configs.android_package_name = PLAID_ANDROID_PACKAGE_NAME;
            }
            const createTokenResponse = await client.linkTokenCreate(configs);
            //   console.log('=========');
            //   console.log(createTokenResponse.data)
            //   console.log('=========');
            prettyPrintResponse(createTokenResponse);
            const tokenResponse = await client.itemPublicTokenExchange({
                public_token: createTokenResponse.data.link_token,
            });
            //   console.log('=====public token ======')
            //   console.log(PUBLIC_TOKEN)
            console.log('===========/api/set_access_token==========');
            prettyPrintResponse(tokenResponse);
            ACCESS_TOKEN = tokenResponse.data.access_token;
            ITEM_ID = tokenResponse.data.item_id;
            if (PLAID_PRODUCTS.includes('transfer')) {
                TRANSFER_ID = await authorizeAndCreateTransfer(ACCESS_TOKEN);
            }
            console.log(ACCESS_TOKEN);
            console.log(ITEM_ID);
            res.json({
                access_token: ACCESS_TOKEN,
                item_id: ITEM_ID,
                error: null,
            });
            //   return res.send({
            //       status:1,
            //       data:createTokenResponse.toJSON(),
            //       message:"=========="
            //   })
            //   response.json(createTokenResponse.data);
        } catch (err) {
            console.log(err);
            return res.next(err);
        }
    }
    async getTransaction(req, res, next) {
        try {
            // let cate=new Category({
            //     name:"Food"
            // });
            // await cate.save();
            // return res.send({
            //     message:"Category is added"
            // });
        } catch (err) {
            console.log(err);
            return res.next(err);
        }
    }
    async staticPages(req, res, next) {
        try {
            const slug = req.body.slug;
            let a = new URL(`${process.env.SITE_URL}`);
            let port = a.port;
            let data = `${req.protocol}://${req.hostname}:${port}`;
            var pageURL = '';
            const p = await Static.findOne({ slug: slug });
            if (slug == 'about-us') {
                // pageURL = `${data}/auth/about-us`;
                pageURL = `http://makeamericadateagain.xyz/about_us.html`;
            } else if (slug == 'terms-conditions') {
                // pageURL = `${data}/auth/terms-conditions`;
                pageURL = `http://makeamericadateagain.xyz/terms_conditions.html`;
            } else if (slug == 'privacy-policy') {
                // pageURL = `${data}/auth/privacy-policy`;
                pageURL = `http://makeamericadateagain.xyz/privacy.html`;
            }
            return res.send({
                success: 1,
                data: { pageURL },
                msg: 'Details has been fetched successfully',
            });
        } catch (err) {
            console.log(err);
            return res.next(err);
        }
    }
    async ansPartner(req, res, next) {
        try {
            let _id = req.user._id;
            let shareChapter = await ShareChap.find({ $or: [{ senderId: _id }, { receiverId: _id }] }).lean();
            console.log(shareChapter);
            res.send({
                success: 1,
                data: shareChapter,
                msg: 'Show all all chapter i share and i received questions',
            });
        } catch (err) {
            console.log(err);
            return res.next(err);
        }
    }
    async expenses(req, res, next) {
        try {
            let { access_token } = req.body;
            let user = req.user._id;
            let findGoals = await Goal.find({ user: user }).sort({ created: 1 });
            let findGoals_ = await Goal.find({ user: user }).sort({ dateFrom: -1 });
            // console.log('-----------');
            // console.log(findGoals);
            if (findGoals.length == 0) {
                return res.send({
                    status: 0,
                    data: {},
                    message: 'User goals not found',
                });
            }
            const startDate = moment(findGoals[0].dateFrom).format('YYYY-MM-DD');
            const endDate = moment(new Date()).format('YYYY-MM-DD');
            // console.log(findGoals);
            // console.log(findGoals_);
            // const endDate = moment().format('YYYY-MM-DD');
            const configs = {
                access_token: access_token,
                start_date: startDate,
                end_date: endDate,
                options: {
                    count: 250,
                    offset: 0,
                },
            };
            const transactionsResponse = await client.transactionsGet(configs);
            let transactions = transactionsResponse.data.transactions;
            // console.log(transactions);
            let recentTransactions = [];
            let categoryList = [];

            let recentTran = [];

            findGoals.map(x => {
                categoryList.push(x.category);
            });

            const dateTO = moment(endDate).valueOf();
            const dateFROM = moment(startDate).valueOf();

            let categoryInfo = await Category.find({}).lean();
            transactions.map(i => {
                const DATE = moment(i.date).valueOf();
                // console.log(categoryList.includes(i.category[0]) && dateTO >= DATE && dateFROM <= DATE && i.amount > 0)
                if (categoryList.includes(i.category[0]) && dateTO >= DATE && dateFROM <= DATE && i.amount > 0) {
                    let recentExpenses = {};
                    // console.log(i)
                    categoryInfo.map(cate => {
                        if (cate.category == i.category[0]) recentExpenses.image = cate.image;
                    });
                    recentExpenses.amount = i.amount;
                    recentExpenses.category = i.category[0];
                    recentExpenses.date = i.date;
                    recentTran.push(recentExpenses);

                    
                }
            });
            let cateImg = await Category.find()
                .select('image name -_id')
                .lean();

            recentTran.map(x => {
                cateImg.map(y => {
                    if (x.category == y.name) {
                        x.img = y.image;
                    }
                });
            });
            // recentExpenses.image = cateImg.image
            // console.log(cateImg)

            if (recentTran.length == 0) {
                return res.send({
                    status: 0,
                    data: {},
                    message: 'User expense not found',
                });
            }

            return res.send({
                success: 1,
                data: recentTran,
                message: 'Expense get successfully',
            });
        } catch (err) {
            // console.log(err);
            return res.next(err);
        }
    }

    /*async expenses2(req, res, next) {
        try {
            if (req.user.isActive) {
                let user = req.user._id;
                let expense = await Goal.find({ user }).populate({ path: 'category', model: Category });
                return res.send({
                    success: 1,
                    data: { expense },
                    message: 'All my expense',
                });
            } else {
                return res.send({
                    success: 0,
                    isActive: req.user.isActive,
                    data: {},
                    message: 'Admin has yet to approve verification',
                });
            }
        } catch (err) {
            console.log(err);
            return res.next(err);
        }
    }*/

    async myAnsChapterList(req, res, next) {
        try {
            if (req.user.isActive) {
                let user = req.user._id;
                let chapter = await Answer.find({ user })
                    .populate({ path: 'chapter', select: 'chapter_no ', model: Chapter })
                    .select('chapter -_id');

                // let getReflection = await ReflectionAns.find({ user })
                //     .populate({ path: 'chapter', select: 'chapter_no title', model: Chapter })
                //     .select('chapter');
                return res.send({
                    success: 1,
                    data: { chapter },
                    message: 'All give answer list',
                });
            } else {
                return res.send({
                    success: 0,
                    isActive: req.user.isActive,
                    data: {},
                    message: 'Admin has yet to approve verification',
                });
            }
        } catch (err) {
            console.log(err);
            return res.next(err);
        }
    }
    async showMyAnswer(req, res, next) {
        try {
            if (req.user.isActive) {
                let user = req.user._id;

                let { chapter } = req.body;

                let Data = [];

                chapter = mongoose.Types.ObjectId(chapter);

                let answer = await Answer.find({ chapter, user })
                    .populate({ path: 'chapter', select: 'chapter_no', model: Chapter })
                    .populate({ path: 'answers.questionId', model: Question });
                // console.log(answer);
                let reflectionAnswer = await ReflectionAns.find({ user, chapter })
                    .populate({ path: 'chapter', select: 'chapter_no', model: Chapter })
                    .populate({ path: 'questionId', model: Question });

                if (answer.length > 0) {
                    // Data.push({"chapter":answer[0].chapter})
                    answer.forEach(i => {
                        let array = i.answers;
                        array.forEach(a => {
                            Data.push(a);
                        });
                    });
                }
                if (reflectionAnswer.length > 0) {
                    reflectionAnswer.forEach(i => {
                        Data.push(i);
                    });
                }

                // console.log(detail)

                return res.send({
                    success: 1,
                    chapter: answer[0].chapter,
                    data: Data,
                    //data: { answer, reflectionAnswer },
                    message: 'Chapter answer',
                });
            } else {
                return res.send({
                    success: 0,
                    isActive: req.user.isActive,
                    data: {},
                    message: 'Admin has yet to approve verification',
                });
            }
        } catch (err) {
            console.log(err);
            return res.next(err);
        }
    }

    async showMyAnswer2(req, res, next) {
        try {
            console.log('-----');
            // let user = req.user._id;

            let chapter = req.body.chapter;
            let friend = req.body.friend;
            console.log(req.body);
            let Data = [];

            chapter = mongoose.Types.ObjectId(chapter);
            let user = mongoose.Types.ObjectId(friend);

            let answer = await Answer.find({ chapter, user })
                .populate({ path: 'chapter', select: 'chapter_no', model: Chapter })
                .populate({ path: 'answers.questionId', model: Question });
            // console.log(answer);
            let reflectionAnswer = await ReflectionAns.find({ user, chapter })
                .populate({ path: 'chapter', select: 'chapter_no', model: Chapter })
                .populate({ path: 'questionId', model: Question });

            if (answer.length > 0) {
                // Data.push({"chapter":answer[0].chapter})
                answer.forEach(i => {
                    let array = i.answers;
                    array.forEach(a => {
                        Data.push(a);
                    });
                });
            }
            if (reflectionAnswer.length > 0) {
                reflectionAnswer.forEach(i => {
                    Data.push(i);
                });
            }

            // console.log(detail)

            return res.send({
                success: 1,
                chapter: answer[0].chapter,
                data: Data,
                //data: { answer, reflectionAnswer },
                message: 'Chapter answer',
            });
        } catch (err) {
            console.log(err);
            return res.next(err);
        }
    }

    async shareListing(req, res, next) {
        try {
            if (req.user.isActive) {
                let shareList = await ShareChap.find({ senderId: req.user._id }).populate({
                    path: 'receiverId',
                    select: 'name email',
                    model: User,
                });
                console.log(shareList);
                res.send({
                    success: 1,
                    data: shareList,
                    message: 'Users with whom I have shared the chapter',
                });
            } else {
                return res.send({
                    success: 0,
                    chapter: a,
                });
            }
        } catch (err) {
            console.log(err);
            return res.next(err);
        }
    }

    async shareChPartner2(req, res, next) {
        let usr = req.user._id;
        let user_name = req.user.name;
        try {
            if (req.user.isActive) {
                let { chapterId, receiverId, questionId } = req.body;

                let data = await ShareChap.find({ chapter: chapterId, senderId: usr, receiverId: receiverId });
                // console.log('-------------------')
                // console.log(data)
                //     console.log('-------------------')
                if (data.length > 0) {
                    return res.send({
                        success: 0,
                        data: {},
                        message: 'User shared already',
                    });
                }
                let chapt = await ShareChap.findOne({
                    chapter: chapterId,
                    senderId: usr,
                    receiverId: receiverId,
                }).lean();
                let goal = await Goal.findOne({ user: req.user._id }).lean();
                if (chapt || goal) {
                    if (chapt) {
                        let share = new ShareChap({
                            senderId: usr,
                            receiverId: receiverId,
                            chapter: chapterId,
                        });
                        await share.save(async (err, result) => {
                            let title = `${req.user.name} has invited you to view answer of chapter`;
                            let notifi = new Notification({
                                senderId: req.user._id,
                                receiverId: chapt.receiverId,
                                title: title,
                                chapterId: chapterId,
                                goalId: null,
                                statusType: "chapter"
                            });

                            await notifi.save();
                        });

                        let notifiUser = await User.findOne({ _id: chapt.receiverId });
                        let deviceToken = notifiUser.deviceToken;
                        // console.log('-------notifi------')
                        // console.log(deviceToken)
                        // console.log('-------notifi------')
                        var message = {
                            "to": deviceToken,
    
                            "notification": {
                                "sound": "default",
                                "title": 'Share chapter',
                                //"type": "CONFIRM",
                                "body": `Your friend ${user_name} shared a chapter with you`,
                            },
                        };


                        fcm.send(message, function(err, response) {
                            if (err) {
                                console.log('Something has gone wrong!');
                            } else {
                                console.log('Successfully sent with response: ', response);
                            }
                        });

                        return res.send({
                            status: 1,
                            message: 'Share chapter with Partner succussfully !',
                        });
                    } else {
                        let share = new ShareChap({
                            senderId: usr,
                            receiverId: receiverId,
                            chapter: chapterId,
                        });
                        await share.save(async (err, result) => {
                            let title = `${req.user.name} has invited you to view answer of chapter`;
                            let notifi = new Notification({
                                senderId: req.user._id,
                                receiverId: goal.shareWith,
                                title: title,
                                chapterId: chapterId,
                                goalId: null,
                                statusType: "chapter"
                            });
                            await notifi.save();
                        });

                        let notifiUser = await User.findOne({ _id: receiverId });
                        let deviceToken = notifiUser.deviceToken;
                        // console.log('-------notifi------')
                        // console.log(deviceToken)
                        // console.log('-------notifi------')
                        var message = {
                            "to": deviceToken,
    
                            "notification": {
                                "sound": "default",
                                "title": 'Share chapter',
                                //"type": "CONFIRM",
                                "body": `Your friend ${user_name} shared a chapter with you`,
                            },
                        };

                        fcm.send(message, function(err, response) {
                            if (err) {
                                console.log('Something has gone wrong!');
                            } else {
                                console.log('Successfully sent with response: ', response);
                            }
                        });

                        return res.send({
                            status: 1,
                            message: 'Share chapter with Partner succussfully !',
                        });
                    }
                } else {
                    let share = new ShareChap({
                        senderId: usr,
                        receiverId: receiverId,
                        chapter: chapterId,
                    });
                    await share.save(async (err, result) => {
                        let title = `${req.user.name} has invited you to viwe answer of chapter`;
                        let notifi = new Notification({
                            senderId: req.user._id,
                            receiverId: receiverId,
                            title: title,
                            chapterId: chapterId,
                            goalId: null,
                            statusType: "chapter"
                        });
                        await notifi.save();
                    });

                    let notifiUser = await User.findOne({ _id: receiverId });
                    let deviceToken = notifiUser.deviceToken;
                    // console.log('-------notifi------')
                    // console.log(deviceToken)
                    // console.log('-------notifi------')
                    var message = {
                        "to": deviceToken,

                        "notification": {
                            "sound": "default",
                            "title": 'Share chapter',
                           // "type": "CONFIRM",
                            "body": `Your friend ${user_name} shared a chapter with you`,
                        },
                    };


                    fcm.send(message, function(err, response) {
                        if (err) {
                            console.log('Something has gone wrong!');
                        } else {
                            console.log('Successfully sent with response: ', response);
                        }
                    });

                    return res.send({
                        status: 1,
                        message: 'Share chapter with Partner succussfully !',
                    });
                }
            } else {
                return res.send({
                    success: 0,
                    isActive: req.user.isActive,
                    data: {},
                    message: 'Admin has yet to approve verification',
                });
            }
        } catch (err) {
            console.log(err);
            return res.next(err);
        }
    }

    async privacy_policyPage(req, res) {
        res.render('privacy');
    }
    async Aboutus(req, res) {
        res.render('about_us' );
    }
    async termsAndconditionPage(req, res) {
        res.render('terms_conditions');
    }

    async Support(req, res) {
        res.render('support');
    }

    async html_page(req, res) {
        console.log('----------------------------888')
        const slug = req.params.slug;
        const p = await Static.findOne({ slug:slug});
        res.setHeader('Access-Control-Allow-Origin', '*');
        return res.send(p) ;
    }
}

module.exports = new UserController();
