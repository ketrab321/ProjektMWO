
const db = require('../../main');

var circuitCount = 0;
var endges = 0;
class Edge{
    from: number;
    to: number;
    id: number;
    toItem: number;
}

enum State {
    Taken, Blocked, Free
}

class AlgorithmManager{
    public myStack: Array<Edge>;
    public adjacencyStructure: Map<number, Array<Edge>>;
    public blocked: Map<number, boolean>;
    public b: Map<number, Array<number>>;
    public taken: Map<number, State>;
    public edgeTaken: Map<number, boolean>;

    constructor(){
        this.myStack = new Array<Edge>(); 
        this.adjacencyStructure = new Map<number, Array<Edge>>();
        this.b = new Map<number, Array<number>>();
        this.blocked = new Map<number, boolean>();
    }

    public unstackFrom(index: number, stack: Array<Edge>){
        let result = []
        for(let i = 0; i < stack.length; i++){
            if(i >= index){
                result.push(stack[i])
                this.edgeTaken.set(stack[i].id, true);
            }
        }
        return result
    }
    public loadGraph(newGraph: Map<number, Array<Edge>>){
        this.adjacencyStructure = newGraph;
        this.taken = new Map<number, State>();
        this.edgeTaken = new Map<number, boolean>();
    }

    public startAlgorithm(startVerticle: number, circuitLength: number){

        this.myStack = new Array<Edge>();
        this.b = new Map<number, Array<number>>();
        this.blocked = new Map<number, boolean>();
        
        this.circuit(startVerticle, circuitLength);
    }

    public circuit(v: number, circuitLength: number): number{
        let f = -2;
        let Av = this.adjacencyStructure.get(v);
        if(Av == undefined)
        {
            return f;
        }
        this.blocked.set(v, true);

        for(let i = 0; i < Av.length; i++)
        {
            let edge = Av[i];
            if(!this.edgeTaken.get(edge.id))
            {
                this.myStack.push(edge);
                let temp = this.intersects(edge, circuitLength);

                if( temp.intersects ){
                    f= temp.circuit.length - 1;    
                    this.myStack.pop()
                    this.unblock(v);
                    this.circuitFound(temp.circuit);
                    return f;
                }
                if(!this.blocked.get(edge.to)){
                f = this.circuit(edge.to, circuitLength)
                    if(f > 0)
                    {
                        f--;
                        this.myStack.pop()
                        this.unblock(v);

                        return f;
                    }
                    else if(f === -2)
                    {
                        this.edgeTaken.set(edge.id, true);
                    }
                    else
                    {
                        f = -1;
                    }
                }
                this.myStack.pop()

            }
        };
        this.unblock(v);

        return f;
    }

    public intersects(edge: Edge, circuitLength): { intersects: boolean, circuit: Array<Edge>}{
        let tail = this.myStack.slice((-1)*circuitLength + 1)
        let index = tail.findIndex((item)=> {
            return item.from === edge.to;
        })
        if(index >= 0){
            let circuit = this.unstackFrom(index, tail);
            return {
                intersects: true,
                circuit: circuit
            }
        }
        else
        {
            return {
                intersects: false,
                circuit: undefined
            }
        }
    }

    public circuitFound(circuit: Array<Edge>){
        let user_dbId = new Map<number, number>();
        circuitCount++;
        endges+=circuit.length;
        db.conn.beginTransaction(function(err) {
            if(err){
                console.log(err);
            }
            else
            {
                let queryPromises = [];
                for(let i = 0; i < circuit.length; i++)
                {
                    let edge = circuit[i];
                    let queryPromise = new Promise((resolve ,reject)=>{
                        db.conn.query('INSERT INTO mwo.chains (userId, myItemId, chainStatus) VALUES ?', [[edge.to, edge.toItem, "PENDING"]], function(error, res){
                            if(error){
                                console.log(error);
                                return reject(err);
                            }
                            else if(res){
                                user_dbId.set(edge.to, res.insertId);
                                return resolve();
                            }
                        })
                    });
                    queryPromises.push(queryPromise);
                }
                Promise.all(queryPromises).then(()=>{
                    console.log(user_dbId);
                    let updatePromises = [];
                    let users = Array.from(user_dbId.keys());
                    let max = users.length-1;
                    for(let k = 0; k < users.length; k++){
                        let prevIndex = (k-1 >= 0)? k-1 : max;
                        let nextIndex = k %(max+1);
                        updatePromises.push(new Promise((resolve, reject)=>{
                            db.conn.query('UPDATE mwo.chains SET prevNodeId = ?, nextNodeId = ?', [user_dbId.get(users[prevIndex]), user_dbId.get(users[nextIndex])], function(err, res){
                                if(err) return reject(err)
                                else return resolve(res);
                            })
                        }))
                    }
                        
                })
            }
        })
    }
    public unblock(u: number){
        this.blocked.set(u, false);
    
        let bu = this.b.get(u);
        if(bu !== undefined)
        {
            bu.forEach(w => {
                if(this.blocked.get(w)){
                    this.unblock(w);
                }
            })
        }
        
        this.b.set(u, []);
    }
}


export function startAlgortihm(){
    let algorithmManager = new AlgorithmManager()
    let graph = new Map<number, Array<Edge>>()
    let circuitLength = 4;
    db.conn.query("SELECT s.id, s.userId, i.itemUserId, s.itemId FROM mwo.swipes AS s JOIN mwo.items AS i ON s.itemId = i.id WHERE s.wanted = 1", [], (err, result) => {
        //console.log("Result: ", result, " err: ", err);
        let startVerticle = 1;
        if(result && Array.isArray(result) && !err){
            
            startVerticle = result[Math.floor(result.length/2)].userId;
            result.forEach(swipe => {
                
                let temp = graph.get(swipe.userId) || [];
                temp.push({
                    id: swipe.id,
                    to: swipe.itemUserId,
                    from: swipe.userId,
                    toItem: swipe.itemId
                });
                graph.set(swipe.userId, temp)
            })
            //console.log(graph)
            
            algorithmManager.loadGraph(graph);

            startVerticle = result[Math.floor(result.length/2)].userId;
            algorithmManager.startAlgorithm(startVerticle, circuitLength);

            startVerticle = result[result.length-1].userId;
            algorithmManager.startAlgorithm(startVerticle, circuitLength);

            startVerticle = result[0].userId;
            algorithmManager.startAlgorithm(startVerticle, circuitLength);

            startVerticle = result[Math.floor(result.length/3)].userId;
            algorithmManager.startAlgorithm(startVerticle, circuitLength);

            startVerticle = result[Math.floor(2*result.length/3)].userId;
            algorithmManager.startAlgorithm(startVerticle, circuitLength);
            
            console.log("Edges: ");
            console.log(result.length);
            console.log("Circuit count: ");
            console.log(circuitCount);
            console.log("Covered Edges: ")
            console.log(endges)
        }
    })

    // algorithmManager.loadGraph(generateDummyData(10000, 7500));
    // algorithmManager.startAlgorithm(1, 6);

}


function dummyData(){
    let dummyData: Map<number, Array<Edge>> = new Map();

    // dummyData.set(1, [{ id: "12", to: 2, from: 1 }, { id: "18", to: 8, from: 1}, { id: "17", to: 7, from: 1}])
    // dummyData.set(2, [{ id: "23", to: 3, from: 2 }, { id: "24", to: 4, from: 2 }, { id: "25", to: 5, from: 2 }])
    // dummyData.set(3, [{ id: "36", to: 6, from: 3 }])
    // dummyData.set(4, [{ id: "46", to: 6, from: 4 }])
    // dummyData.set(5, [{ id: "56", to: 6, from: 5 }])
    // dummyData.set(6, [{ id: "67", to: 7, from: 6 }, { id: "64", to: 4, from: 6 }, { id: "65", to: 5, from: 6 }])
    // dummyData.set(7, [{ id: "73", to: 3, from: 7 }, { id: "78", to: 8, from: 7}])
    return dummyData;
}

function generateDummyData(n: number, edgesPerVerticle: number){
    let dummyData: Map<number, Array<Edge>> = new Map();

    for(let i = 1; i <= n; i++){
        let array = []
        let temp = i;
        for(let j = 1; j < edgesPerVerticle; j++){
            let randNumber = Math.floor(Math.random() * n)//(temp + j) % n + 1;
            array.push({ id: ""+randNumber + i, to: randNumber, from: i })
        }
        dummyData.set(i, array);
    }

    //console.log(dummyData)
    return dummyData;
}

startAlgortihm();