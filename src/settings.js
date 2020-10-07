const env = process.env;

let settings = {
    cors: {
        credentials: true
    },
    auth: {
        saltRounds: 10
    },
    jwt: {
        secret: (env.AUTH_JWT_SECRET || '3744138f-e8b4-43ee-9911-18cef85295ab').trim(),
        delimiter: env.AUTH_JWT_DELIMITER || ':',
        exp: parseInt(env.AUTH_JWT_EXP || 86400)
    },
    mongo: {
        connectionString: env.MONGO_CONNECTION_STRING
    },
    membership: {
        version: '1',
        defaultMemberLimit: 5,
        stripe: {
          secretKey: env.STRIPE_SECRET || ''
        }
    }
};

module.exports = settings;
