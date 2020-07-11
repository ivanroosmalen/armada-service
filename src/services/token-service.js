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
    let resp = {entity: { valid: false },
                message: ''};
    try {
        jwt.verify(token, new Buffer(secret, 'base64'));
        resp.valid = true;
    } catch (e) {
        if (e instanceof jwt.TokenExpiredError || e instanceof jwt.JsonWebTokenError) resp.reason = e.message;
        else resp.reason = 'unknown'
    }
    return resp;
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
