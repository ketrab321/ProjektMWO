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
        this.blocked = new Map();
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
    };
    AlgorithmManager.prototype.startAlgorithm = function (startVerticle, circuitLength) {
        this.myStack = new Array();
        this.b = new Map();
        this.blocked = new Map();
        this.circuit(startVerticle, circuitLength);
    };
    AlgorithmManager.prototype.circuit = function (v, circuitLength) {
        var f = -2;
        var Av = this.adjacencyStructure.get(v);
        if (Av == undefined) {
            return f;
        }
        this.blocked.set(v, true);
        for (var i = 0; i < Av.length; i++) {
            var edge = Av[i];
            if (!this.edgeTaken.get(edge.id)) {
                this.myStack.push(edge);
                var temp = this.intersects(edge, circuitLength);
                if (temp.intersects) {
                    f = temp.circuit.length - 1;
                    this.myStack.pop();
                    this.unblock(v);
                    this.circuitFound(temp.circuit);
                    return f;
                }
                if (!this.blocked.get(edge.to)) {
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
        circuitCount++;
        endges += circuit.length;
        console.log("Circuit: ", circuit);
    };
    AlgorithmManager.prototype.unblock = function (u) {
        var _this = this;
        this.blocked.set(u, false);
        var bu = this.b.get(u);
        if (bu !== undefined) {
            bu.forEach(function (w) {
                if (_this.blocked.get(w)) {
                    _this.unblock(w);
                }
            });
        }
        this.b.set(u, []);
    };
    return AlgorithmManager;
}());
function startAlgortihm() {
    var algorithmManager = new AlgorithmManager();
    var graph = new Map();
    var circuitLength = 4;
    db.conn.query("SELECT s.id, s.userId, i.itemUserId, s.itemId FROM mwo.swipes AS s JOIN mwo.items AS i ON s.itemId = i.id WHERE s.wanted = 1", [], function (err, result) {
        //console.log("Result: ", result, " err: ", err);
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
            //console.log(graph)
            algorithmManager.loadGraph(graph);
            startVerticle = result[Math.floor(result.length / 2)].userId;
            algorithmManager.startAlgorithm(startVerticle, circuitLength);
            startVerticle = result[result.length - 1].userId;
            algorithmManager.startAlgorithm(startVerticle, circuitLength);
            startVerticle = result[0].userId;
            algorithmManager.startAlgorithm(startVerticle, circuitLength);
            startVerticle = result[Math.floor(result.length / 3)].userId;
            algorithmManager.startAlgorithm(startVerticle, circuitLength);
            startVerticle = result[Math.floor(2 * result.length / 3)].userId;
            algorithmManager.startAlgorithm(startVerticle, circuitLength);
            console.log("Edges: ");
            console.log(result.length);
            console.log("Circuit count: ");
            console.log(circuitCount);
            console.log("Covered Edges: ");
            console.log(endges);
        }
    });
    // algorithmManager.loadGraph(generateDummyData(10000, 7500));
    // algorithmManager.startAlgorithm(1, 6);
}
exports.startAlgortihm = startAlgortihm;
function dummyData() {
    var dummyData = new Map();
    // dummyData.set(1, [{ id: "12", to: 2, from: 1 }, { id: "18", to: 8, from: 1}, { id: "17", to: 7, from: 1}])
    // dummyData.set(2, [{ id: "23", to: 3, from: 2 }, { id: "24", to: 4, from: 2 }, { id: "25", to: 5, from: 2 }])
    // dummyData.set(3, [{ id: "36", to: 6, from: 3 }])
    // dummyData.set(4, [{ id: "46", to: 6, from: 4 }])
    // dummyData.set(5, [{ id: "56", to: 6, from: 5 }])
    // dummyData.set(6, [{ id: "67", to: 7, from: 6 }, { id: "64", to: 4, from: 6 }, { id: "65", to: 5, from: 6 }])
    // dummyData.set(7, [{ id: "73", to: 3, from: 7 }, { id: "78", to: 8, from: 7}])
    return dummyData;
}
function generateDummyData(n, edgesPerVerticle) {
    var dummyData = new Map();
    for (var i = 1; i <= n; i++) {
        var array = [];
        var temp = i;
        for (var j = 1; j < edgesPerVerticle; j++) {
            var randNumber = Math.floor(Math.random() * n); //(temp + j) % n + 1;
            array.push({ id: "" + randNumber + i, to: randNumber, from: i });
        }
        dummyData.set(i, array);
    }
    //console.log(dummyData)
    return dummyData;
}
startAlgortihm();
