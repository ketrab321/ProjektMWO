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
const MatchesController = require('./matches/controller');

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

app.get('/users/myself', [
    AuthMiddleware.isJWTValid,
    UsersController.get_myself
]);

app.post('/users/delete', [
    AuthMiddleware.isJWTValid,
    AuthMiddleware.isPassCorrect,
    UsersController.delete
]);

app.put('/users/update', [
    AuthMiddleware.isJWTValid,
    AuthMiddleware.isPassCorrect,
    UsersController.update
]);

//###########################################

//#########################################
//########### MATCHES ENDPOINTS ###########
//#########################################

app.post('/matches/accept-match', [
    AuthMiddleware.isJWTValid,
    MatchesController.accept
]);

app.post('/matches/decline-match', [
    AuthMiddleware.isJWTValid,
    MatchesController.decline
]);

app.post('/matches/confirm-match', [
    AuthMiddleware.isJWTValid,
    MatchesController.confirm
]);

app.get('/matches/get-pending-matches', [
    AuthMiddleware.isJWTValid,
    MatchesController.get_pending
]);

app.get('/matches/get-accepted-matches', [
    AuthMiddleware.isJWTValid,
    MatchesController.get_accepted
]);

//###########################################

//#########################################
//########### OTHER ENDPOINTS ###########
//#########################################

app.get('/auth/istokenvalid', [
    AuthMiddleware.isJWTValid,
    (_req, res) => {
        return res.status(200).send({
            success: true,
            errors: null,
            data: null
        });
    }
]);

app.listen(port, () => {
    console.log("Server is up on port " + port);
    setInterval(algorithm.startAlgorithm, 7200000);
});