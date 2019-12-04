
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
    public blockedVerticle: Map<number, boolean>;
    public blockedItem: Map<number, boolean>;
    public b: Map<number, Array<number>>;
    public taken: Map<number, State>;
    public edgeTaken: Map<number, boolean>;

    constructor(){
        this.myStack = new Array<Edge>(); 
        this.adjacencyStructure = new Map<number, Array<Edge>>();
        this.b = new Map<number, Array<number>>();
        this.blockedVerticle = new Map<number, boolean>();
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
        this.blockedItem = new Map<number, boolean>();

    }

    public startAlgorithm(startVerticle: number, circuitLength: number){

        this.myStack = new Array<Edge>();
        this.b = new Map<number, Array<number>>();
        this.blockedVerticle = new Map<number, boolean>();
        
        this.circuit(startVerticle, circuitLength);
    }

    public circuit(v: number, circuitLength: number): number{
        let f = -2;
        let Av = this.adjacencyStructure.get(v);
        if(Av == undefined)
        {
            return f;
        }
        this.blockedVerticle.set(v, true);

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
                    // if(circuitCount<10)
                        this.circuitFound(temp.circuit);
                    
                    
                    return f;
                }
                if(!this.blockedVerticle.get(edge.to) && !this.blockedItem.get(edge.toItem)){
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
        let taken = false;
        circuit.forEach(edge => {
            taken = taken || this.blockedItem.get(edge.toItem);
            this.blockedItem.set(edge.toItem, true);
        })
        if(!taken)
        {
            db.conn.beginTransaction(function(err) {
                if(err){
                    console.log(err);

                    db.conn.rollback(function(){
                        console.log(err);
                    })
                }
                else
                {
                    let queryPromises = [];
                    for(let i = 0; i < circuit.length; i++)
                    {
                        let edge = circuit[i];
                        
                        let queryPromise = new Promise((resolve ,reject)=>{
                            db.conn.query('INSERT INTO mwo.chains (userId, myItemId, chainStatus) VALUES (?, ?, ?)', [edge.to, edge.toItem, "PENDING"], function(error, res){
                                if(error){
                                    console.log(error);

                                    db.conn.rollback(function(){
                                        console.log(err);
                                    })
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
                        let updatePromises: Promise<any>[] = [];
                        let users = Array.from(user_dbId.keys());
                        let max = users.length-1;
                        for(let k = 0; k < users.length; k++){
                            let prevIndex = (k-1 >= 0)? k-1 : max;
                            let nextIndex = (k+1) %(max+1);
                            console.log("k= ",k," prev = ", prevIndex, " next = ", nextIndex, " users[k] = ", users[k], " users[prev] = ", users[prevIndex]," users[next] = ", users[nextIndex], " id users[prev] = ", user_dbId.get(users[prevIndex]), " id users[next] = ", user_dbId.get(users[nextIndex])," id users[k] = ", user_dbId.get(users[k]));
                            updatePromises.push(new Promise((resolve, reject)=>{
                                db.conn.query('UPDATE mwo.chains SET prevNodeId = ?, nextNodeId = ? WHERE id = ?', [user_dbId.get(users[prevIndex]), user_dbId.get(users[nextIndex]), user_dbId.get(users[k])], function(err, res){
                                    if(err) {
                                        console.log(err);

                                        db.conn.rollback(function(){
                                        })
                                    }
                                    else return resolve(res);
                                })
                            }))
                        }
                        return updatePromises;
                    }).then(promisesArray => {
                        return Promise.all(promisesArray);
                    }).then(response => {
                    })
                }
                db.conn.commit(function(err){
                    if(err){
                        console.log(err);

                        db.conn.rollback(function(){
                            console.log(err);
                        })
                    }
                    else{
                    }
                })
            })
        }
    }
    public unblock(u: number){
        this.blockedVerticle.set(u, false);
    
        let bu = this.b.get(u);
        if(bu !== undefined)
        {
            bu.forEach(w => {
                if(this.blockedVerticle.get(w)){
                    this.unblock(w);
                }
            })
        }
        
        this.b.set(u, []);
    }
}


export function startAlgorithm(){
    let algorithmManager = new AlgorithmManager()
    let graph = new Map<number, Array<Edge>>()
    let circuitLength = 4;
    db.conn.query("SELECT s.id, s.userId, i.itemUserId, s.itemId FROM mwo.swipes AS s JOIN mwo.items AS i ON s.itemId = i.id LEFT JOIN mwo.chains AS c ON i.id = c.myItemId WHERE s.wanted = 1 AND c.id IS NULL", [], (err, result) => {
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
            
            algorithmManager.loadGraph(graph);

            startVerticle = result[result.length-1].userId;
            algorithmManager.startAlgorithm(startVerticle, circuitLength);

            startVerticle = result[0].userId;
            algorithmManager.startAlgorithm(startVerticle, circuitLength);

            startVerticle = result[Math.floor(Math.random()*(result.length-1))].userId;
            algorithmManager.startAlgorithm(startVerticle, circuitLength);
            
            startVerticle = result[Math.floor(Math.random()*(result.length-1))].userId;
            algorithmManager.startAlgorithm(startVerticle, circuitLength);

            startVerticle = result[Math.floor(Math.random()*(result.length-1))].userId;
            algorithmManager.startAlgorithm(startVerticle, circuitLength);
            
            console.log("Edges: ", result.length);
            console.log("Circuits: ", circuitCount);
            console.log("Edges covered: ", endges);
        }
    })


}
