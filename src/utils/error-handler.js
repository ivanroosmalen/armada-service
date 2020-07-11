module.exports.handleError = (statusCode, message, error) => {
    console.error(message, error);
    return {
        statusCode,
        body: JSON.stringify({
            message: message
        })
    };
}
