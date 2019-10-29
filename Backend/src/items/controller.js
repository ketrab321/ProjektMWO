const { check, validationResult } = require('express-validator');
const itemsCRUD = require('./itemsCRUD');
const db = require('../main');

exports.add = itemsCRUD.add;


//SWIPES
exports.setWanted = [
    check('itemId').isNumeric(),
    (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({
                success: 'false',
                errors: errors.array(),
                data: null
            });
        }

        try {
            helperSetWanted(req.jwt.userId, req.body.itemId, true);
            return res.status(201).json({
                success: 'true',
                errors: null,
                data: null
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

exports.setUnwanted = [
    check('itemId').isNumeric(),
    (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({
                success: 'false',
                errors: errors.array(),
                data: null
            });
        }

        try {
            helperSetWanted(req.jwt.userId, req.body.itemId, false);
            return res.status(201).json({
                success: 'true',
                errors: null,
                data: null
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

var helperSetWanted = function (UserId, ItemId, wants) {
    data = { userId: UserId, itemId: ItemId, wanted: wants }

    // db.conn.connect(
    //     function (err) {
    //     if (err) {
    //         console.log("!!! Cannot connect !!! Error:");
    //         throw err;
    //     }
    //     else
    //     {
    //         console.log("Connection extablished")

            db.conn.query("INSERT INTO swipes SET ?", data, (err, result) => {
                if (err) {
                    throw err
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
            
    //     }
    // })
}
