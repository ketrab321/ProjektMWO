//https://mwo.blob.core.windows.net/images/test.png
const db = require('../../main');
const crypto = require('crypto');

function generateTestData(){
    let user_items = new Map();
    let n = 0;
    let salt = crypto.randomBytes(16).toString('base64');
        let hash = crypto.createHmac('sha512', salt).update("123").digest("base64");
        let password = salt + "$" + hash;

    for(let i = 1; i <= 30; i++)
    {
        
        let data = { userName: 'User'+(i+n), userPassword: password, userEmail: "user"+(i+n)+"@email.com", userPhone: "123 321 123" }
        db.conn.query("INSERT INTO users SET ?", data, (err, result) => {
            //console.log("Result: ", result, " error: ", err)
            if (result && result.affectedRows > 0 && !err) {
                console.log("XD")
                let insert = [];
                for(let j = 1; j <= 10; j++)
                {
                    insert.push(["User" + (i+n) + "-Item"+ j, "User" + (i+n) + "-Item"+ j, "https://mwo.blob.core.windows.net/images/test.png", "TEST", "TEST", result.insertId, 'unmatched']);
                }
                db.conn.query('INSERT INTO mwo.items (itemName, itemDescription, itemPhoto, itemPriceCategory, itemCategory, itemUserId, itemStatus) VALUES ?;',
                                [insert] ,function (err, res, fields) {
                                console.log("Inserted item; ", res); 
                                if (err)
                                    { 
                                        throw err;
                                    }
                                    else {
                                        let temp = [...Array(10).keys()].map(i => i + res.insertId);
                                        user_items.set(result.insertId, temp);
                                    }
                                });
            } 
        })
    }
    setTimeout(()=> {
        console.log(user_items)
        let values = Array.from( user_items.values() );
        values = [].concat(...values);
        let insert = []
        console.log(values);
        user_items.forEach((value, key, map)=>{
            console.log("Key: ", key, " value: ", value);
            let temp = values.filter(item => {
                return !value.includes(item);
            })
            console.log("temp ", temp);
            temp.forEach(item => {
                insert.push([key, item, Math.random() >= 0.2]);
            })
        })

        console.log(insert);
        db.conn.query('INSERT INTO mwo.swipes (userId, itemId, wanted) VALUES ?;',[insert], function (err, res, fields) {
            if (err) throw err;
            else {
                console.log("Swipes ",res)
            }
        });
    
    }, 30000)
    

}


generateTestData();
