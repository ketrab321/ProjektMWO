const crypto = require('crypto');
const { check, validationResult } = require('express-validator');

exports.insert = [
    check('name').not().isEmpty().trim().escape(),
    check('email').isEmail().normalizeEmail(),
    check('phone').not().isEmpty().trim().escape(),
    check('password').not().isEmpty().trim().escape(),
    (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({
                success: 'false',
                errors: errors.array(),
                data: null
            });
        }

        let salt = crypto.randomBytes(16).toString('base64');
        let hash = crypto.createHmac('sha512', salt).update(req.body.password).digest("base64");
        req.body.password = salt + "$" + hash;

        let data = { userName: req.body.name, userPassword: req.body.password, userEmail: req.body.email, userPhone: req.body.phone }

        conn.query("INSERT INTO users SET ?", data, (err, result) => {
            if (err) {
                return res.status(500).send({
                    success: 'false',
                    errors: [err],
                    data: null
                });
            }

            if (result.affectedRows > 0) {
                return res.status(201).send({
                    success: 'true',
                    errors: null,
                    data: null
                });
            } else {
                return res.status(500).send({
                    success: 'false',
                    errors: [{ message: 'Could not save data' }],
                    data: null
                });
            }
        });
    }
];

exports.getById = [
    check('userId').isNumeric(),
    (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({
                success: 'false',
                errors: errors.array(),
                data: null
            });
        }

        let query = "SELECT userName, userEmail, userPhone FROM users WHERE ID = '" + req.body.userId + "'";

        try {
            conn.query(query, (err, result) => {
                if (err) {
                    return res.status(500).send({
                        success: 'false',
                        errors: [err],
                        data: null
                    });
                }
                if (result.length > 0) {
                    return res.status(200).send({
                        success: 'true',
                        errors: null,
                        data: {
                            name: result[0].userName,
                            email: result[0].userEmail,
                            phone: result[0].userPhone
                        }
                    });
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

exports.delete = (req, res) => {
    let query = "DELETE FROM users WHERE id = '" + req.jwt.userId + "'";

    try {
        conn.query(query, (err, result) => {
            if (err) {
                return res.status(500).send({
                    success: 'false',
                    errors: [err],
                    data: null
                });
            }

            if (result.affectedRows > 0) {
                return res.status(200).send({
                    success: 'true',
                    errors: null,
                    data: null
                });
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
};
