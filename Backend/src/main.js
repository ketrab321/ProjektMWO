const express = require('express');
const bodyParser = require("body-parser");
const formidable = require('formidable');
const getStream = require('into-stream');
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
// conn.connect(
//     function (err) {
//     if (err) {
//         console.log("!!! Cannot connect !!! Error:");
//         throw err;
//     }
//     else
//     {
//         console.log("Connection extablished")
//     }       
// })
module.exports.conn = conn;
const UsersController = require('./users/controller');
const AuthMiddleware = require('./auth/middleware');
const AuthController = require('./auth/controller');
const ItemsController = require('./items/controller');

const port = process.env.PORT || 3000;

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static('public'));


//#######################################
//######### ITEMS ENDPOINTS #############
//#######################################

app.post('/test',(req, res)=>{
    let response = {
        headers: req.headers,
        url: req.originalUrl,
        body: req.body,
    }
    res.send(response);
})

app.get('/items/get-rand-item',(req, res)=>{
    
    let response = {
        success: "true",
        errors: null,
        data: {
            itemId: "1",
            name: "Zbigniew Stonoga",
            description: "...",
            photoUrl: "https://www.google.com/url?sa=i&source=images&cd=&ved=2ahUKEwiVuP3QuKHlAhVl7aYKHdZKDbAQjRx6BAgBEAQ&url=https%3A%2F%2Fnoizz.pl%2Fzbigniew-stonoga-niezadowolony-z-wynikow-wyborow-naublizal-polakom-a-potem-przeprosil%2Fxhdj5tf&psig=AOvVaw17fJSy_o4Ax9QzaAg7cyk5&ust=1571338075221027",
            priceCategory: "100-200",
            category: "Kategoria"
        }
    };
    res.send(response);
});

app.get('/items/get-user-items',(req, res)=>{
        let response = {
            success: "true",
            errors: null,
            data: [
                {
                    itemId: "1",
                    name: "Zbigniew Stonoga",
                    description: "...",
                    photoUrl: "https://www.google.com/url?sa=i&source=images&cd=&ved=2ahUKEwiVuP3QuKHlAhVl7aYKHdZKDbAQjRx6BAgBEAQ&url=https%3A%2F%2Fnoizz.pl%2Fzbigniew-stonoga-niezadowolony-z-wynikow-wyborow-naublizal-polakom-a-potem-przeprosil%2Fxhdj5tf&psig=AOvVaw17fJSy_o4Ax9QzaAg7cyk5&ust=1571338075221027",
                    priceCategory: "100-200",
                    category: "Kategoria"
                },
                {
                    itemId: "2",
                    name: "Andrzej Duda",
                    description: "...",
                    photoUrl: "http://www.paczaj.eu/upload/images/large/2017/07/podajcie_prosze_parasol_andrzej_duda_2017-07-18_18-00-10.jpg",
                    priceCategory: "300-500",
                    category: "Kategoria: Polityka"
                },
                {
                    itemId: "3",
                    name: "Chuck Norris",
                    description: "Chuck Norris potrafi trzasnąć obrotowymia drzwiami",
                    photoUrl: "http://dzikabanda.pl/wp-content/uploads/Chuck-04-DB-450x400.jpg",
                    priceCategory: "1000000<",
                    category: "Kategoria: Film"
                },
            ]
        };
        res.send(response);
    
});

app.post('/items/add',[
    AuthMiddleware.isJWTValid,
    ItemsController.add
]);


app.post('/items/delete',(req, res)=>{
    new formidable.IncomingForm().parse(req, (err, fields, files) => {
        if (err) {
          throw err
        }
        let response = {
            _metadata: {
                fields: fields,
                files: files
            },
            success: "true",
            errors: null,
            data: null
        };
        res.send(response);
    });
});

app.post('/items/set-as-wanted', [
    AuthMiddleware.isJWTValid,
    ItemsController.setWanted
]);

app.post('/items/set-as-unwanted', [
    AuthMiddleware.isJWTValid,
    ItemsController.setUnwanted
]);

// #######################################

//########################################
//########## USERS ENDPOINTS #############
//########################################

app.post('/users/add', [
    UsersController.insert
]);

app.post('/users/login', [
    AuthMiddleware.doPassAndEmailMatch,
    AuthController.login
]);

app.post('/users/get', [
    AuthMiddleware.isJWTValid,
    UsersController.getById
]);

app.post('/users/delete', [
    AuthMiddleware.isJWTValid,
    AuthMiddleware.isPassCorrect,
    UsersController.delete
]);

//###########################################

//#########################################
//########### MATCHES ENDPOINTS ###########
//#########################################

app.post('/matches/accept-match',(req, res)=>{
    new formidable.IncomingForm().parse(req, (err, fields, files) => {
        if (err) {
          throw err
        }

        let response = {
            _metadata: {
                fields: fields,
                files: files
            },
            success: "true",
            errors: null,
            data: null
        };
        res.send(response);
    });
});

app.post('/matches/decline-match',(req, res)=>{
    new formidable.IncomingForm().parse(req, (err, fields, files) => {
        if (err) {
          throw err
        }
        let response = {
            _metadata: {
                fields: fields,
                files: files
            },
            success: "true",
            errors: null,
            data: null
        };
        res.send(response);
    });
});

app.get('/matches/get-pending-matches',(req, res)=>{
    
        let response = {
            success: "true",
            errors: null,
            data: {
                matches: [
                {
                    id: 2,
                    myItem: {
                        name: "Ciasto",
                        description: "smaczne",
                        photoUrl: "https://www.mojewypieki.com/img/images/original/Ciasto_kinder_pingui_5_2411.jpg",
                        priceCategory: "Ło ho ho miljony",
                        category: "Jedzonko"
                    },
                    exchangeItem: {
                        name: "Buty",
                        description: "ładne",
                        photoUrl: "https://st.depositphotos.com/1016026/4819/i/950/depositphotos_48194997-stock-photo-high-heel-shoes-and-bikini.jpg",
                        priceCategory: "No drogie",
                        category: "Ubranko"
                    },
                    toWho: {
                        name: "macho6969",
                    },
                    fromWho: {
                        name: "madka500plus",
                    }
                 },]
               }
        };
        res.send(response);

});

app.get('/matches/get-accepted-matches',(req, res)=>{
    
        let response = {
            success: "true",
            errors: null,
            data: {
                matches: [
                {
                    id: 2,
                    myItem: {
                        name: "Ciasto",
                        description: "smaczne",
                        photoUrl: "https://www.mojewypieki.com/img/images/original/Ciasto_kinder_pingui_5_2411.jpg",
                        priceCategory: "Ło ho ho miljony",
                        category: "Jedzonko"
                    },
                    exchangeItem: {
                        name: "Buty",
                        description: "ładne",
                        photoUrl: "https://st.depositphotos.com/1016026/4819/i/950/depositphotos_48194997-stock-photo-high-heel-shoes-and-bikini.jpg",
                        priceCategory: "No drogie",
                        category: "Ubranko"
                    },
                    toWho: {
                        name: "macho6969",
                        email: "macho6969@wp.pl",
                        phone: "112 112 112"
                    },
                    fromWho: {
                        name: "cichoń1000",
                        email: "jacek.cichon@pwr.edu.pl",
                        phone: "71 320 2109"
                    }
                 },]
               }

        };
        res.send(response);
});

app.listen(port,()=>{
    console.log("Server is up on port " + port);
});
