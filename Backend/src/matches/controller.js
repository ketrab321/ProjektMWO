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

        db.conn.query("SELECT userId FROM chains WHERE id = ? AND chainStatus = 'PENDING'", req.body.matchId, checkIfLegal)
        function checkIfLegal(err, result) {
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
                    db.conn.query("DELETE FROM chains WHERE id = ?", req.body.matchId, deleteChain)
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
                    errors: [{ message: 'No such pending match here.' }],
                    data: null
                });
            }
        }

        function deleteChain(err, result) {
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
        }
    }
];

exports.accept = [
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

        db.conn.query("SELECT userId FROM chains WHERE id = ? AND chainStatus = 'PENDING'", req.body.matchId, checkIfLegal)
        function checkIfLegal(err, result) {
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
                    db.conn.query("UPDATE chains SET chainStatus = 'ACCEPTED' WHERE id = ?", req.body.matchId, updateChain)
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
                    errors: [{ message: 'No such pending match here.' }],
                    data: null
                });
            }
        }

        function updateChain(err, result) {
            if (err) {
                err = JSON.parse(JSON.stringify(err).replace("\"sqlMessage\":", "\"message\":"));
                return res.status(500).send({
                    success: false,
                    errors: [err],
                    data: null
                });
            }

            if (result.affectedRows > 0) {
                db.conn.query("SELECT id, myItemId, nextNodeId FROM chains WHERE id = ?", req.body.matchId, checkIfAcceptedByAll)
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
        }

        function checkIfAcceptedByAll(err, result) {
            if (err) {
                console.log(err)
                return
            }

            if (result.length > 0) {
                checkIfNextAccepted(result[0].id, result[0].nextNodeId, [result[0].id], [result[0].myItemId])
            }
        }

        function checkIfNextAccepted(startNode, currentNode, nodesInChain, itemsInChain) {
            if (startNode != currentNode) {
                db.conn.query("SELECT myItemId, chainStatus, nextNodeId FROM chains WHERE id = ?", currentNode, (err, result) => {
                    if (err) {
                        console.log(err)
                        return
                    }

                    if (result.length > 0 && result[0].chainStatus == 'ACCEPTED') {
                        nodesInChain.push(currentNode)
                        itemsInChain.push(result[0].myItemId)
                        checkIfNextAccepted(startNode, result[0].nextNodeId, nodesInChain, itemsInChain)
                    } else if (result.length == 0) {
                        console.log("Node of id = " + currentNode + " not found.")
                    }
                })
            } else { // traversed the whole chain and everyone accepted\
                markAcceptedByAll(nodesInChain)
                markMatched(itemsInChain)
            }
        }

        function markAcceptedByAll(nodesInChain) {
            db.conn.query("UPDATE chains SET chainStatus = 'ACCEPTED_BY_ALL' WHERE id IN (?)", [nodesInChain], (err, _result) => {
                if (err) {
                    console.log(err)
                    return
                }
            })
        }

        function markMatched(itemsInChain) {
            db.conn.query("UPDATE items SET itemStatus = 'MATCHED' WHERE id IN (?)", [itemsInChain], (err, _result) => {
                if (err) {
                    console.log(err)
                    return
                }
            })
        }
    }
];

exports.confirm = [
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

        db.conn.query("SELECT userId FROM chains WHERE id = ? AND chainStatus = 'ACCEPTED_BY_ALL'", req.body.matchId, checkIfLegal)
        function checkIfLegal(err, result) {
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
                    db.conn.query("UPDATE chains SET chainStatus = 'CONFIRMED' WHERE id = ?", req.body.matchId, updateChain)
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
                    errors: [{ message: 'No such match here or match is not accepted by all.' }],
                    data: null
                });
            }
        }

        function updateChain(err, result) {
            if (err) {
                err = JSON.parse(JSON.stringify(err).replace("\"sqlMessage\":", "\"message\":"));
                return res.status(500).send({
                    success: false,
                    errors: [err],
                    data: null
                });
            }

            if (result.affectedRows > 0) {
                db.conn.query("SELECT id, myItemId, nextNodeId FROM chains WHERE id = ?", req.body.matchId, checkIfConfirmedByAll)
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
        }

        function checkIfConfirmedByAll(err, result) {
            if (err) {
                console.log(err)
                return
            }

            if (result.length > 0) {
                checkIfNextConfirmed(result[0].id, result[0].nextNodeId, [result[0].myItemId])
            }
        }

        function checkIfNextConfirmed(startNode, currentNode, itemsInChain) {
            if (startNode != currentNode) {
                db.conn.query("SELECT chainStatus, myItemId, nextNodeId FROM chains WHERE id = ?", currentNode, (err, result) => {
                    if (err) {
                        console.log(err)
                        return
                    }

                    if (result.length > 0 && result[0].chainStatus == 'CONFIRMED') {
                        itemsInChain.push(result[0].myItemId)
                        checkIfNextConfirmed(startNode, result[0].nextNodeId, itemsInChain)
                    } else if (result.length == 0) {
                        console.log("Node of id = " + currentNode + " not found.")
                    }
                })
            } else { // traversed the whole chain and everyone confirmed
                deleteItem(itemsInChain)
            }
        }

        function deleteItem(itemsInChain) {
            db.conn.query("DELETE FROM items WHERE id IN (?)", [itemsInChain], (err, _result) => {
                if (err) {
                    console.log(err)
                    return
                }
            })
        }
    }
];

exports.get_pending = (req, res) => {
    db.conn.query("SELECT * FROM chains WHERE userId = ? AND chainStatus = 'PENDING'", req.jwt.userId, (err, result) => {
        if (err) {
            err = JSON.parse(JSON.stringify(err).replace("\"sqlMessage\":", "\"message\":"));
            return res.status(500).send({
                success: false,
                errors: [err],
                data: null
            });
        }

        var matches = []

        if (result.length == 0) {
            return res.status(200).send({
                success: true,
                errors: null,
                data: { matches: matches }
            })
        } else {
            result.forEach(handleNode)
        }

        function handleNode(row, index, array) {
            var nodeId = row.id
            var myItemId = row.myItemId
            var prevNode = row.prevNodeId
            var nextNode = row.nextNodeId
            var myItem
            var toWho
            var fromWho
            var exchangeItem

            db.conn.query("SELECT * FROM items WHERE id = ?", myItemId, getItemData)
            function getItemData(err, result) {
                if (err) {
                    err = JSON.parse(JSON.stringify(err).replace("\"sqlMessage\":", "\"message\":"));
                    return res.status(500).send({
                        success: false,
                        errors: [err],
                        data: null
                    });
                }

                if (result.length > 0) {
                    myItem = {
                        id: myItemId,
                        name: result[0].itemName,
                        description: result[0].itemDescription,
                        photoUrl: result[0].itemPhoto,
                        priceCategory: result[0].itemPriceCategory,
                        category: result[0].itemCategory
                    }

                    db.conn.query("SELECT * FROM users WHERE id IN (SELECT userId FROM chains WHERE id = ?)", nextNode, getNextPerson)
                } else {
                    return res.status(500).send({
                        success: false,
                        errors: [{ message: 'Item of id ' + myItemId + ' for ' + nodeId + ' node not found' }],
                        data: null
                    });
                }
            }

            function getNextPerson(err, result) {
                if (err) {
                    err = JSON.parse(JSON.stringify(err).replace("\"sqlMessage\":", "\"message\":"));
                    return res.status(500).send({
                        success: false,
                        errors: [err],
                        data: null
                    });
                }

                if (result.length > 0) {
                    toWho = {
                        id: result[0].id,
                        name: result[0].userName,
                        email: result[0].userEmail,
                        phone: result[0].userPhone
                    }

                    db.conn.query("SELECT * FROM users WHERE id IN (SELECT userId FROM chains WHERE id = ?)", prevNode, getPrevPerson)
                } else {
                    return res.status(500).send({
                        success: false,
                        errors: [{ message: 'Next user not found, nodeId = ' + nodeId }],
                        data: null
                    });
                }
            }

            function getPrevPerson(err, result) {
                if (err) {
                    err = JSON.parse(JSON.stringify(err).replace("\"sqlMessage\":", "\"message\":"));
                    return res.status(500).send({
                        success: false,
                        errors: [err],
                        data: null
                    });
                }

                if (result.length > 0) {
                    fromWho = {
                        id: result[0].id,
                        name: result[0].userName,
                        email: result[0].userEmail,
                        phone: result[0].userPhone
                    }

                    db.conn.query("SELECT * FROM items WHERE id IN (SELECT myItemId FROM chains WHERE id = ?)", prevNode, getExchangeItem)
                } else {
                    return res.status(500).send({
                        success: false,
                        errors: [{ message: 'Next user not found, nodeId = ' + nodeId }],
                        data: null
                    });
                }
            }

            function getExchangeItem(err, result) {
                if (err) {
                    err = JSON.parse(JSON.stringify(err).replace("\"sqlMessage\":", "\"message\":"));
                    return res.status(500).send({
                        success: false,
                        errors: [err],
                        data: null
                    });
                }

                if (result.length > 0) {
                    exchangeItem = {
                        id: result[0].id,
                        name: result[0].itemName,
                        description: result[0].itemDescription,
                        photoUrl: result[0].itemPhoto,
                        priceCategory: result[0].itemPriceCategory,
                        category: result[0].itemCategory
                    }

                    matches.push({
                        id: nodeId,
                        myItem: myItem,
                        exchangeItem: exchangeItem,
                        toWho: toWho,
                        fromWho: fromWho
                    })

                    if (index == array.length - 1) {
                        return res.status(200).send({
                            success: true,
                            errors: null,
                            data: { matches: matches }
                        })
                    }
                } else {
                    return res.status(500).send({
                        success: false,
                        errors: [{ message: 'Next user not found, nodeId = ' + nodeId }],
                        data: null
                    });
                }
            }
        }
    })
};


exports.get_accepted = (req, res) => {
    db.conn.query("SELECT * FROM chains WHERE userId = ? AND chainStatus = 'ACCEPTED_BY_ALL'", req.jwt.userId, (err, result) => {
        if (err) {
            err = JSON.parse(JSON.stringify(err).replace("\"sqlMessage\":", "\"message\":"));
            return res.status(500).send({
                success: false,
                errors: [err],
                data: null
            });
        }

        var matches = []

        if (result.length == 0) {
            return res.status(200).send({
                success: true,
                errors: null,
                data: { matches: matches }
            })
        } else {
            result.forEach(handleAcceptedMatch)
        }

        function handleAcceptedMatch(row, index, array) {
            var currentNode = row.id
            var myItemId = row.myItemId
            var prevNode = row.prevNodeId
            var nextNode = row.nextNodeId
            var myItem
            var toWho
            var fromWho
            var exchangeItem

            db.conn.query("SELECT * FROM items WHERE id = ?", myItemId, getItemData)
            function getItemData(err, result) {
                if (err) {
                    err = JSON.parse(JSON.stringify(err).replace("\"sqlMessage\":", "\"message\":"));
                    return res.status(500).send({
                        success: false,
                        errors: [err],
                        data: null
                    });
                }

                if (result.length > 0) {
                    myItem = {
                        id: myItemId,
                        name: result[0].itemName,
                        description: result[0].itemDescription,
                        photoUrl: result[0].itemPhoto,
                        priceCategory: result[0].itemPriceCategory,
                        category: result[0].itemCategory
                    }

                    db.conn.query("SELECT * FROM users WHERE id IN (SELECT userId FROM chains WHERE id = ?)", nextNode, getNextPerson)
                } else {
                    return res.status(500).send({
                        success: false,
                        errors: [{ message: 'Item of id ' + myItemId + ' for ' + nodeId + ' node not found' }],
                        data: null
                    });
                }
            }

            function getNextPerson(err, result) {
                if (err) {
                    err = JSON.parse(JSON.stringify(err).replace("\"sqlMessage\":", "\"message\":"));
                    return res.status(500).send({
                        success: false,
                        errors: [err],
                        data: null
                    });
                }

                if (result.length > 0) {
                    toWho = {
                        id: result[0].id,
                        name: result[0].userName,
                        email: result[0].userEmail,
                        phone: result[0].userPhone
                    }

                    db.conn.query("SELECT * FROM users WHERE id IN (SELECT userId FROM chains WHERE id = ?)", prevNode, getPrevPerson)
                } else {
                    return res.status(500).send({
                        success: false,
                        errors: [{ message: 'Next user not found, nodeId = ' + nodeId }],
                        data: null
                    });
                }
            }

            function getPrevPerson(err, result) {
                if (err) {
                    err = JSON.parse(JSON.stringify(err).replace("\"sqlMessage\":", "\"message\":"));
                    return res.status(500).send({
                        success: false,
                        errors: [err],
                        data: null
                    });
                }

                if (result.length > 0) {
                    fromWho = {
                        id: result[0].id,
                        name: result[0].userName,
                        email: result[0].userEmail,
                        phone: result[0].userPhone
                    }

                    db.conn.query("SELECT * FROM items WHERE id IN (SELECT myItemId FROM chains WHERE id = ?)", prevNode, getExchangeItem)
                } else {
                    return res.status(500).send({
                        success: false,
                        errors: [{ message: 'Next user not found, nodeId = ' + nodeId }],
                        data: null
                    });
                }
            }

            function getExchangeItem(err, result) {
                if (err) {
                    err = JSON.parse(JSON.stringify(err).replace("\"sqlMessage\":", "\"message\":"));
                    return res.status(500).send({
                        success: false,
                        errors: [err],
                        data: null
                    });
                }

                if (result.length > 0) {
                    exchangeItem = {
                        id: result[0].id,
                        name: result[0].itemName,
                        description: result[0].itemDescription,
                        photoUrl: result[0].itemPhoto,
                        priceCategory: result[0].itemPriceCategory,
                        category: result[0].itemCategory
                    }

                    matches.push({
                        id: currentNode,
                        myItem: myItem,
                        exchangeItem: exchangeItem,
                        toWho: toWho,
                        fromWho: fromWho
                    })

                    if (index == array.length - 1) {
                        return res.status(200).send({
                            success: true,
                            errors: null,
                            data: { matches: matches }
                        })
                    }
                } else {
                    return res.status(500).send({
                        success: false,
                        errors: [{ message: 'Next user not found, nodeId = ' + nodeId }],
                        data: null
                    });
                }
            }
        }
    })
};

exports.get_all_matches = (req, res) => {
    db.conn.query("SELECT * FROM chains WHERE userId = ?", req.jwt.userId, (err, result) => {
        if (err) {
            err = JSON.parse(JSON.stringify(err).replace("\"sqlMessage\":", "\"message\":"));
            return res.status(500).send({
                success: false,
                errors: [err],
                data: null
            });
        }

        var matches = []

        if (result.length == 0) {
            return res.status(200).send({
                success: true,
                errors: null,
                data: { matches: matches }
            })
        } else {
            result.forEach(handleNode)
        }

        function handleNode(row, index, array) {
            var nodeId = row.id
            var myItemId = row.myItemId
            var prevNode = row.prevNodeId
            var nextNode = row.nextNodeId
            var status = row.chainStatus
            var myItem
            var toWho
            var fromWho
            var exchangeItem

            db.conn.query("SELECT * FROM items WHERE id = ?", myItemId, getItemData)
            function getItemData(err, result) {
                if (err) {
                    err = JSON.parse(JSON.stringify(err).replace("\"sqlMessage\":", "\"message\":"));
                    return res.status(500).send({
                        success: false,
                        errors: [err],
                        data: null
                    });
                }

                if (result.length > 0) {
                    myItem = {
                        id: myItemId,
                        name: result[0].itemName,
                        description: result[0].itemDescription,
                        photoUrl: result[0].itemPhoto,
                        priceCategory: result[0].itemPriceCategory,
                        category: result[0].itemCategory
                    }

                    db.conn.query("SELECT * FROM users WHERE id IN (SELECT userId FROM chains WHERE id = ?)", nextNode, getNextPerson)
                } else {
                    return res.status(500).send({
                        success: false,
                        errors: [{ message: 'Item of id ' + myItemId + ' for ' + nodeId + ' node not found' }],
                        data: null
                    });
                }
            }

            function getNextPerson(err, result) {
                if (err) {
                    err = JSON.parse(JSON.stringify(err).replace("\"sqlMessage\":", "\"message\":"));
                    return res.status(500).send({
                        success: false,
                        errors: [err],
                        data: null
                    });
                }

                if (result.length > 0) {
                    toWho = {
                        id: result[0].id,
                        name: result[0].userName,
                        email: result[0].userEmail,
                        phone: result[0].userPhone
                    }

                    db.conn.query("SELECT * FROM users WHERE id IN (SELECT userId FROM chains WHERE id = ?)", prevNode, getPrevPerson)
                } else {
                    return res.status(500).send({
                        success: false,
                        errors: [{ message: 'Next user not found, nodeId = ' + nodeId }],
                        data: null
                    });
                }
            }

            function getPrevPerson(err, result) {
                if (err) {
                    err = JSON.parse(JSON.stringify(err).replace("\"sqlMessage\":", "\"message\":"));
                    return res.status(500).send({
                        success: false,
                        errors: [err],
                        data: null
                    });
                }

                if (result.length > 0) {
                    fromWho = {
                        id: result[0].id,
                        name: result[0].userName,
                        email: result[0].userEmail,
                        phone: result[0].userPhone
                    }

                    db.conn.query("SELECT * FROM items WHERE id IN (SELECT myItemId FROM chains WHERE id = ?)", prevNode, getExchangeItem)
                } else {
                    return res.status(500).send({
                        success: false,
                        errors: [{ message: 'Next user not found, nodeId = ' + nodeId }],
                        data: null
                    });
                }
            }

            function getExchangeItem(err, result) {
                if (err) {
                    err = JSON.parse(JSON.stringify(err).replace("\"sqlMessage\":", "\"message\":"));
                    return res.status(500).send({
                        success: false,
                        errors: [err],
                        data: null
                    });
                }

                if (result.length > 0) {
                    exchangeItem = {
                        id: result[0].id,
                        name: result[0].itemName,
                        description: result[0].itemDescription,
                        photoUrl: result[0].itemPhoto,
                        priceCategory: result[0].itemPriceCategory,
                        category: result[0].itemCategory
                    }

                    matches.push({
                        id: nodeId,
                        status: status,
                        myItem: myItem,
                        exchangeItem: exchangeItem,
                        toWho: toWho,
                        fromWho: fromWho
                    })

                    if (index == array.length - 1) {
                        return res.status(200).send({
                            success: true,
                            errors: null,
                            data: { matches: matches }
                        })
                    }
                } else {
                    return res.status(500).send({
                        success: false,
                        errors: [{ message: 'Next user not found, nodeId = ' + nodeId }],
                        data: null
                    });
                }
            }
        }
    })
};
