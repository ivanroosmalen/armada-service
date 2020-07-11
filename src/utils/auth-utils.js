function getBearerToken(headers){
    let token = null;
    if (!headers || !headers.Authorization) return token;
    let parts = headers.Authorization.split(' ');
    if (parts.length !== 2) return token;
    let type = parts[0].toLowerCase();
    if ('bearer' !== type) return token;
    return parts[1];
}


module.exports = {
    getBearerToken
};
