const {
    models: {User,Goal,Chapter,Prayer,Question}
} = require('../../../../lib/models');
const {showDate, uploadImageLocal} = require('../../../../lib/util');
bcrypt = require('bcrypt');
const saltRounds = parseInt(process.env.BCRYPT_ITERATIONS, 10) || 10;
const fs = require('fs');
const multiparty = require('multiparty');



class QuestionController {
    async listPage(req, res) {
        return res.render('questions/list');
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
                {chapter: searchValue},
              
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

        const count = await Question.countDocuments(query);
        response.draw = 0;
        if (reqData.draw) {
            response.draw = parseInt(reqData.draw) + 1;
        }
        response.recordsTotal = count;
        response.recordsFiltered = count;
        let skip = parseInt(reqData.start);
        let limit = parseInt(reqData.length);
        let questions = await Question.find(query)
        .populate({path:'chapter',select:'chapter_no',model:Chapter})
            .sort(sortCond)
            .skip(skip)
            .limit(limit);
        if (questions) {
            questions = questions.map(question => {
                let types='';
                if(question.questionType == "optional"){
                    types="Multiple Choice" ;
                   }else  if(question.questionType == "description"){ 
                      types= "Descriptive";
                    }
                let actions = '';
                actions = `${actions}<a href="/questions/view/${question._id}" title="view"><i class="fas fa-eye"></i></a>`;
                actions = `${actions}<a href="/questions/edit/${question._id}" title="view"><i class="fas fa-edit"></i></a>`;
                if (question.isActive) {
                    actions = `${actions}<a class="statusChange" href="/questions/update-status?id=${question._id}&status=false&" title=" Click for user Activate"><i class="fa fa-check"></i>  </a>`;
                } else {
                    actions = `${actions}<a class="statusChange" href="/questions/update-status?id=${question._id}&status=true&" title="Click for user Deactivate">  <i class="fa fa-ban"></i></a>`;
                }
                if (question.isDeleted) {
                    actions = `${actions}<a class="deleteItem" href="/questions/delete-restore/${question._id}" title="Click for user Restore"> <i class="fas fa-trash-restore"></i> </a>`;
                }else {
                    actions = `${actions}<a class="deleteItem" href="/questions/delete/${question._id}" title="Click for user Delete"> <i class="fas fa-trash"></i> </a>`;

                }
                return {
                    0: (skip += 1),
                    1: ` Chapter ${question.chapter.chapter_no}`,
                    2: question.title,
                    3: types,
                    4: question.isActive
                        ? '<span class="badge label-table badge-success">Active</span>'
                        : '<span class="badge label-table badge-danger">In-Active</span>',
                    5: question.isDeleted
                        ? '<span class="badge label-table badge-danger">Yes</span>'
                        : '<span class="badge label-table badge-success">No</span>',
                    6: actions,
                };
            });
        }
        response.data = questions;
        return res.send(response);
    }
    async addQuestionPage(req, res) {
        let chapters = await Chapter.find({}).select('chapter_no ');
        return res.render("questions/add",{
            chapters
        });
    }
    async addQuestionSave(req,res) {
        let {chapter,title,questionType} = req.body;
        let question = new Question({
            chapter,
            questionType,
            title
        });

        await question.save();
        req.flash('success',req.__("Question added succussfully !"));
        return res.redirect('/questions');
    }
    async editQuestionPage(req, res) {
        let id = req.params.id;
        let chapters = await Chapter.find({}).select('chapter_no ');
        let question = await Question.findOne({_id:id})
        .lean();
        if (!question) {
            req.flash('error', req.__('Question does not exist !'));
            return res.redirect('/questions');
        }
        return res.render("questions/edit", {
            question,
            chapters
        });
    }
    async editSave(req, res, next){
        var id = req.params.id;
        let {chapter,title,questionType} = req.body;
        let question = await Question.findOne({_id:id});
        if (!question) {
            req.flash('error', req.__('Question not found !'));
            return res.redirect('/questions');
        }
        question.chapter = chapter;
        question.title = title;
        question.questionType = questionType;
        await question.save();
        req.flash('success', req.__('Question update succussfully !'));
        return res.redirect('/questions');
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
        let questions = await Question.findOne({
            _id: id,
            isDeleted: false
        });
        if (!questions) {
            req.flash('error', req.__('Question does not  exist !'));
            return res.redirect('/questions');
        }
        questions.isActive = status;
        await questions.save();
        req.flash('success', req.__('Question status updated !'));
        return res.redirect('/questions');
    }
    async delete(req, res) {
        const question = await Question.findOne({
            _id: req.params.id,
            isDeleted: false
        });
        if (!question) {
            req.flash('error', req.__('Question not found  !'));
            return res.redirect('/questions');
        }
        question.isDeleted = true;
        await question.save();
        req.flash('success', req.__('Question is deleted !'));
        return res.redirect('/questions');
    }
    async deleteRestore(req, res) {
        const question = await Question.findOne({
            _id: req.params.id,
            isDeleted: true
        });
        if (!question) {
            req.flash('error', req.__('Question not found'));
            return res.redirect('/questions');
        }
        question.isDeleted = false;
        await question.save();
        req.flash('success', req.__('Question restore succussfully !'));
        return res.redirect('/questions');
    }
}

module.exports = new QuestionController();