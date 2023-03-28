const getPlatform = req => req.headers['x-hrms-platform'];
const getLanguage = req => req.headers['accept-language'];

module.exports = {
    getPlatform,
    getLanguage,
};
