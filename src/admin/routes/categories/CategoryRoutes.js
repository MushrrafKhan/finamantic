const express = require('express');
const router = express.Router();
const CategoryController = require('./CategoryController');
const { verifyToken } = require('../../util/auth');
const validations = require('./CategoryValidations');
const { validate } = require('../../util/validations');

router.get('/',
    verifyToken,
    CategoryController.listPage
);

router.get('/list',
    verifyToken,
    CategoryController.list
);


router.get('/add',CategoryController.addPage);

router.post('/add',CategoryController.add);

router.get('/update-status',
    verifyToken,
    validate(validations.updateStatus, 'query', {}, '/categories'),
    CategoryController.updateStatus
);

// router.get('/view/:id',
//     verifyToken,
//     validate(validations.requireId, 'params', {}, '/categories'),
//     CategoryController.view
// );

router.get(
    '/edit/:_id',
    verifyToken,
    CategoryController.editPage
);

router.post(
    '/edit/:_id',
    verifyToken,
    CategoryController.edit
);

router.get('/delete/:id',
    verifyToken,
    validate(validations.requireId, 'params', {}, '/categories'),
    CategoryController.delete
);

router.get('/delete-category/:id',
    verifyToken,
    CategoryController.CategoryRestore
);

module.exports = router;


