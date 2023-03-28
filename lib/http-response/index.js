const HttpResponseCode = {
    OK: 200,
    WARN_REQUEST: 400,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    SERVER_ERROR: 500,
    PAYMENT_REQUIRED:402,
};

const Response = {
    success(data = null, message = '') {
        this.status(HttpResponseCode.OK).send({
            success: true,
            data,
            message,
        });
    },
    warn(data = null, message = '') {
        this.status(HttpResponseCode.WARN_REQUEST).send({
            success: false,
            data,
            message,
        });
    },
    badRequest(data = null, message = '') {
        this.status(HttpResponseCode.BAD_REQUEST).send({
            success: false,
            data,
            message,
        });
    },
    unauthorized(data = null, message = '') {
        this.status(HttpResponseCode.UNAUTHORIZED).send({
            success: false,
            data,
            message,
        });
    },
    forbidden(data = null, message = '') {
        this.status(HttpResponseCode.FORBIDDEN).send({
            success: false,
            data,
            message,
        });
    },
    notFound(data = null, message = '') {
        this.status(HttpResponseCode.NOT_FOUND).send({
            success: false,
            data,
            message,
        });
    },
    serverError(data = null, message = '', /** @type Error */ err = null) {
        // eslint-disable-next-line no-console
        if (err) console.error('Server-Error: ', err);
        this.status(HttpResponseCode.SERVER_ERROR).send({
            success: false,
            data,
            message,
        });
    },
    paymentRequired(data = null, message = '', /** @type Error */ err = null) {
        this.status(HttpResponseCode.PAYMENT_REQUIRED).send({
            success: false,
            data,
            message,
        });
    },
};

module.exports.HttpResponseCode = HttpResponseCode;
module.exports.Response = Response;
