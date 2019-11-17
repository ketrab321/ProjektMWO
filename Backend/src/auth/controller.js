const jwtSecret = require('../../env.js').jwt_secret,
jwt = require('jsonwebtoken');

exports.login = (req, res) => {
    try {
        let token = jwt.sign(req.body, jwtSecret);
        res.status(201).send({
            success: true,
            errors: null,
            data: { userToken: token }
        });
    } catch (err) {
        res.status(500).send({
            success: false,
            errors: [err],
            data: null
         });
    }
};
