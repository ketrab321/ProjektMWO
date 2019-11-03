const crypto = require('crypto');
const { check, validationResult } = require('express-validator');
const jwtSecret = require('../../env.js').jwt_secret;
const jwt = require('jsonwebtoken');
const db = require('../main');




exports.doPassAndEmailMatch = [
    check('email').isEmail().normalizeEmail(),
    check('password').not().isEmpty().trim().escape(),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({
                success: 'false',
                errors: errors.array(),
                data: null
            });
        }

        try {
            let query = "SELECT * FROM users WHERE userEmail = '" + req.body.email + "'";
            
            db.conn.query(query, (err, result) => {
                if (err) {
                    return res.status(500).send({
                        success: 'false',
                        errors: [err],
                        data: null
                    });
                }

                if (result.length > 0) {
                    let passwordFields = result[0].userPassword.split('$');
                    let salt = passwordFields[0];
                    let hash = crypto.createHmac('sha512', salt).update(req.body.password).digest("base64");

                    if (hash === passwordFields[1]) {
                        req.body = {
                            userId: result[0].id,
                            name: result[0].userName,
                            email: result[0].userEmail,
                            phone: result[0].userPhone
                        };
                        return next();
                    } else {
                        return res.status(400).send({
                            success: 'false',
                            errors: [{ message: 'Invalid e-mail or password' }],
                            data: null
                        });
                    }
                } else {
                    return res.status(404).send({
                        success: 'false',
                        errors: [{ message: 'No such user here' }],
                        data: null
                    });
                }
            });

            
        } catch (err) {
            res.status(500).send({
                success: 'false',
                errors: [err],
                data: null
            });
        }
    }
];

exports.isJWTValid = (req, res, next) => {
    if (req.headers['authorization']) {
        try {
            let authorization = req.headers['authorization'].split(' ');
            if (authorization[0] !== 'Bearer') {
                return res.status(401).send({
                    success: 'false',
                    errors: [{ message: 'Authorization header required' }],
                    data: null
                });
            } else {
                req.jwt = jwt.verify(authorization[1], jwtSecret);
                // db.conn.connect(
                //     function (err) {
                //     if (err) {
                //         console.log("!!! Cannot connect !!! Error:");
                //         throw err;
                //     }
                //     else
                //     {
                //         console.log("Connection extablished")

                        let query = "SELECT id FROM users WHERE id = '" + req.jwt.userId + "'";
                        db.conn.query(query, (err, result) => {
                            if (err) {
                                return res.status(500).send({
                                    success: 'false',
                                    errors: [err],
                                    data: null
                                });
                            }
                            if (result.length > 0) {
                                return next();
                            } else {
                                return res.status(403).send({
                                    success: 'false',
                                    errors: [{ message: 'Token expired' }],
                                    data: null
                                });
                            }
                        });
                        
                //     }
                // });
            }
        } catch (err) {
            return res.status(403).send({
                success: 'false',
                errors: [{ message: 'Token is invalid' }],
                data: null
            });
        }
    } else {
        return res.status(401).send({
            success: 'false',
            errors: [{ message: 'Authorization header required' }],
            data: null
        });
    }
};

exports.isSameUser = [
    check('userId').isNumeric(),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({
                success: 'false',
                errors: errors.array(),
                data: null
            });
        }

        let userId = req.jwt.userId;

        if (req.body.userId === userId) {
            return next();
        } else {
            return res.status(403).send({
                success: 'false',
                errors: [{ message: 'User is allowed only to perform this action on their own account' }],
                data: null
            });
        }
    }
];

exports.isPassCorrect = [
    check('password').not().isEmpty().trim().escape(),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({
                success: 'false',
                errors: errors.array(),
                data: null
            });
        }

        try {

            // db.conn.connect(
            //     function (err) {
            //     if (err) {
            //         console.log("!!! Cannot connect !!! Error:");
            //         throw err;
            //     }
            //     else
            //     {
            //         console.log("Connection extablished")

                    let query = "SELECT userPassword FROM users WHERE id = '" + req.jwt.userId + "'";

                    db.conn.query(query, (err, result) => {
                        if (err) {
                            return res.status(500).send({
                                success: 'false',
                                errors: [err],
                                data: null
                            });
                        }

                        if (result.length > 0) {
                            let passwordFields = result[0].userPassword.split('$');
                            let salt = passwordFields[0];
                            let hash = crypto.createHmac('sha512', salt).update(req.body.password).digest("base64");

                            if (hash === passwordFields[1]) {
                                return next();
                            } else {
                                return res.status(400).send({
                                    success: 'false',
                                    errors: [{ message: 'Invalid password' }],
                                    data: null
                                });
                            }
                        } else {
                            return res.status(404).send({
                                success: 'false',
                                errors: [{ message: 'No such user here' }],
                                data: null
                            });
                        }
                    });
                    
            //     }
            // })
        } catch (err) {
            res.status(500).send({
                success: 'false',
                errors: [err],
                data: null
            });
        }
    }
];
