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
        helperSetWanted(req.jwt.userId, req.body.itemId, true, res, findMaches);
    }
];

function findMaches(UserId, ItemId) {
    try {
        db.conn.query("SELECT itemUserId FROM items WHERE ?", { id: ItemId }, findOwner)
    } catch (err) {
        console.log(err)
    }

    function findOwner(err, result) {
        if (err) {
            console.log(err)
        }

        if (result.length > 0) {
            ownerId = result[0].itemUserId
            db.conn.query("SELECT i.id FROM items i JOIN swipes s ON i.id = s.itemId WHERE s.wanted = 1 AND i.itemUserId = ? AND s.userId = ?", [UserId, ownerId], findItemsForExchange)
            function findItemsForExchange(err, result) {
                if (err) {
                    console.log(err)
                }

                result.forEach(handleItem)
            };

            function handleItem(row) {
                var anotherItemItd = row.id

                data = { chainStatus: 'PENDING', myItemId: ItemId, userId: ownerId }
                db.conn.query("INSERT INTO chains SET ?", data, addFirstNode)
                function addFirstNode(err, result) {
                    if (err) {
                        console.log(err)
                    }

                    var Node1

                    if (result.affectedRows > 0) {
                        Node1 = result.insertId

                        data = { chainStatus: 'PENDING', myItemId: anotherItemItd, userId: UserId }
                        db.conn.query("INSERT INTO chains SET ?", data, updatePointers)
                    }

                    function updatePointers(err, result) {
                        if (err) {
                            console.log(err)
                        }

                        var Node2
                        if (result.affectedRows > 0) {
                            Node2 = result.insertId

                            db.conn.query("UPDATE chains SET nextNodeId = ?, prevNodeId = ? WHERE id = ?", [Node2, Node2, Node1], (err, result) => {
                                if (err) {
                                    console.log(err)
                                }
                            })

                            db.conn.query("UPDATE chains SET nextNodeId = ?, prevNodeId = ? WHERE id = ?", [Node1, Node1, Node2], (err, result) => {
                                if (err) {
                                    console.log(err)
                                }
                            })
                        }
                    }
                }
            }
        }
    };
}

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
        helperSetWanted(req.jwt.userId, req.body.itemId, false, res, () => { });
    }
];

var helperSetWanted = function (UserId, ItemId, wants, res, callback) {
    data = { id: ItemId }
    db.conn.query("SELECT itemUserId FROM items WHERE ?", data, checkIfLegal)
    function checkIfLegal(err, result) {
        if (err) {
            err = JSON.parse(JSON.stringify(err).replace("\"sqlMessage\":", "\"message\":"));
            return res.status(500).send({
                success: false,
                errors: [err],
                data: null
            });
        }

        if (result.length == 0) {
            return res.status(404).send({
                success: false,
                errors: [{ message: 'Item does not exist.' }],
                data: null
            });
        }

        ownerId = result[0].itemUserId
        if (UserId == ownerId) {
            return res.status(422).send({
                success: false,
                errors: [{ message: 'User cannot perform this action on their item.' }],
                data: null
            });
        } else {
            db.conn.query("SELECT id FROM swipes WHERE userId = ? AND itemId = ?", [UserId, ItemId], checkForDuplicateAction)
            function checkForDuplicateAction(err, result) {
                if (err) {
                    err = JSON.parse(JSON.stringify(err).replace("\"sqlMessage\":", "\"message\":"));
                    return res.status(500).send({
                        success: false,
                        errors: [err],
                        data: null
                    });
                }

                if (result.length == 0) {
                    data = { userId: UserId, itemId: ItemId, wanted: wants }

                    db.conn.query("INSERT INTO swipes SET ?", data, insertSwipe)
                    function insertSwipe(err, result) {
                        if (err) {
                            err = JSON.parse(JSON.stringify(err).replace("\"sqlMessage\":", "\"message\":"));
                            var resp_code;
                            if (err.code === 'ER_NO_REFERENCED_ROW') {
                                resp_code = 404;
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
                            callback(UserId, ItemId)
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
                    };
                } else {
                    return res.status(422).send({
                        success: false,
                        errors: [{ message: 'User cannot perform this action multiple times on same item.' }],
                        data: null
                    });
                }
            }
        }
    };
}
