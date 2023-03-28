const {
    models: { Chapter },
} = require('../../../../lib/models');
const { showDate } = require('../../../../lib/util');
const multiparty = require('multiparty');


class ChapterController {

    async listPage(req, res) {
        return res.render('chapters/list');
    }
    async list(req, res) {
        let reqData = req.query;
        let columnNo = parseInt(reqData.order[0].column);
        let sortOrder = reqData.order[0].dir === 'desc' ? -1 : 1;
        let query = {
            // isDeleted: false,
            path: null,
            parentId: null
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
                { title: searchValue },
                { chapter_no: searchValue }

            ];
        }
        let sortCond = { created: sortOrder };
        let response = {};
        switch (columnNo) {
            case 1:
                sortCond = {
                    title: sortOrder,
                    chapter_no:sortOrder,
                };
                break;
            case 4:
                sortCond = {
                    isActive: sortOrder,
                };
                break;
            default:
                sortCond = { created: sortOrder };
                break;
        }
        const count = await Chapter.countDocuments(query);
        response.draw = 0;
        if (reqData.draw) {
            response.draw = parseInt(reqData.draw) + 1;
        }
        response.recordsTotal = count;
        response.recordsFiltered = count;
        let skip = parseInt(reqData.start);
        let limit = parseInt(reqData.length);
        let chapters = await Chapter.find(query)
            .sort(sortCond)
            .skip(skip)
            .limit(limit);
        if (chapters) {
            let i=1;
            chapters = chapters.map(chapter => {
                let actions = '';
                actions = `${actions}<a href="/chapters/view/${chapter._id}" title="view"><i class="fas fa-eye"></i></a>`;
                actions = `${actions}<a href="/chapters/edit/${chapter._id}" title="Edit"> <i class="fas fa-edit"></i> </a>`;
                    if (chapter.isActive) {
                        actions = `${actions}<a class="statusChange" href="/chapters/update-status?id=${chapter._id}&status=false&" title="Activate"> <i class="fa fa-check"></i> </a>`;
                       } else {
                       actions = `${actions}<a class="statusChange" href="/chapters/update-status?id=${chapter._id}&status=true&" title="Inactivate"> <i class="fa fa-ban"></i> </a>`;
                   }
                if (chapter.isDeleted) {
                    actions = `${actions}<a class="deleteItem" href="/chapters/delete-chapter/${chapter._id}" title="Restore"> <i class="fas fa-trash-restore"></i> </a>`;
                } else {
                    actions = `${actions}<a class="deleteItem" href="/chapters/delete/${chapter._id}" title="Delete"> <i class="fas fa-trash"></i> </a>`;
                }
                return {
                    0: `${i++} .`,
                    1: chapter.chapter_no,
                    2: chapter.title,
                    3:chapter.isActive ? '<span class="badge label-table badge-success">Active</span>' : '<span class="badge label-table badge-danger">In-Active</span>',
                    4:chapter.isDeleted ? '<span class="badge label-table badge-danger">Yes</span>' : '<span class="badge label-table badge-success">No</span>',
                    5: actions,
                };
            });
        }
        response.data = chapters;
        return res.send(response);
    }
    async addPage(req, res) {
        return res.render('chapters/add');
    }
    async add(req, res) {
      let {chapter_no,title,description} = req.body;
        let saveChapter = new Chapter({
            chapter_no,
            title,
            description
        });
        await saveChapter.save();
        req.flash('success', req.__('Chapter added sucussfully !'));
        return res.redirect('/chapters');
    }
    async view(req, res) {
        let chapter = await Chapter.findOne({
            _id: req.params.id
        });
        if (!chapter) {
            req.flash('error', req.__('Chapter is not found  !'));
            return res.redirect('/chapters');
        }
        return res.render('chapters/view', {
            chapter
        });
    }
    async editPage(req, res) {
        let _id = req.params._id;
        let chapter = await Chapter.findOne({_id,isDeleted: false})
        .lean();
        if (!chapter) {
            req.flash('error', req.__('Chapter does not  exist !'));
            return res.redirect('/chapters');
        }
        return res.render('chapters/edit', { chapter,_id });
    }
    async edit( req,res ){
        var _id = req.params._id;
        let chapter = await Chapter.findOne({_id, isDeleted: false});
        if (!chapter) {
            req.flash('error', req.__('Chapter not exist !'));
            return res.redirect('/chapters');
        }
        chapter.chapter_no = req.body.chapter_no;
        chapter.title=req.body.title;
        chapter.description = req.body.description;
        await chapter.save();
        req.flash('success',  req.__("Chapter updated succussfully !"));
        return res.redirect('/chapters');
    }
    async updateStatus(req, res) {
        const { id, status } = req.query;
        let chapter = await Chapter.findOne({
            _id: id,
        });

        if (!chapter) {
            req.flash('error', req.__('Chapter not found !'));
            return res.render('/chapters');
        }
        chapter.isActive = status;
        await chapter.save((err,result)=>{
            if(result){
                req.flash('success', req.__("Chapter status updated successfully !"));
                return res.redirect('/chapters');
            }else{
                req.flash('error', req.__("Something  went wrong !"));
                return res.redirect('/chapters');
            }
        });
        
    }
    async delete(req, res) {
        const chapter = await Chapter.findOne({
            _id: req.params.id,
            isDeleted: false
        });

        if (!chapter) {
            req.flash('error', req.__('Chapter not Found !'));
            return res.redirect('/chapters');
        }

        chapter.isDeleted = true;
        await chapter.save();

        req.flash('success', "Chapter has been deleted successfully");
        return res.redirect(chapter.path === null ? '/chapters' : req.headers.referer);
    }
    async chapterRestore(req, res) {
        const chapter = await Chapter.findOne({
            _id: req.params.id,
            isDeleted: true
        });
        if (!chapter) {
            req.flash('error', "Chapter not found !!");
            return res.redirect('/chapters');
        }
        chapter.isDeleted = false;
        await chapter.save();
        req.flash('success', "Chapter has been restored successfully");
        return res.redirect('/chapters');
    }
}

module.exports = new ChapterController;
