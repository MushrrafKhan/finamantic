class UtilController {

    async uploadFile(req, res) {
        const { location, type, count = 1 } = req.query;
        const extensions = { IMAGE: 'jpg', 'DOCUMENT.PDF': 'pdf' };
        const extension = extensions[type] || '';
        if (!extension) return res.warn('', req.__('INVALID_FILE_TYPE'));

        const uploader = require('../../../../lib/uploader');
        const promises = [];
        for (let i = 1; i <= count; i++) {
            promises.push(uploader.getSignedUrl(location.endsWith('/') ? location : `${location}/`, extension));
        }

        const urls = await Promise.all(promises);
        res.success(urls);
    }
}

module.exports = new UtilController();
