const express = require('express');
const router = express.Router();
const fs = require('fs');
const UserController = require('./users/UserController');
const { verifyToken } = require('../util/auth');

const routes = fs.readdirSync(__dirname);
//console.log(routes);
routes.forEach(route => {
    if (route === 'index.js') return;
    router.use(`/${route}`, require(`./${route}`));
});

module.exports = router;
