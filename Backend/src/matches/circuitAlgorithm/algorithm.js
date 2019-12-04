"use strict";
exports.__esModule = true;
var db = require('../../main');
var circuitCount = 0;
var endges = 0;
var Edge = /** @class */ (function () {
    function Edge() {
    }
    return Edge;
}());
var State;
(function (State) {
    State[State["Taken"] = 0] = "Taken";
    State[State["Blocked"] = 1] = "Blocked";
    State[State["Free"] = 2] = "Free";
})(State || (State = {}));
var AlgorithmManager = /** @class */ (function () {
    function AlgorithmManager() {
        this.myStack = new Array();
        this.adjacencyStructure = new Map();
        this.b = new Map();
        this.blockedVerticle = new Map();
    }
    AlgorithmManager.prototype.unstackFrom = function (index, stack) {
        var result = [];
        for (var i = 0; i < stack.length; i++) {
            if (i >= index) {
                result.push(stack[i]);
                this.edgeTaken.set(stack[i].id, true);
            }
        }
        return result;
    };
    AlgorithmManager.prototype.loadGraph = function (newGraph) {
        this.adjacencyStructure = newGraph;
        this.taken = new Map();
        this.edgeTaken = new Map();
        this.blockedItem = new Map();
    };
    AlgorithmManager.prototype.startAlgorithm = function (startVerticle, circuitLength) {
        this.myStack = new Array();
        this.b = new Map();
        this.blockedVerticle = new Map();
        this.circuit(startVerticle, circuitLength);
    };
    AlgorithmManager.prototype.circuit = function (v, circuitLength) {
        var f = -2;
        var Av = this.adjacencyStructure.get(v);
        if (Av == undefined) {
            return f;
        }
        this.blockedVerticle.set(v, true);
        for (var i = 0; i < Av.length; i++) {
            var edge = Av[i];
            if (!this.edgeTaken.get(edge.id)) {
                this.myStack.push(edge);
                var temp = this.intersects(edge, circuitLength);
                if (temp.intersects) {
                    f = temp.circuit.length - 1;
                    this.myStack.pop();
                    this.unblock(v);
                    // if(circuitCount<10)
                    this.circuitFound(temp.circuit);
                    return f;
                }
                if (!this.blockedVerticle.get(edge.to) && !this.blockedItem.get(edge.toItem)) {
                    f = this.circuit(edge.to, circuitLength);
                    if (f > 0) {
                        f--;
                        this.myStack.pop();
                        this.unblock(v);
                        return f;
                    }
                    else if (f === -2) {
                        this.edgeTaken.set(edge.id, true);
                    }
                    else {
                        f = -1;
                    }
                }
                this.myStack.pop();
            }
        }
        ;
        this.unblock(v);
        return f;
    };
    AlgorithmManager.prototype.intersects = function (edge, circuitLength) {
        var tail = this.myStack.slice((-1) * circuitLength + 1);
        var index = tail.findIndex(function (item) {
            return item.from === edge.to;
        });
        if (index >= 0) {
            var circuit = this.unstackFrom(index, tail);
            return {
                intersects: true,
                circuit: circuit
            };
        }
        else {
            return {
                intersects: false,
                circuit: undefined
            };
        }
    };
    AlgorithmManager.prototype.circuitFound = function (circuit) {
        var _this = this;
        var user_dbId = new Map();
        circuitCount++;
        endges += circuit.length;
        var taken = false;
        circuit.forEach(function (edge) {
            taken = taken || _this.blockedItem.get(edge.toItem);
            _this.blockedItem.set(edge.toItem, true);
        });
        if (!taken) {
            db.conn.beginTransaction(function (err) {
                if (err) {
                    console.log(err);
                    db.conn.rollback(function () {
                        console.log(err);
                    });
                }
                else {
                    var queryPromises = [];
                    var _loop_1 = function (i) {
                        var edge = circuit[i];
                        var queryPromise = new Promise(function (resolve, reject) {
                            db.conn.query('INSERT INTO mwo.chains (userId, myItemId, chainStatus) VALUES (?, ?, ?)', [edge.to, edge.toItem, "PENDING"], function (error, res) {
                                if (error) {
                                    console.log(error);
                                    db.conn.rollback(function () {
                                        console.log(err);
                                    });
                                }
                                else if (res) {
                                    user_dbId.set(edge.to, res.insertId);
                                    return resolve();
                                }
                            });
                        });
                        queryPromises.push(queryPromise);
                    };
                    for (var i = 0; i < circuit.length; i++) {
                        _loop_1(i);
                    }
                    Promise.all(queryPromises).then(function () {
                        var updatePromises = [];
                        var users = Array.from(user_dbId.keys());
                        var max = users.length - 1;
                        var _loop_2 = function (k) {
                            var prevIndex = (k - 1 >= 0) ? k - 1 : max;
                            var nextIndex = (k + 1) % (max + 1);
                            console.log("k= ", k, " prev = ", prevIndex, " next = ", nextIndex, " users[k] = ", users[k], " users[prev] = ", users[prevIndex], " users[next] = ", users[nextIndex], " id users[prev] = ", user_dbId.get(users[prevIndex]), " id users[next] = ", user_dbId.get(users[nextIndex]), " id users[k] = ", user_dbId.get(users[k]));
                            updatePromises.push(new Promise(function (resolve, reject) {
                                db.conn.query('UPDATE mwo.chains SET prevNodeId = ?, nextNodeId = ? WHERE id = ?', [user_dbId.get(users[prevIndex]), user_dbId.get(users[nextIndex]), user_dbId.get(users[k])], function (err, res) {
                                    if (err) {
                                        console.log(err);
                                        db.conn.rollback(function () {
                                        });
                                    }
                                    else
                                        return resolve(res);
                                });
                            }));
                        };
                        for (var k = 0; k < users.length; k++) {
                            _loop_2(k);
                        }
                        return updatePromises;
                    }).then(function (promisesArray) {
                        return Promise.all(promisesArray);
                    }).then(function (response) {
                    });
                }
                db.conn.commit(function (err) {
                    if (err) {
                        console.log(err);
                        db.conn.rollback(function () {
                            console.log(err);
                        });
                    }
                    else {
                    }
                });
            });
        }
    };
    AlgorithmManager.prototype.unblock = function (u) {
        var _this = this;
        this.blockedVerticle.set(u, false);
        var bu = this.b.get(u);
        if (bu !== undefined) {
            bu.forEach(function (w) {
                if (_this.blockedVerticle.get(w)) {
                    _this.unblock(w);
                }
            });
        }
        this.b.set(u, []);
    };
    return AlgorithmManager;
}());
var logs = [];
logs.push({
    info: "this is logs for circuit finding algorithm"
});
function startAlgorithm() {
    var algorithmManager = new AlgorithmManager();
    var graph = new Map();
    var circuitLength = 4;
    db.conn.query("SELECT s.id, s.userId, i.itemUserId, s.itemId FROM mwo.swipes AS s JOIN mwo.items AS i ON s.itemId = i.id LEFT JOIN mwo.chains AS c ON i.id = c.myItemId WHERE s.wanted = 1 AND c.id IS NULL", [], function (err, result) {
        var startVerticle = 1;
        if (result && Array.isArray(result) && !err) {
            startVerticle = result[Math.floor(result.length / 2)].userId;
            result.forEach(function (swipe) {
                var temp = graph.get(swipe.userId) || [];
                temp.push({
                    id: swipe.id,
                    to: swipe.itemUserId,
                    from: swipe.userId,
                    toItem: swipe.itemId
                });
                graph.set(swipe.userId, temp);
            });
            algorithmManager.loadGraph(graph);
            startVerticle = result[result.length - 1].userId;
            algorithmManager.startAlgorithm(startVerticle, circuitLength);
            startVerticle = result[0].userId;
            algorithmManager.startAlgorithm(startVerticle, circuitLength);
            startVerticle = result[Math.floor(Math.random() * (result.length - 1))].userId;
            algorithmManager.startAlgorithm(startVerticle, circuitLength);
            startVerticle = result[Math.floor(Math.random() * (result.length - 1))].userId;
            algorithmManager.startAlgorithm(startVerticle, circuitLength);
            startVerticle = result[Math.floor(Math.random() * (result.length - 1))].userId;
            algorithmManager.startAlgorithm(startVerticle, circuitLength);
            console.log("Edges: ", result.length);
            console.log("Circuits: ", circuitCount);
            console.log("Edges covered: ", endges);
            logs.push({
                time: Date.now(),
                edges: result.length,
                circuits: circuitCount,
                edgesCovered: endges
            });
            circuitCount = 0;
            endges = 0;
        }
    });
}
exports.startAlgorithm = startAlgorithm;
module.exports.logs = logs;
