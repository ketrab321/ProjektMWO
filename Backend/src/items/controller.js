const { check, validationResult } = require('express-validator');
const itemsCRUD = require('./itemsCRUD');
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

exports.add = itemsCRUD.add;
exports.delete = itemsCRUD.delete;
exports.getRandomItem = itemsCRUD.getRandomItem;
exports.getUserItems = itemsCRUD.getUserItems;
exports.test = itemsCRUD.test;
//SWIPES
exports.setWanted = [
    check('itemId').isNumeric(),
    (req, res) => {
        const errors = customValidationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({
                success: false,
                errors: errors.array(),
                data: null
            });
        }
        helperSetWanted(req.jwt.userId, req.body.itemId, true, res);
    }
];

exports.setUnwanted = [
    check('itemId').isNumeric(),
    (req, res) => {
        const errors = customValidationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({
                success: false,
                errors: errors.array(),
                data: null
            });
        }
        helperSetWanted(req.jwt.userId, req.body.itemId, false, res);
    }
];

var helperSetWanted = function (UserId, ItemId, wants, res) {
    data = { userId: UserId, itemId: ItemId, wanted: wants }

    db.conn.query("INSERT INTO swipes SET ?", data, (err, result) => {
        if (err) {
            err = JSON.parse(JSON.stringify(err).replace("\"sqlMessage\":", "\"message\":"));
            return res.status(500).send({
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
