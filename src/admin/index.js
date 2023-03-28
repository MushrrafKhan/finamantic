require('custom-env').env('admin');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
require('express-async-errors');
const {Response} = require('../../lib/http-response');
const mongoose = require('mongoose');
const {withLanguage} = require('../../lib/i18n');
const {showDate} = require('../../lib/util');
require('dotenv').config();



mongoose.connect(process.env.MONGO_URI, {useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true});
mongoose.set('debug', process.env.NODE_ENV === 'development');

app.use(require('compression')());
const path = require('path');
const engine = require('ejs-locals');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const flash = require('connect-flash');
const moment = require('moment');
const cookieParser = require('cookie-parser');
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'static')));
app.set('views', path.join(__dirname, 'views'));
app.engine('ejs', engine);
app.set('view engine', 'ejs');
app.use(
    session({
        cookie: {
            maxAge: 60000000,
        },
        resave: false,
        saveUninitialized: false,
        secret: process.env.SESSION_SECRET,
        store: new MongoStore({
            mongooseConnection: mongoose.connection,
        }),
    })
);
app.use(flash());

if (process.env.NODE_ENV === 'development') {
    app.use(require('morgan')('dev'));
}


app.use(bodyParser.json({limit: '100mb', extended: true}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));

app.use((req, res, next) => {
    req.__ = withLanguage(req.session.lang || 'en');
    for (const method in Response) {
        if (Response.hasOwnProperty(method)) res[method] = Response[method];
    }
    next();
});
app.use(function (req, res, next) {
    const currentUser = req.session.user || {};
    const lang = req.session.lang || 'en';
    const __ = withLanguage(lang);
    res.locals.siteUrl = `${req.protocol}://${req.get('host')}`;
    res.locals.siteTitle = process.env.SITE_TITLE;
    res.locals.errorFlash = req.flash('error')[0];
    res.locals.successFlash = req.flash('success')[0];
    res.locals.infoFlash = req.flash('info')[0];
    res.locals.currentUser = currentUser;
    res.locals.lang = lang;
    res.locals.currentYear = moment().format('YYYY');
    res.locals.showDate = date => showDate(date);
    res.locals.DM = __;
    res.locals.s3Base = process.env.AWS_BASE_URL;
    res.locals.moment = moment;
    return next();
});

app.use('/', require('./routes'));
app.use((err, req, res, next) => {
    // eslint-disable-next-line no-console
    console.error(err);

    if (res.headersSent) {
        return next(err);
    }

    if (err.message === 'EntityNotFound') {
        return res.notFound('', req.__('NOT_FOUND'));
    }

    return res.status(err.status || 500).send({
        success: false,
        data: [],
        message: req.__('GENERAL_ERROR'),
    });
});
app.use(function (req, res) {
    return res.render('404');
});

const port = process.env.PORT || 3000;
let server;
if (process.env.SERVER_MODE === 'https') {
    const https = require('https');
    const fs = require('fs');
    server = https.createServer(
        {
            key: fs.readFileSync(process.env.SSL_KEY_PATH, 'utf8'),
            cert: fs.readFileSync(process.env.SSL_CERT_PATH, 'utf8'),
            ca: fs.readFileSync(process.env.SSL_CA_PATH, 'utf8'),
        },
        app
    );
} else {
    const http = require('http');
    server = http.createServer(app);
}

server.listen(port, function () {
    // eslint-disable-next-line no-console
    console.info(`Server Started on port ${port}`);
});