const {
    models: { User, Route, AdminSettings, Payment, Premium },
} = require('../../../../lib/models');
const _ = require('lodash');
const { uploadImage, generateResetToken } = require('../../../../lib/util');
const multiparty = require('multiparty');
var url = require('url');
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

class PaymentController {
    async listPage(req, res) {
        return res.render('payments/list');
    }
    async list(req, res) {
        let reqData = req.query;
        let columnNo = parseInt(reqData.order[0].column);
        let sortOrder = reqData.order[0].dir === 'desc' ? -1 : 1;
        let query = {
            isDeleted: false,
        };
        if (reqData.search.value) {
            const searchValue = new RegExp(
                reqData.search.value
                    .split(' ')
                    .filter(val => val)
                    .map(value => value.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'))
                    .join('|'),
                'i'
            );
            query.$or = [{ name: searchValue }, { email: searchValue }];
        }
        let sortCond = { created: sortOrder };
        let response = {};
        switch (columnNo) {
            case 1:
                sortCond = {
                    name: sortOrder,
                };
                break;
            case 5:
                sortCond = {
                    isSuspended: sortOrder,
                };
                break;
            default:
                sortCond = { created: sortOrder };
                break;
        }
        const count = await Payment.countDocuments(query);
        response.draw = 0;
        if (reqData.draw) {
            response.draw = parseInt(reqData.draw) + 1;
        }
        response.recordsTotal = count;
        response.recordsFiltered = count;
        let skip = parseInt(reqData.start);
        let limit = parseInt(reqData.length);
        let payments = await Payment.find();
        console.log(payments);
        let users = await Payment.find(query)
            .populate({ path: 'parent_id', model: 'User' })
            .sort(sortCond)
            .skip(skip)
            .limit(limit);
        console.log(users);
        if (users) {
            users = users.map(user => {
                let actions = '';
                let img = process.env.AWS_BASE_URL;
                actions = `${actions}<a href="/payments/view/${user._id}" title="view payments details"> <i class="fas fa-eye"></i></a> `;
                return {
                    0: (skip += 1),
                    1: user.parent_id.first_name,
                    2: user.paymentStatus
                        ? '<span class="badge label-table badge-success ">Paid</span>'
                        : '<span class="badge label-table badge-warning ">Pending</span>',
                    3: actions,
                };
            });
        }
        response.data = users;
        return res.send(response);
    }
    async add(req, res) {
        let setting = await Premium.findOne({ device_type: 'ios' });
        return res.render('payments/apple-add', { setting });
    }
    async androidAdd(req, res) {
        let setting = await Premium.findOne({ device_type: 'android' });
        console.log('--------android------', setting)
        return res.render('payments/android-add', { setting });
    }
    async saveAdd(req, res) {
        const { subscription_id, subscription_name, subscription_amount, device_type, features, duration } = req.body;
        let prim = await Premium.findOne({}).where({ device_type: 'ios' });
        prim.subscription_id = subscription_id;
        prim.subscription_name = subscription_name;
        prim.subscription_amount = subscription_amount;
        prim.device_type = device_type;
        prim.features = features.trim();
        prim.duration = duration;
        await prim.save();
        req.flash('success', req.__('Subscription Amount is updated'));
        return res.redirect('/payments/subscription');
    }
    async saveandroidAdd(req, res) {
        const { subscription_id, subscription_name, subscription_amount, device_type, features, duration } = req.body;
        let prim = await Premium.findOne({}).where({ device_type: 'android' });
        prim.subscription_id = subscription_id;
        prim.subscription_name = subscription_name;
        prim.subscription_amount = subscription_amount;
        prim.device_type = device_type;
        prim.features = features.trim();
        prim.duration = duration;
        await prim.save();
        req.flash('success', req.__('Subscription Amount is updated'));
        return res.redirect('/payments/android-subscription');
    }
    async view(req, res) {
        let id = req.params.id;
        let payments = await Payment.findOne({ _id: id }).populate({ path: 'parent_id', model: 'User' });
        let img = process.env.AWS_BASE_URL;
         return res.render('payments/view', {
            payments,
            img,
        });
    }
}
module.exports = new PaymentController();
