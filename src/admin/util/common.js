const getLanguage = req => req.session.lang || 'en';

module.exports = {
    getLanguage,
};
