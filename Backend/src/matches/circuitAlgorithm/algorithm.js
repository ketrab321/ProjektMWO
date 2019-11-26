"use strict";
exports.__esModule = true;
var Edge = /** @class */ (function () {
    function Edge() {
    }
    return Edge;
}());
function unstack(edge, stack) {
    stack = stack.filter(function (item) { return item.id != edge.id; });
}
function unstackFrom(index, stack) {
    var result = stack.splice(index, stack.length - index);
    return result;
}
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
    AlgorithmManager.prototype.loadGraph = function (newGraph) {
        this.adjacencyStructure = newGraph;
    };
    AlgorithmManager.prototype.startAlgorithm = function (startVerticle, circuitLength) {
        // this.myStack = new Array<Edge>();
        // this.b = new Map<number, Array<number>>();
        // this.blocked = new Map<number, boolean>();
        // this.taken = new Map<number, State>();
        // console.log("CIRCUIT 1: ")
        // this.circuit(startVerticle, startVerticle, circuitLength);
        this.myStack = new Array();
        this.b = new Map();
        this.blocked = new Map();
        this.taken = new Map();
        console.log("CIRCUIT 2: ");
        this.circuit2(1, circuitLength);
    };
    AlgorithmManager.prototype.cutOut = function (tail) {
        var _this = this;
        tail.forEach(function (item) {
            var temp = _this.adjacencyStructure.get(item.from);
            temp = temp.filter(function (edge) {
                return edge.id !== item.id;
            });
            _this.adjacencyStructure.set(item.from, temp);
        });
    };
    AlgorithmManager.prototype.circuit2 = function (v, circuitLength) {
        var _this = this;
        var f = false;
        this.blocked.set(v, true);
        var Av = this.adjacencyStructure.get(v);
        Av.forEach(function (edge) {
            if (_this.taken.get(v) === State.Taken) {
                return f;
            }
            _this.myStack.push(edge);
            var temp = _this.intersects(edge, circuitLength);
            if (temp.intersects) {
                f = true;
                console.log("\ncircuit");
                console.log(temp.circuit);
                _this.cutOut(temp.circuit);
                _this.myStack.pop();
                return f;
            }
            if (!_this.blocked.get(edge.to)) {
                if (_this.circuit2(edge.to, circuitLength)) {
                    f = true;
                    _this.myStack.pop();
                    return f;
                }
            }
            _this.myStack.pop();
        });
        this.unblock(v);
        return f;
    };
    AlgorithmManager.prototype.intersects = function (edge, circuitLength) {
        var tail = this.myStack.slice((-1) * circuitLength + 1);
        var index = tail.findIndex(function (item) {
            return item.from === edge.to;
        });
        if (index >= 0) {
            var circuit = tail; //unstackFrom(index, tail);
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
    AlgorithmManager.prototype.circuit = function (v, startVerticle, circuitLength) {
        var _this = this;
        var f = false;
        this.blocked.set(v, true);
        var Av = this.adjacencyStructure.get(v);
        if (Av == undefined) {
            return false;
        }
        Av.forEach(function (edge) {
            _this.stack(edge);
            if (edge.to == startVerticle && _this.myStack.length <= circuitLength && _this.myStack.length > 1) {
                _this.circuitFound(v);
                f = true;
                return f;
            }
            else if (!_this.blocked.get(edge.to)) {
                if (_this.circuit(edge.to, startVerticle, circuitLength)) {
                    f = true;
                    return f;
                }
            }
            _this.unstack(edge);
        });
        this.unblock(v);
        // else{
        //     let Av2 = this.adjacencyStructure.get(v);
        //     Av2.forEach(edge => {
        //         let bArray = this.b.get(edge.verticle)
        //         if(bArray.includes(v)){
        //             bArray.push(v)
        //         }
        //     })
        // }
        return f;
    };
    AlgorithmManager.prototype.block = function (u) {
        this.blocked.set(u, true);
    };
    AlgorithmManager.prototype.stack = function (v) {
        this.myStack.push(v);
    };
    AlgorithmManager.prototype.unstack = function (v) {
        unstack(v, this.myStack);
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
    AlgorithmManager.prototype.circuitFound = function (startVerticle) {
        console.log("circuit: ", startVerticle);
        // console.log(this.myStack.stack)
        console.log(this.myStack);
        this.myStack = new Array();
    };
    return AlgorithmManager;
}());
function staryAlgortihm() {
    var algorithmManager = new AlgorithmManager();
    algorithmManager.loadGraph(generateDummyData(2000, 1999));
    algorithmManager.startAlgorithm(1, 6);
}
exports.staryAlgortihm = staryAlgortihm;
function test() {
}
exports.test = test;
function dummyData() {
    var dummyData = new Map();
    dummyData.set(1, [{ id: "12", to: 2, from: 1 }, { id: "15", to: 5, from: 1 }]);
    dummyData.set(2, [{ id: "23", to: 3, from: 2 }, { id: "25", to: 5, from: 2 }]);
    dummyData.set(3, [{ id: "31", to: 1, from: 3 }]);
    dummyData.set(4, [{ id: "41", to: 1, from: 4 }, { id: "45", to: 5, from: 4 }]);
    dummyData.set(5, [{ id: "51", to: 1, from: 5 }, { id: "54", to: 4, from: 5 }]);
    return dummyData;
}
function generateDummyData(n, edgesPerVerticle) {
    var dummyData = new Map();
    for (var i = 1; i <= n; i++) {
        var array = [];
        var temp = i;
        for (var j = 1; j < edgesPerVerticle; j++) {
            var randNumber = (temp + j) % n + 1;
            array.push({ id: "" + randNumber + i, to: randNumber, from: i });
        }
        dummyData.set(i, array);
    }
    //console.log(dummyData)
    return dummyData;
}
staryAlgortihm();
