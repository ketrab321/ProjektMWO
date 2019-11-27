const crypto = require('crypto');
const mysql = require('mysql');
const db = require('../main');

const { check, validationResult } = require('express-validator');

const customValidationResult = validationResult.withDefaults({
    formatter: (error) => {
        return {
            value: error.value,
            message: error.msg,
            param: error.param,
            location: error.location
        };
    }
});

exports.insert = [
    check('name').not().isEmpty().trim().escape(),
    check('email').isEmail().normalizeEmail(),
    check('phone').not().isEmpty().trim().escape(),
    check('password').not().isEmpty().trim().escape(),
    (req, res) => {
        const errors = customValidationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({
                success: false,
                errors: errors.array(),
                data: null
            });
        }

        let salt = crypto.randomBytes(16).toString('base64');
        let hash = crypto.createHmac('sha512', salt).update(req.body.password).digest("base64");
        req.body.password = salt + "$" + hash;

        let data = { userName: req.body.name, userPassword: req.body.password, userEmail: req.body.email, userPhone: req.body.phone }

        db.conn.query("INSERT INTO users SET ?", data, (err, result) => {
            if (err) {
                err = JSON.parse(JSON.stringify(err).replace("\"sqlMessage\":", "\"message\":"));
                var resp_code;
                if (err.code === 'ER_DUP_ENTRY') {
                    resp_code = 409;
                } else {
                    resp_code = 500;
                }
                return res.status(resp_code).send({
                    success: false,
                    errors: [err],
                    data: null
                });
            }

            if (result.affectedRows > 0) {
                return res.status(201).send({
                    success: true,
                    errors: null,
                    data: null
                });
            } else {
                return res.status(500).send({
                    success: false,
                    errors: [{ message: 'Could not save data' }],
                    data: null
                });
            }
        });
    }
];

exports.update = [
    check('new_name').trim().escape(),
    check('new_phone').trim().escape(),
    check('new_password').trim().escape(),
    (req, res) => {
        const errors = customValidationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({
                success: false,
                errors: errors.array(),
                data: null
            });
        }

        if (req.body.new_password != '') {
            req.body.password = req.body.new_password;
        }

        let salt = crypto.randomBytes(16).toString('base64');
        let hash = crypto.createHmac('sha512', salt).update(req.body.password).digest("base64");
        req.body.password = salt + "$" + hash;

        if (req.body.new_name == '') {
            req.body.name = req.jwt.name
        } else {
            req.body.name = req.body.new_name
        }

        if (req.body.new_phone == '') {
            req.body.phone = req.jwt.phone
        } else {
            req.body.phone = req.body.new_phone
        }

        let data = { userName: req.body.name, userPassword: req.body.password, userEmail: req.jwt.email, userPhone: req.body.phone }

        db.conn.query("UPDATE users SET ? WHERE id = ?", [data, req.jwt.userId], (err, result) => {
            if (err) {
                err = JSON.parse(JSON.stringify(err).replace("\"sqlMessage\":", "\"message\":"));
                var resp_code = 500
                return res.status(resp_code).send({
                    success: false,
                    errors: [err],
                    data: null
                });
            }

            if (result.affectedRows > 0) {
                return res.status(201).send({
                    success: true,
                    errors: null,
                    data: null
                });
            } else {
                return res.status(500).send({
                    success: false,
                    errors: [{ message: 'Could not save data' }],
                    data: null
                });
            }
        });
    }
];

exports.get_myself = [
    (req, res) => {
        let query = "SELECT userName, userEmail, userPhone FROM users WHERE ID = '" + req.jwt.userId + "'";

        try {
            db.conn.query(query, (err, result) => {
                if (err) {
                    err = JSON.parse(JSON.stringify(err).replace("\"sqlMessage\":", "\"message\":"));
                    return res.status(500).send({
                        success: false,
                        errors: [err],
                        data: null
                    });
                }
                if (result.length > 0) {
                    return res.status(200).send({
                        success: true,
                        errors: null,
                        data: {
                            name: result[0].userName,
                            email: result[0].userEmail,
                            phone: result[0].userPhone
                        }
                    });
                } else {
                    return res.status(404).send({
                        success: false,
                        errors: [{ message: 'No such user here' }],
                        data: null
                    });
                }
            });
        } catch (err) {
            res.status(500).send({
                success: false,
                errors: [err],
                data: null
            });
        }
    }
];

exports.delete = (req, res) => {
    let query = "DELETE FROM users WHERE id = '" + req.jwt.userId + "'";

    try {
        db.conn.query(query, (err, result) => {
            if (err) {
                err = JSON.parse(JSON.stringify(err).replace("\"sqlMessage\":", "\"message\":"));
                return res.status(500).send({
                    success: false,
                    errors: [err],
                    data: null
                });
            }

            if (result.affectedRows > 0) {
                return res.status(200).send({
                    success: true,
                    errors: null,
                    data: null
                });
            } else {
                return res.status(404).send({
                    success: false,
                    errors: [{ message: 'No such user here' }],
                    data: null
                });
            }
        });
    } catch (err) {
        res.status(500).send({
            success: false,
            errors: [err],
            data: null
        });
    }
};
