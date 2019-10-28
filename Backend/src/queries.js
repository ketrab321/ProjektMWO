const mysql = require('mysql');

var config =
{
    host: 'mwodb.mysql.database.azure.com',
    user: 'mwodbadmin@mwodb',
    password: 'mwo123$%^',
    database: 'mwo',
    port: 3306,
    ssl: true
};
const conn = new mysql.createConnection(config);

const addItem = (fields) =>
{
    conn.connect(
        function (err) { 
        if (err) { 
            console.log("!!! Cannot connect !!! Error:");
            throw err;
        }
        else
        {
           let item = {};
            fields.forEach(element => {
                if(element.name && element.name === "name"){
                    item['name'] = element.value;
                }
                if(element.name && element.name === "description"){
                    item['description'] = element.value;
                }
                if(element.name && element.name === "photo"){
                    item['photo'] = element.value;
                }
                if(element.name && element.name === "priceCategory"){
                    item['priceCategory'] = element.value;
                }
                if(element.name && element.name === "category"){
                    item['category'] = element.value;
                }
            });
            conn.end(function (err) { 
                if (err) throw err;
                else  console.log('Closing connection.') 
            })

        //     conn.query('INSERT INTO mwo.items (name, quantity) VALUES (?, ?);', ['banana', 150], 
        //     function (err, results, fields) {
        //         if (err) throw err;
        //     else console.log('Inserted ' + results.affectedRows + ' row(s).');
        // })
        }   
    });
    
}

const addUser = (fields) =>
{
    conn.connect(
        function (err) { 
        if (err) { 
            console.log("!!! Cannot connect !!! Error:");
            throw err;
        }
        else
        {
            console.log("Connection established!")
           let user = fields
            console.log(user);
            conn.end(function (err) { 
                if (err) throw err;
                else  console.log('Closing connection.') 
            })
        }
    })
}

module.exports = {
    addItem: addItem,
    addUser: addUser
}