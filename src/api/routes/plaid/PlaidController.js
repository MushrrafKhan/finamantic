const {
    models: { User, Friend, Review, Category, Master, Question, Match,Chat, Message, AdminSetting, Notification,Favorite,Tag },
} = require('../../../../lib/models');
const moment = require('moment');
const { showDate, uploadImageLocal, uploadImage } = require('../../../../lib/util');
const fs = require('fs');
const multiparty = require('multiparty');
var FCM = require('fcm-node');
const async = require('async');
var mongoose = require('mongoose');

const { Configuration, PlaidApi, PlaidEnvironments } = require('plaid');

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
const prettyPrintResponse = res => {
    console.log('prettyPrintResponse---------------------------');
    console.log(util.inspect(res.data, { colors: true, depth: 4 }));
};
const authorizeAndCreateTransfer = async accessToken => {
    // We call /accounts/get to obtain first account_id - in production,
    // account_id's should be persisted in a data store and retrieved
    // from there.
    // console.log(accessToken);
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


class PlaidController {


  async Plaid_info(req, res, next) {
      console.log("Plaid_info =========================")
      // console.log(ITEM_ID + "ITEM_ID =========================")
      // console.log(ACCESS_TOKEN + "ACCESS_TOKEN =========================")
      // console.log(PLAID_PRODUCTS + "PLAID_PRODUCTS =========================")
      try{
          res.json({
              item_id: ITEM_ID,
              access_token: ACCESS_TOKEN,
              products: PLAID_PRODUCTS,
            });
      }catch(err){
          console.log(err)
      }
  }

  async Link_Token(req, res, next) {
    console.log("Link_Token =========================")
      try{
        let {client_id, secret, client_name, country_codes, language, client_user_id, products} = req.body
          Promise.resolve()
          .then(async function () {
            const configs = {
              user: {
                // This should correspond to a unique id for the current user.
                client_user_id: 'user-id',
              },
              client_name: client_name,
              products: products,
              country_codes: country_codes,
              language: language,
            };
      
            if (PLAID_REDIRECT_URI !== '') {
              configs.redirect_uri = PLAID_REDIRECT_URI;
            }
      
            if (PLAID_ANDROID_PACKAGE_NAME !== '') {
              configs.android_package_name = PLAID_ANDROID_PACKAGE_NAME;
            }
            const createTokenResponse = await client.linkTokenCreate(configs);
            console.log(createTokenResponse.data)
           // prettyPrintResponse(createTokenResponse);
           return res.send(createTokenResponse.data);
          })
          .catch(next);
      }catch(err){
          console.log(err)
      }
  }

  async set_access_token(req, res, next) {
    try{
      console.log("set_access_token =========================")
      let user = req.user;
      let _id = user._id
      let userData = await User.findOne({ _id });
      if(!userData){
        console.log('usernot found')
        return res.send('user not found')
      }
      
      let public_token = req.body.public_token;

        const tokenResponse = await client.itemPublicTokenExchange({
          public_token: public_token,
        });
        // prettyPrintResponse(tokenResponse);
        console.log(tokenResponse.data.access_token)
        ACCESS_TOKEN = tokenResponse.data.access_token;
        ITEM_ID = tokenResponse.data.item_id;
        if (PLAID_PRODUCTS.includes('transfer')) {
          TRANSFER_ID = await authorizeAndCreateTransfer(ACCESS_TOKEN);
        }
          userData.accessToken = ACCESS_TOKEN;
          userData.itemId = ITEM_ID;
          userData.bankVerify = true;
          await userData.save();
        return res.send({
          access_token: ACCESS_TOKEN,
          item_id: ITEM_ID,
          error: null,
        });

    


    } catch(err){
      console.log(err);
      return res.next(err);
    }
  }

  async auth(req, res, next){
    console.log("auth =================")
    let { access_token } = req.query
    Promise.resolve()
      .then(async function () {
        const authResponse = await client.authGet({
          access_token: access_token,
        });
        // prettyPrintResponse(authResponse);
        // res.json(authResponse.data);
        // return res.send(authResponse.data);
        return res.send({
          success: 1,
          data: authResponse.data,
          message: 'Auth data get successfully',
      });

      })
      .catch(next);
  }

  async transactions(req, res, next) {
    console.log("transactions =================")
    let { access_token } = req.query
    Promise.resolve()
      .then(async function () {
        // Pull transactions for the Item for the last 30 days
        const startDate = moment().subtract(30, 'days').format('YYYY-MM-DD');
        const endDate = moment().format('YYYY-MM-DD');
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
        // prettyPrintResponse(transactionsResponse);
        // res.json(transactionsResponse.data);
        // return res.send(transactionsResponse.data);
        return res.send({
          success: 1,
          data: transactionsResponse.data,
          message: 'Transactions data get successfully',
      });

      })
      .catch(next);
  };
  
  async identity(req, res, next) {
    console.log("identity =========================")
    let { access_token } = req.query
    Promise.resolve()
      .then(async function () {
        const identityResponse = await client.identityGet({
          access_token: access_token,
        });
        // prettyPrintResponse(identityResponse);
        // res.json({ identity: identityResponse.data.accounts });
        return res.send({
          success: 1,
          data: identityResponse.data.accounts,
          message: 'Identity data get successfully',
      });
      })
      .catch(next);
  };

  async balance(req, res, next) {
    console.log("balance ========================")
    let { access_token } = req.query
    Promise.resolve()
      .then(async function () {
        const balanceResponse = await client.accountsBalanceGet({
          access_token: access_token,
        });
        // prettyPrintResponse(balanceResponse);
        // res.json(balanceResponse.data);
        // return res.send(balanceResponse.data);
        return res.send({
          success: 1,
          data: balanceResponse.data,
          message: 'Balance data get successfully',
      });

      })
      .catch(next);
  };

  async item(req, res, next) {
    console.log("item =================")
    let { access_token } = req.query
    Promise.resolve()
      .then(async function () {
        // Pull the Item - this includes information about available products,
        // billed products, webhook information, and more.
        const itemResponse = await client.itemGet({
          access_token: access_token,
        });
        // Also pull information about the institution
        const configs = {
          institution_id: itemResponse.data.item.institution_id,
          country_codes: ['US'],
        };
        const instResponse = await client.institutionsGetById(configs);
        // prettyPrintResponse(itemResponse);
        // res.json({
        //   item: itemResponse.data.item,
        //   institution: instResponse.data.institution,
        // });
        return res.send({
          success: 1,
          data: {
            item: itemResponse.data.item,
            institution: instResponse.data.institution
          },
          message: 'Item data get successfully',
      });

      })
      .catch(next);
  };

  async accounts (req, res, next) {
    console.log("account =================")
    let { access_token } = req.query
    Promise.resolve()
      .then(async function () {
        const accountsResponse = await client.accountsGet({
          access_token: access_token,
        });
        // prettyPrintResponse(accountsResponse);
        // res.json(accountsResponse.data);
        // return res.send(accountsResponse.data);
        return res.send({
          success: 1,
          data: accountsResponse.data,
          message: 'Account data get successfully',
      });

      })
      .catch(next);
  };
 
}


module.exports = new PlaidController();
