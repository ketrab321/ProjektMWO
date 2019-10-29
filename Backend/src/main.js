const express = require('express');
const bodyParser = require("body-parser");
const formidable = require('formidable');
const storage = require('azure-storage');
const getStream = require('into-stream');
const multiparty = require('multiparty');
const crypto = require('crypto');
const queries = require('./queries')

const containerName = 'images';
const blobService = storage.createBlobService('DefaultEndpointsProtocol=https;AccountName=mwo;AccountKey=TEFwo7L1xbtP1CS77SwZl+muwk5cULioDR+MgUdEvN1KBO6Ng9IDwyDQJfEO51R0uz63rczebA2+Su04QXqVCw==;EndpointSuffix=core.windows.net');
const storageUrl = blobService.getUrl(containerName);

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

app.post('/items/get-rand-item',(req, res)=>{
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
            data: {
                itemId: "1",
                name: "Zbigniew Stonoga",
                description: "Oni was będą ... jak nikt was jeszcze nie ...",
                photoUrl: "https://www.google.com/url?sa=i&source=images&cd=&ved=2ahUKEwiVuP3QuKHlAhVl7aYKHdZKDbAQjRx6BAgBEAQ&url=https%3A%2F%2Fnoizz.pl%2Fzbigniew-stonoga-niezadowolony-z-wynikow-wyborow-naublizal-polakom-a-potem-przeprosil%2Fxhdj5tf&psig=AOvVaw17fJSy_o4Ax9QzaAg7cyk5&ust=1571338075221027",
                priceCategory: "Tanie w ciul",
                category: "Twoja stara"
            }
        };
        res.send(response);
    });

});

app.post('/items/get-user-items',(req, res)=>{
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
            data: [
                {
                    itemId: "1",
                    name: "Zbigniew Stonoga",
                    description: "Oni was będą ... jak nikt was jeszcze nie ...",
                    photoUrl: "https://gfx.wiadomosci.radiozet.pl/var/radiozet-wiadomosci/storage/images/polska/zbigniew-stonoga-w-fatalnym-stanie-w-wiezieniu-pomozcie-mi-ludzie-umieram/485735-1-pol-PL/Zbigniew-Stonoga-w-fatalnym-stanie-w-wiezieniu.-Pomozcie-mi-ludzie-umieram_article.jpg",
                    priceCategory: "Tanie w ciul",
                    category: "Twoja stara"
                },
                {
                    itemId: "2",
                    name: "Andrzej Duda",
                    description: "Dajcie mi tu parasol...",
                    photoUrl: "http://www.paczaj.eu/upload/images/large/2017/07/podajcie_prosze_parasol_andrzej_duda_2017-07-18_18-00-10.jpg",
                    priceCategory: "Drogie jak skur...",
                    category: "Twój stary"
                },
                {
                    itemId: "3",
                    name: "Chuck Norris",
                    description: "Chuck Norris potrafi trzasnąć obrotowymia drzwiami",
                    photoUrl: "http://dzikabanda.pl/wp-content/uploads/Chuck-04-DB-450x400.jpg",
                    priceCategory: "MILION TYSIENCÓW",
                    category: "Category"
                },
            ]
        };
        res.send(response);
    });
});

app.post('/items/add',(req, res)=>{
    var form = new multiparty.Form();
    var files = [], fields = [];
    var errors = [];
    var url = '';
    form.on('part', function(part) {
        if (part.filename) {
            files.push(part);
            var size = part.byteCount;
            var fileExtension = part.filename.split('.')[1];
            let hash_generator = crypto.createHash('md5');
            var name = hash_generator.update(part.filename + Date.now().toString(), 'utf-8').digest('hex') + '.' + fileExtension;
            console.log(name);
            url = storageUrl + '/' + name;
            blobService.createBlockBlobFromStream(containerName, name, part, size, function(error) {
                if (error) {
                    errors.push(error);
                }
            });
        }

    });
    form.on('field', function(name, value) {
        fields.push({ name: name, value: value})
    });
    form.on('error',function(error){
        errors.push(error);
    });
    form.on('close', function() {
        fields.push({ name: "photo", value: url})
        queries.addItem(fields);
        let response = {
            _metadata: {
                fields: fields,
                files: files
            },
            success: "true",
            errors: errors,
            data: {
                itemId: "2",
                url: url
            }
        };
        res.send(response);
    });

    form.parse(req);
});


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

app.post('/matches/get-pending-matches',(req, res)=>{
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
});

app.post('/matches/get-accepted-matches',(req, res)=>{
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
});

app.listen(port,()=>{
    console.log("Server is up on port " + port);
});
