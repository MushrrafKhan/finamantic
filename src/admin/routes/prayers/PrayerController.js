const {
    models: {User,Goal,Chapter,Prayer}
} = require('../../../../lib/models');
const {showDate, uploadImageLocal} = require('../../../../lib/util');
bcrypt = require('bcrypt');
const saltRounds = parseInt(process.env.BCRYPT_ITERATIONS, 10) || 10;
const fs = require('fs');
const multiparty = require('multiparty');



class PrayerController {
    async listPage(req, res) {
        return res.render('prayers/list');
    }
    async list(req, res) { 
        let reqData = req.query;
        let columnNo = parseInt(reqData.order[0].column);
        let sortOrder = reqData.order[0].dir === 'desc' ? -1 : 1;
        let query = {
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
                {chapter_no: searchValue},
              
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
                isActive: sortOrder,
            };
            break;
        default:
            sortCond = {created: sortOrder};
            break;
        }
        let arr = []
        let chapters = await Chapter.find(query)
        chapters.map(x=>{
            arr.push(x._id)
        })
        const count = await Prayer.countDocuments({chapter:{$in:arr}});
        response.draw = 0;
        if (reqData.draw) {
            response.draw = parseInt(reqData.draw) + 1;
        }
        response.recordsTotal = count;
        response.recordsFiltered = count;
        let skip = parseInt(reqData.start);
        let limit = parseInt(reqData.length);
        let prayers = await Prayer.find({chapter:{$in:arr}})
        .populate({path:'chapter',select:'chapter_no',model:Chapter})
            .sort(sortCond)
            .skip(skip)
            .limit(limit);
        if (prayers) {
            prayers = prayers.map(prayer => {
                let actions = '';
                actions = `${actions}<a href="/prayers/view/${prayer._id}" title="view"><i class="fas fa-eye"></i></a>`;
                actions = `${actions}<a href="/prayers/edit/${prayer._id}" title="view"><i class="fas fa-edit"></i></a>`;
                if (prayer.isActive) {
                    actions = `${actions}<a class="statusChange" href="/prayers/update-status?id=${prayer._id}&status=false&" title=" Click for user Activate"><i class="fa fa-check"></i>  </a>`;
                } else {
                    actions = `${actions}<a class="statusChange" href="/prayers/update-status?id=${prayer._id}&status=true&" title="Click for user Deactivate">  <i class="fa fa-ban"></i></a>`;
                }
                if (prayer.isDeleted) {
                    actions = `${actions}<a class="deleteItem" href="/prayers/delete-restore/${prayer._id}" title="Click for user Restore"> <i class="fas fa-trash-restore"></i> </a>`;
                }else {
                    actions = `${actions}<a class="deleteItem" href="/prayers/delete/${prayer._id}" title="Click for user Delete"> <i class="fas fa-trash"></i> </a>`;

                }
                return {
                    0: (skip += 1),
                    1: ` Chapter ${prayer.chapter.chapter_no}`,
                    2: prayer.isActive ? '<span class="badge label-table badge-success">Active</span>'  :'<span class="badge label-table badge-danger">In-Active</span>',
                    3: prayer.isDeleted ? '<span class="badge label-table badge-danger">Yes</span>' : '<span class="badge label-table badge-success">No</span>',
                    4: actions,
                };
            });
        }
        response.data = prayers;
        return res.send(response);
    }
    async addPrayerPage(req, res) {
        let chapters = await Chapter.find({}).select('chapter_no ');
        return res.render("prayers/add",{
            chapters
        });
    }
    async addPrayerSave(req,res) {
        let {chapter,description} = req.body;
        console.log(req.body)
        let prayers = new Prayer({
            chapter,
            description
        });
        await prayers.save();
        req.flash('success',req.__("Prayer added succussfully !"));
        return res.redirect('/prayers');
    }
    async editPrayerPage(req, res) {
        let id = req.params.id;
        let chapters = await Chapter.find({}).select('chapter_no ');
        let prayers = await Prayer.findOne({_id:id})
        .lean();
        if (!prayers) {
            req.flash('error', req.__('Prayer does not exist !'));
            return res.redirect('/prayers');
        }
        return res.render("prayers/edit", {
            prayers,
            chapters

        });
    }
    async editSave(req, res, next){
        var id = req.params.id;
        let {chapter,description}  = req.body;
        let prayer = await Prayer.findOne({_id:id});
        if (!prayer) {
            req.flash('error', req.__('Prayer not found !'));
            return res.redirect('/prayers');
        }
        prayer.chapter = chapter;
        prayer.description = description;
        await prayer.save();
        req.flash('success', req.__('Prayer update succussfully !'));
        return res.redirect('/prayers');
    }
    async view(req, res) {
        let prayer = await Prayer.findOne({_id: req.params.id,isDeleted: false})
        .populate({path:"chapter",select :"",model:Chapter})
        .lean();
        let img=`${process.env.AWS_BASE_URL}`;
        if (!prayer) {
            req.flash('error', req.__('Prayer not found !'));
            return res.redirect('/prayers');
        }
        return res.render('prayers/view', {
            prayer,
            img
            
        });
    }
    async updateStatus(req, res) {
        const {id, status} = req.query;
        let prayer = await Prayer.findOne({
            _id: id,
            isDeleted: false
        });
        if (!prayer) {
            req.flash('error', req.__('Prayer not found !'));
            return res.redirect('/prayers');
        }
        prayer.isActive = status;
        await prayer.save();
        req.flash('success', req.__('Prayer status updated !'));
        return res.redirect('/prayers');
    }
    async delete(req, res) {
        const prayer = await Prayer.findOne({
            _id: req.params.id,
            isDeleted: false
        });
        if (!prayer) {
            req.flash('error', req.__('Prayer not found  !'));
            return res.redirect('/prayers');
        }
        prayer.isDeleted = true;
        await prayer.save();
        req.flash('success', req.__('Prayer is deleted !'));
        return res.redirect('/prayers');
    }
    async deleteRestore(req, res) {
        const prayer = await Prayer.findOne({
            _id: req.params.id,
            isDeleted: true
        });

        if (!prayer) {
            req.flash('error', req.__('Prayer not found'));
            return res.redirect('/prayers');
        }
        prayer.isDeleted = false;
        await prayer.save();

        req.flash('success', req.__('Prayer restore succussfully !'));
        return res.redirect('/prayers');
    }
}

module.exports = new PrayerController();