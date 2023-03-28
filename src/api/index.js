require('custom-env').env('api');

require('dotenv').config({path:__dirname+'/../../.env.api'});
console.log(__dirname+'/../../.env.api');

const express = require('express');
const cors = require('cors');
const app = express();
const bodyParser = require('body-parser');
require('express-async-errors');
const { Response } = require('../../lib/http-response');
const mongoose = require('mongoose');
const { Joi, validate } = require('./util/validations');
const { __, languages } = require('./i18n');
const { enums: { Platform } } = require('../../lib/models');
const flash = require('connect-flash');
var nodeMailer = require('nodemailer');

//console.log(require('dotenv').config());
// console.log('---------------------------------------------------------------',process.env.MONGO_URI);
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true });
mongoose.set('debug', process.env.NODE_ENV === 'development');
global.ObjectId = mongoose.Types.ObjectId;
app.use(cors())
app.use(require('compression')());
const path = require('path');
const engine = require('ejs-locals');
app.use(express.static(path.join(__dirname, 'static')));

app.set('views', path.join(__dirname, 'views'));
app.engine('ejs', engine);
app.set('view engine', 'ejs');
if (process.env.NODE_ENV === 'development') {
    const swaggerUi = require('swagger-ui-express');
    //const YAML = require('yamljs');
    //const swaggerDocument = YAML.load('./src/api/docs/swagger.yaml');
    const swaggerDocument = require('./docs/swagger.json');

    const path = require('path');
    app.use(express.static(path.join(__dirname, 'static')));
    app.use(
        '/docs',
        swaggerUi.serve,
        swaggerUi.setup(swaggerDocument, {
            customfavIcon: '/fav32.png',
            customSiteTitle: 'FinaMantic',
            authorizeBtn: false,
            swaggerOptions: {
                filter: true,
                displayRequestDuration: true,
            },
        })
    );
}
app.use((req, res, next) => {
    /*res.header('Access-Control-Allow-Origin', '*');
    res.header(
        'Access-Control-Allow-Headers',
        'Origin, Referer, User-Agent, X-Requested-With, Content-Type, Accept, Authorization, Accept-Language, Pragma, Cache-Control, Expires, If-Modified-Since, X-Delivery-Drop-Platform, X-Delivery-Drop-Version'
    );*/


    //res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE, PATCH');
    if (req.method === 'OPTIONS') {
        return res.status(204).send('OK');
    }
    next();
});
app.use((req, res, next) => {
    req.__ = __;
    for (const method in Response) {
        if (Response.hasOwnProperty(method)) res[method] = Response[method];
    }
    next();
});
app.use(bodyParser.json({ limit: '100mb' }));
app.use(bodyParser.urlencoded({ limit: '100mb', extended: true }));
const headerValidations = Joi.object()
    .keys({

        'x-hrms-version': Joi.string()
            .regex(/^[\d]+\.[\d]+\.[\d]+$/, 'Semantic Version')
            .required(),
        'accept-language': Joi.string()
            .valid(...Object.keys(languages))
            .required(),
    })
    .required();

app.use((req, res, next) => {
    let x = req.url.split("/")
    if (x && x[1] == 'authpage') {
        //req.__ = 'en';
        res.locals.siteUrl = `${req.protocol}://${req.get('host')}`;
        res.locals.siteTitle = process.env.SITE_TITLE;
        res.locals.DM = __;
        res.locals.s3Base = process.env.AWS_S3_BASE;
        return next();
    } else {
        //validate(headerValidations, 'headers', {allowUnknown: true})(req, res, next);
        return next();
    }


});
app.use('/', require('./routes'));
app.use((err, req, res, next) => {
    // eslint-disable-next-line no-console
    // console.error(err);

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
    return res.status(404).send({
        success: false,
        data: [],
        message: req.__('NOT_FOUND_ERR'),
    });
});
/***
    update working today true on 24:00
*/
const port = process.env.PORT || 3000;
let server;
if (process.env.SERVER_MODE === 'https') {
    const https = require('https');
    // var io = require('socket.io')(http);

    const fs = require('fs');
    const privateKey = fs.readFileSync("./ssl_keys/privkey.pem", "utf8");
    const certificate = fs.readFileSync("./ssl_keys/cert.pem", "utf8");
    const ca = fs.readFileSync("./ssl_keys/chain.pem", "utf8");
    var credentials = { key: privateKey, cert: certificate, ca: ca };
    server = https.createServer(credentials, app);

} else {
    const http = require('http')
    server = http.createServer(app);
    // var io = require('socket.io')(http);

}

server.listen(port, function () {
    // eslint-disable-next-line no-console
    console.info(`Server Started on port ${port}`);
});
const {
    sendMessage
} = require('./routes/sockets/ws');
const {
    models: { 
        User,
        Category,
        LikeDislike,
        GroupSwap,
        Notification,
        InvitedUser,
        Friend,
        AdminSettings,
        GroupSwaplike,
        GroupChat,
        Setting,
    },
  } = require('../../lib/models');
const io = require("socket.io")(server);
io.on('connection', socket => {
    console.log("socket is connected");
    socket.on('send-message', async (groupid,userId,msg) => {
        try{
            sendMessage(groupid,userId,msg)
        }catch(err){
            console.log(err);
        }
    });
    socket.on('getmessages', async (groupid) => {
        try{
            let groupId=groupid;
            let groupInfo=await GroupSwap.findOne({_id:groupId});
            let findmessages= await GroupChat.find({groupId})
                .populate({path:'friendId',select:'avatar name',model:User});
                console.log(findmessages);
                io.to(socket.id).emit('receive_message', findmessages); 
        }catch(err){
            console.log(err);
        }
        
    });

});