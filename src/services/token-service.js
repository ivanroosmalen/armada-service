const uuid = require('uuid/v1');
const jwt = require('jsonwebtoken');
const settings = require('../settings');

function createSecret() {
    return `${settings.jwt.secret}${settings.jwt.delimiter}${uuid()}`;
};

function getSecret(suffix) {
    return `${settings.jwt.secret}${settings.jwt.delimiter}${suffix}`;
};

function getSecretSuffix(secret) {
    return secret.split(settings.jwt.delimiter)[1];
};

function createJti() {
    return `${uuid()}`
};


function sign(payload, secret, expiresIn=settings.jwt.exp) {
    return jwt.sign(payload, new Buffer(secret, 'base64'), {expiresIn: expiresIn})
};

function verify(token, secret) {
    try {
        return jwt.verify(token, new Buffer(secret, 'base64'));
    } catch (e) {
        if (e instanceof jwt.TokenExpiredError || e instanceof jwt.JsonWebTokenError) {
            throw new Error(e.message);
        } else  {
          throw new Error('unknown');
        }
    }
};

function decode(token, complete=false) {
    return jwt.decode(token, {complete: complete})
};

module.exports = {
    createSecret,
    getSecret,
    getSecretSuffix,
    createJti,
    sign,
    verify,
    decode
}
