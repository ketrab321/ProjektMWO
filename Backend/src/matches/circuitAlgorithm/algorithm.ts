class Edge{
    from: number;
    to: number;
    id: string;
}


    function unstack(edge: Edge, stack: Array<Edge>){
        stack = stack.filter(item => item.id != edge.id)
    }


    function unstackFrom(index: number, stack: Array<Edge>){
        let result = stack.splice(index, stack.length - index);
        return result
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
    public edgeTaken: Map<string, boolean>

    constructor(){
        this.myStack = new Array<Edge>(); 
        this.adjacencyStructure = new Map<number, Array<Edge>>();
        this.b = new Map<number, Array<number>>();
        this.blocked = new Map<number, boolean>();
    }

    public loadGraph(newGraph: Map<number, Array<Edge>>){
        this.adjacencyStructure = newGraph;
    }

    public startAlgorithm(startVerticle: number, circuitLength: number){
        // this.myStack = new Array<Edge>();
        // this.b = new Map<number, Array<number>>();
        // this.blocked = new Map<number, boolean>();
        // this.taken = new Map<number, State>();

        // console.log("CIRCUIT 1: ")
        // this.circuit(startVerticle, startVerticle, circuitLength);

        this.myStack = new Array<Edge>();
        this.b = new Map<number, Array<number>>();
        this.blocked = new Map<number, boolean>();
        this.taken = new Map<number, State>();
        this.edgeTaken = new Map<string, boolean>();
        console.log("CIRCUIT 2: ")
        this.circuit2(1, circuitLength);
        

    }

    public cutOut(tail: Array<Edge>){
        tail.forEach(item => {
            let temp = this.adjacencyStructure.get(item.from)
            temp = temp.filter(edge => {
                return edge.id !== item.id;
            })

            this.adjacencyStructure.set(item.from, temp);
        })
    }
    public circuit2(v: number, circuitLength: number): boolean{
        let f = false;
        this.blocked.set(v, true);

        let Av = this.adjacencyStructure.get(v);
        
        Av.forEach(edge => {

            if(this.taken.get(v) === State.Taken)
            {
                return f;
            }
            this.myStack.push(edge);

            let temp = this.intersects(edge, circuitLength);

            if( temp.intersects ){
                f= true; 
                console.log("\ncircuit")
                console.log(temp.circuit)
                this.cutOut(temp.circuit);
                this.myStack.pop()

                return f;
            }
            if(!this.blocked.get(edge.to)){ 
                if(this.circuit2(edge.to, circuitLength))
                {
                    f = true;
                    this.myStack.pop()
                    return f;
                }
            }
            this.myStack.pop()

        });

        if(!f){
            
        }
        return f;
    }

    public intersects(edge: Edge, circuitLength): { intersects: boolean, circuit: Array<Edge>}{
        let tail = this.myStack.slice((-1)*circuitLength + 1)
        let index = tail.findIndex((item)=> {
            return item.from === edge.to;
        })
        if(index >= 0){
            let circuit = tail//unstackFrom(index, tail);
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
    public circuit(v: number, startVerticle: number, circuitLength: number): boolean{
        let f = false;
        this.blocked.set(v, true);
        let Av = this.adjacencyStructure.get(v);
        if(Av == undefined)
        {

            return false;
        }
        Av.forEach(edge => {
            this.stack(edge);
            if(edge.to == startVerticle && this.myStack.length <= circuitLength && this.myStack.length > 1){
                this.circuitFound(v);
                f= true;
                return f;
            }
            else if(!this.blocked.get(edge.to)){
                
                if(this.circuit(edge.to, startVerticle, circuitLength)){
                    f = true;
                    return f;
                }
            }
            this.unstack(edge)

        })
    
        
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
    }
    
    public block(u: number){
        this.blocked.set(u, true);
    }
    public stack(v: Edge){
        this.myStack.push(v);
    }

    public unstack(v: Edge){
        unstack(v, this.myStack);
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
    
    public circuitFound(startVerticle: number){
        console.log("circuit: ", startVerticle)
       // console.log(this.myStack.stack)
       console.log(this.myStack)
       this.myStack = new Array<Edge>()
    }
    
}


export function staryAlgortihm(){
    let algorithmManager = new AlgorithmManager()

    algorithmManager.loadGraph(generateDummyData(2000, 1999));
    algorithmManager.startAlgorithm(1, 6);
}


export function test(){

}

function dummyData(){
    let dummyData: Map<number, Array<Edge>> = new Map();

    dummyData.set(1, [{ id: "12", to: 2, from: 1 }, { id: "15", to: 5, from: 1 }])
    dummyData.set(2, [{ id: "23", to: 3, from: 2 }, { id: "25", to: 5, from: 2 }])
    dummyData.set(3, [{ id: "31", to: 1, from: 3 }])
    dummyData.set(4, [{ id: "41", to: 1, from: 4 }, { id: "45", to: 5, from: 4 }])
    dummyData.set(5, [{ id: "51", to: 1, from: 5 }, { id: "54", to: 4, from: 5 }])

    return dummyData;
}

function generateDummyData(n: number, edgesPerVerticle: number){
    let dummyData: Map<number, Array<Edge>> = new Map();

    for(let i = 1; i <= n; i++){
        let array = []
        let temp = i;
        for(let j = 1; j < edgesPerVerticle; j++){
            let randNumber = (temp + j) % n + 1;
            array.push({ id: ""+randNumber + i, to: randNumber, from: i })
        }
        dummyData.set(i, array);
    }

    //console.log(dummyData)
    return dummyData;
}
staryAlgortihm();
