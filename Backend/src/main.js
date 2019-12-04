const express = require('express');
const bodyParser = require("body-parser");
const formidable = require('formidable');
const getStream = require('into-stream');
const mysql = require('mysql');
const algorithm = require('./matches/circuitAlgorithm/algorithm');

var config = {
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


app.get('/logs', (req, res) => {
        res.send(algorithm.logs)
    })
    //#######################################
    //######### ITEMS ENDPOINTS #############
    //#######################################

app.post('/test', [
    ItemsController.test
])

app.get('/items/get-rand-item', [
    AuthMiddleware.isJWTValid,
    ItemsController.getRandomItem
]);

app.get('/items/get-user-items', [
    AuthMiddleware.isJWTValid,
    ItemsController.getUserItems
]);

app.post('/items/add', [
    AuthMiddleware.isJWTValid,
    ItemsController.add
]);


app.post('/items/delete', [
    AuthMiddleware.isJWTValid,
    ItemsController.delete
]);

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

app.post('/matches/accept-match', (req, res) => {
    new formidable.IncomingForm().parse(req, (err, fields, files) => {
        if (err) {
            throw err
        }

        let response = {
            _metadata: {
                fields: fields,
                files: files
            },
            success: true,
            errors: null,
            data: null
        };
        res.send(response);
    });
});

app.post('/matches/decline-match', (req, res) => {
    new formidable.IncomingForm().parse(req, (err, fields, files) => {
        if (err) {
            throw err
        }
        let response = {
            _metadata: {
                fields: fields,
                files: files
            },
            success: true,
            errors: null,
            data: null
        };
        res.send(response);
    });
});

app.get('/matches/get-pending-matches', (req, res) => {

    let response = {
        success: true,
        errors: null,
        data: {
            matches: [{
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
            }, ]
        }
    };
    res.send(response);

});

app.get('/matches/get-accepted-matches', (req, res) => {

    let response = {
        success: true,
        errors: null,
        data: {
            matches: [{
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
            }, ]
        }

    };
    res.send(response);
});

app.listen(port, () => {
    console.log("Server is up on port " + port);
    setInterval(algorithm.startAlgorithm, 7200000);
});