const {
    models: { Category, Food },
} = require('../../../../lib/models');
const { showDate } = require('../../../../lib/util');
const multiparty = require('multiparty');
const {uploadImageLocal, uploadImage } = require('../../../../lib/util');



class CategoryController {

    async listPage(req, res) {
        return res.render('categories/list');
    }

    async list(req, res) {

        let reqData = req.query;
        let columnNo = parseInt(reqData.order[0].column);
        let sortOrder = reqData.order[0].dir === 'desc' ? -1 : 1;
        let query = {
            //isDeleted: false,
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
                { name: searchValue }
            ];
        }
        let sortCond = { created: sortOrder };
        let response = {};
        switch (columnNo) {
            case 1:
                sortCond = {
                    name: sortOrder,
                };
                break;
            case 4:
                sortCond = {
                    isSuspended: sortOrder,
                };
                break;
            default:
                sortCond = { created: sortOrder };
                break;
        }

        const count = await Category.countDocuments(query);
        response.draw = 0;
        if (reqData.draw) {
            response.draw = parseInt(reqData.draw) + 1;
        }
        response.recordsTotal = count;
        response.recordsFiltered = count;
        let skip = parseInt(reqData.start);
        let limit = parseInt(reqData.length);
        let categories = await Category.find(query)
            .sort(sortCond)
            .skip(skip)
            .limit(limit);
        if (categories) {
            // console.log("========Before map cate ========="+categories+"=============")
            categories = categories.map(category => {
                // console.log("========After map cate ========="+category+"=============")
                let actions = '';
                //actions = `${actions}<a href="/categories/view/${category._id}" title="view"><i class="fas fa-eye"></i></a>`;
                actions = `${actions}<a href="/categories/edit/${category._id}" title="Edit"> <i class="fas fa-edit"></i> </a>`;

                if(!category.isDeleted){
                    if (category.isSuspended) {
                        actions = `${actions}<a class="statusChange" href="/categories/update-status?id=${category._id}&status=false&" title="Activate"> <i class="fa fa-check"></i> </a>`;
                       } else {
                       actions = `${actions}<a class="statusChange" href="/categories/update-status?id=${category._id}&status=true&" title="Inactivate"> <i class="fa fa-ban"></i> </a>`;
                   }
                }

                if (category.isDeleted) {
                    actions = `${actions}<a class="deleteItem" href="/categories/delete-category/${category._id}" title="Restore"> <i class="fas fa-trash-restore"></i> </a>`;
                } else {
                    actions = `${actions}<a class="deleteItem" href="/categories/delete/${category._id}" title="Delete"> <i class="fas fa-trash"></i> </a>`;
                }
                
                return {
                    0: (skip += 1),
                    1: category.name,
                    2: showDate(category.created),
                    3: category.isDeleted ? '<span class="badge label-table badge-secondary">Yes</span>' : '<span class="badge label-table badge-success">No</span>',
                    4: actions,
                };
            });
        }

        response.data = categories;
        return res.send(response);
    }


    async addPage(req, res) {
        return res.render('categories/add');
    }

    // async add(req, res) {
    //     let data = req.body;
    //     let category = {};
    //     category.name = data.name;
    //     let savecategory = new Category(category);
    //     await savecategory.save();
    //     req.flash('success', req.__('CATEGORIES_ADD_SUCCESS'));
    //     return res.redirect('/categories');
    // }

    async add(req, res, next) {
        let category = {};
        let form = new multiparty.Form();
        form.parse(req, async function(err, fields, files) {
            console.log(fields)
            console.log("===============")
            console.log(files)
            let fileupload = files.image[0];
            _.forOwn(fields, (field, key) => {   
                category[key] = field[0];
            });
            try {
                let image = await uploadImage(fileupload, 'user');
                category['image'] = image.Key;
                await new Category(category).save();
                console.log(category);
                req.flash('success', req.__('CATEGORIES_ADD_SUCCESS'));
                return res.redirect('/categories');
            } catch (err) {
                return next(err);
            }
        });
    }



    // async view(req, res) {
    //     let category = await Categories.findOne({
    //         _id: req.params.id,
    //         isDeleted: false
    //     });

    //     if (!category) {
    //         req.flash('error', req.__('CATEGORIES_NOT_EXISTS'));
    //         return res.redirect('/categories');
    //     }

    //     return res.render('categories/view', {
    //         category
    //     });
    // }

    async editPage(req, res) {
        console.log("======edit=======")
        let _id = req.params._id;
        let category = await Category.findOne({_id,isDeleted: false})
        .lean();
        console.log("======category======="+JSON.stringify(category)+"==id==")

        if (!category) {
            req.flash('error', req.__('CATEGORIES_NOT_EXISTS'));
            return res.redirect('/categories');
        }


        return res.render('categories/edit', { category });
    }

    async edit( req,res ){
        var _id = req.params._id;
        let data = req.body;

        let category = await Category.findOne({_id, isDeleted: false});
        if (!category) {
            req.flash('error', req.__('CATEGORIES_NOT_EXISTS'));
            return res.redirect('/categories');
        }

        category['name'] = req.body.name;
        await category.save();
        req.flash('success', _id ? req.__('CATEGORIES_UPDATED_SUCCESS') : req.__('CATEGORIES_ADD_SUCCESS'));
        return res.redirect('/categories');

        
    }

    async updateStatus(req, res) {
        const { id, status } = req.query;
        let category = await Category.findOne({
            _id: id,
            isDeleted: false
        });

        if (!category) {
            req.flash('error', req.__('CATEGORIES_NOT_EXISTS'));
            return res.render('/categories');
        }
        category.isSuspended = status;
        await category.save();

        req.flash('success', req.__('CATEGORIES_STATUS_UPDATE_SUCCESS'));
        return res.redirect('/categories');
    }

    async delete(req, res) {
        const category = await Category.findOne({
            _id: req.params.id,
            isDeleted: false
        });

        if (!category) {
            req.flash('error', req.__('CATEGORIES_NOT_EXISTS'));
            return res.redirect('/categories');
        }

        category.isDeleted = true;
        await category.save();

        req.flash('success', "Category has been deleted successfully");
        return res.redirect(category.path === null ? '/categories' : req.headers.referer);
    }

    async CategoryRestore(req, res) {
        const category = await Category.findOne({
            _id: req.params.id,
            isDeleted: true
        });

        if (!category) {
            req.flash('error', "Category not found !!");
            return res.redirect('/categories');
        }
        category.isDeleted = false;
        await category.save();

        req.flash('success', "Category has been restored successfully");
        return res.redirect('/categories');
    }

}

module.exports = new CategoryController;
