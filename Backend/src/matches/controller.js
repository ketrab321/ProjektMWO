const { check, validationResult } = require('express-validator');
const db = require('../main');

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

exports.decline = [
    check('matchId').isNumeric(),
    (req, res) => {
        const errors = customValidationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({
                success: false,
                errors: errors.array(),
                data: null
            });
        }

        var startNode = req.body.matchId

        db.conn.query("SELECT userId FROM chains WHERE id = ?", startNode, (err, result) => {
            if (err) {
                err = JSON.parse(JSON.stringify(err).replace("\"sqlMessage\":", "\"message\":"));
                return res.status(500).send({
                    success: false,
                    errors: [err],
                    data: null
                });
            }

            if (result.length > 0) {
                if (result[0].userId == req.jwt.userId) {
                    db.conn.query("DELETE FROM chains WHERE id = ?", req.body.matchId, (err, result) => {
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
                                errors: [{ message: 'User is not a party in this match.' }],
                                data: null
                            });
                        }

                    })
                } else {
                    return res.status(403).send({
                        success: false,
                        errors: [{ message: 'User is not a party in this match.' }],
                        data: null
                    });
                }
            } else {
                return res.status(404).send({
                    success: false,
                    errors: [{ message: 'No such match here.' }],
                    data: null
                });
            }
        })
    }
];
