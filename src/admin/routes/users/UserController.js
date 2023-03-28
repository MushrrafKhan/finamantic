const {
    models: {User,Goal,Category}
} = require('../../../../lib/models');
const {showDate, uploadImageLocal} = require('../../../../lib/util');
bcrypt = require('bcrypt');
const saltRounds = parseInt(process.env.BCRYPT_ITERATIONS, 10) || 10;
const fs = require('fs');
const multiparty = require('multiparty');



class UserController {
    async listPage(req, res) {
        return res.render('users/list');
    }
    async list(req, res) {
        
        let reqData = req.query;
        let columnNo = parseInt(reqData.order[0].column);
        let sortOrder = reqData.order[0].dir === 'desc' ? -1 : 1;
        let query = {
            email:{$ne:null},
            //isDeleted: false,
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

            query.$or = [
                {name: searchValue},
                {email: searchValue},
                {countryCode: searchValue},
                {mobile: searchValue},
            ];
        }
        let sortCond = {created: sortOrder};
        let response = {};
        switch (columnNo) {
        case 1:
            sortCond = {
                name: sortOrder,
            };
            break;
        case 2:
            sortCond = {
                isSuspended: sortOrder,
            };
            break;
        default:
            sortCond = {created: sortOrder};
            break;
        }

        const count = await User.countDocuments(query);
        response.draw = 0;
        if (reqData.draw) {
            response.draw = parseInt(reqData.draw) + 1;
        }
        response.recordsTotal = count;
        response.recordsFiltered = count;
        let skip = parseInt(reqData.start);
        let limit = parseInt(reqData.length);
        let users = await User.find(query)
            .sort(sortCond)
            .skip(skip)
            .limit(limit);
        if (users) {
            users = users.map(user => {
                let actions = '';
                actions = `${actions}<a href="/users/view/${user._id}" title="view"><i class="fas fa-eye"></i></a>`;
                actions = `${actions}<a href="/users/user-goals/${user._id}" title="User Goals"><i class="fas fa-flag"></i></a>`;
                if (user.isActive) {
                    actions = `${actions}<a class="statusChange" href="/users/update-status?id=${user._id}&status=false&" title=" Click for user Activate"><i class="fa fa-check"></i>  </a>`;
                } else {
                    actions = `${actions}<a class="statusChange" href="/users/update-status?id=${user._id}&status=true&" title="Click for user Deactivate">  <i class="fa fa-ban"></i></a>`;
                }
                if (user.isDeleted) {
                    actions = `${actions}<a class="deleteItem" href="/users/delete-restore/${user._id}" title="Click for user Restore"> <i class="fas fa-trash-restore"></i> </a>`;
                }else {
                    actions = `${actions}<a class="deleteItem" href="/users/delete/${user._id}" title="Click for user Delete"> <i class="fas fa-trash"></i> </a>`;

                }

                return {
                    0: (skip += 1),
                    1: `${user.name}`,
                    2: user.email,
                    3: user.isActive ? '<span class="badge label-table badge-success">Active</span>'  :'<span class="badge label-table badge-danger">In-Active</span>',
                    4: user.isDeleted ? '<span class="badge label-table badge-secondary">Yes</span>' : '<span class="badge label-table badge-success">No</span>',
                    5: actions,
                };
            });
        }
        response.data = users;
        return res.send(response);
    }
    async addUserPage(req, res) {
        return res.render("users/add");
    }
    async addUserSave(req,res, next) {
        const exist = await User.find({email:req.body.email})
        console.log(exist);

        if(exist.length>0){
            req.flash('error', "User already exist");
            return res.redirect('/users/add'); 
        }
        else{
            
        let data = req.body;
        let user = {};
        user.firstname = data.firstname;
        user.lastname = data.lastname;
        user.email = data.email;
        user.password = await bcrypt.hash(data.password, saltRounds);
        user.mobile = data.mobile;
        user.radius = data.radius
        user.predetermine = data.predetermine;
        user.emailVerify = false;
        let saveuser = new User(user);
        await saveuser.save();
        req.flash('success', req.__('USER_ADD_SUCCESS'));
            return res.redirect('/users');
        }
    }
    async editUserPage(req, res) {
        let id = req.params.id;

        let user = await User.findOne({_id:id})
        .lean();
        if (!user) {
            req.flash('error', req.__('USER_NOT_EXISTS'));
            return res.redirect('/users');
        }
        return res.render("users/edit", {user});
    }
    async editSave(req, res, next){
        var id = req.params.id;
        let data = req.body;
        let user = await User.findOne({_id:id});
        if (!user) {
            req.flash('error', req.__('USER_NOT_EXISTS'));
            return res.redirect('/users');
        }
        user.firstname = data.name;
        user.email = data.email;
        user.mobile = data.mobile;
        user.radius = data.radius
        await user.save();
        req.flash('success', id ? req.__('USER_UPDATED_SUCCESS') : req.__('USER_UPDATED_SUCCESS'));
        return res.redirect('/users');
    }
    async view(req, res) {
        let user = await User.findOne({
            _id: req.params.id,
            isDeleted: false
        }).lean();
        let img=`${process.env.AWS_BASE_URL}`;
        if (!user) {
            req.flash('error', req.__('USER_NOT_EXISTS'));
            return res.redirect('/users');
        }

        return res.render('users/view', {
            user,
            img
            
        });
    }
    async updateStatus(req, res) {
        const {id, status} = req.query;
        let user = await User.findOne({
            _id: id,
            isDeleted: false
        });

        if (!user) {
            req.flash('error', req.__('USER_NOT_EXISTS'));
            return res.redirect('/users');
        }
        if(status == true){
            user.isActive = status;
            await user.save();
            req.flash('success', req.__('User is activate'));
        }else{
            user.isActive = status;
            await user.save();
            req.flash('success', req.__('User is deactivated'));
        }
        return res.redirect('/users');
    }
    async uploadProfilePic(req, res){
        
        let userId = req.params.id;
        let form = new multiparty.Form();
        
        form.parse(req, async function(err, fields, file) {
            
            let fileName = file['file'][0].originalFilename;

            let extension = fileName.substr( (fileName.lastIndexOf('.') +1) );
            fileName = userId + '.' + extension;

            let tmp_path = file['file'][0].path;
            let target_path = `${process.env.UPLOAD_IMAGE_PATH}` + 'users/' + fileName;
            try{
                
                let image = await uploadImageLocal(tmp_path,target_path,fileName);
                
                let user = await User.findOne({
                    _id: userId,
                    isDeleted: false
                });
                user.avatar = fileName;
                await user.save();
                req.flash('success', "Profile image successfully uploaded!");
                return res.success({'status':'success','image':image});

            }catch( err ){
                return res.success({'status':'fail'});
            }
          
          }); 
        
    }
    async delete(req, res) {
        const user = await User.findOne({
            _id: req.params.id,
            isDeleted: false
        });

        if (!user) {
            req.flash('error', req.__('USER_NOT_EXISTS'));
            return res.redirect('/users');
        }

        user.isDeleted = true;
        await user.save();

        // let ratings = await Rating.find({userId:req.params.id});
        // if(ratings.length > 0) {
        //     ratings.forEach(async (item)=>{
        //         let res = await Rating.findOneAndUpdate({ _id:item._id},{isDeleted:true});
        //     })
        // }

        req.flash('success', req.__('USER_DELETE_SUCCESS'));
        return res.redirect('/users');
    }
    async deleteRestore(req, res) {
        const user = await User.findOne({
            _id: req.params.id,
            isDeleted: true
        });

        if (!user) {
            req.flash('error', req.__('USER_NOT_EXISTS'));
            return res.redirect('/users');
        }
        user.isDeleted = false;
        await user.save();

        req.flash('success', req.__('User has been restored successfully'));
        return res.redirect('/users');
    }
    async isEmailExists(req, res) {
        const { email } = req.body;

        const count = await User.countDocuments({email: email});

        return res.success(count);
    }
    async userGoals(req,res){
        let user =req.params.id;  
        let userInfo  =  await User.findOne({_id:user}).select('name -_id');
        let goallist =await Goal.find({user:user}).populate({path:'category',select:'name',model:Category}).lean();
       let count=goallist.length;
        return res.render('users/goal', {
            userInfo,
            goallist,
            count

        });
    }
    async goalDetails(req,res){
        try{
            let goalId=req.params.id;
            let goalDetails = await Goal.findOne({_id:goalId})
            .populate({path:'user',select:'name',model:User})
            .populate({path:'category',select:'name',model:Category});
                let shareWith = await User.find({_id: {$in : goalDetails.shareWith}}).select('name image')
                
            console.log(goalDetails);
            let img=`${process.env.AWS_BASE_URL}`;
            return res.render('users/goal-details',{
                goalDetails,
                img,
                shareWith
            })
        }catch(err){
            console.log(err);
        }
    }
}

module.exports = new UserController();