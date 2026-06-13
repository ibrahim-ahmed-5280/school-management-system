const crypto = require('crypto');

const generateTemporaryPassword = () => {
    const token = crypto.randomBytes(9).toString('base64url');
    return `S!${token}`;
};

module.exports = { generateTemporaryPassword };
