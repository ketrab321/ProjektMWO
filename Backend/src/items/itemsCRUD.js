const multiparty = require('multiparty');
const crypto = require('crypto');
const storage = require('azure-storage');
const { check, validationResult } = require('express-validator');
const db = require('../main');
const containerName = 'images';
const blobService = storage.createBlobService('DefaultEndpointsProtocol=https;AccountName=mwo;AccountKey=TEFwo7L1xbtP1CS77SwZl+muwk5cULioDR+MgUdEvN1KBO6Ng9IDwyDQJfEO51R0uz63rczebA2+Su04QXqVCw==;EndpointSuffix=core.windows.net');
const storageUrl = blobService.getUrl(containerName);

//ITEMS
exports.test = (req, res)=>{
    var form = new multiparty.Form();
    var files = [], fields = [];
    var errors = [];
    var url = '';
    form.on('part', function(part) {
        if (part.filename) {
            files.push(part);
            url = helperHostFile(part, errors);
        }
    });
    form.on('field', function(name, value) {
        fields.push({ name: name, value: value})
    });
    form.on('error',function(error){
        errors.push(error);
    });
    form.on('close', function() {
        let response = {
            _metadata: {
                fields: fields,
                files: files
            },
            headers: req.headers,
            url: req.originalUrl,
            body: req.body,
            data: {
                url: url
            }
        };
        res.send(response);
    });

    form.parse(req);
}

exports.add = (req, res)=>{
    var form = new multiparty.Form();
    var files = [], fields = [];
    var errors = [];
    var url = '';
    form.on('part', function(part) {
        if (part.filename) {
            files.push(part);
            url = helperHostFile(part, errors);
        }
    });
    form.on('field', function(name, value) {
        fields.push({ name: name, value: value})
    });
    form.on('error',function(error){
        errors.push(error);
    });
    form.on('close', function() {
        fields.push({ name: "photo", value: url});
        fields.push({ name: 'userId', value: req.jwt.userId})
        helperAddItem(fields);
        let response = {
            _metadata: {
                fields: fields,
                files: files
            },
            success: true,
            errors: errors,
            data: {
                itemId: "2",
                url: url
            }
        };
        res.send(response);
    });

    form.parse(req);
}

exports.delete = [
    check('itemId').isNumeric(),
    (req, res)=> {
        db.conn.query(`DELETE FROM items WHERE id = ?`, [req.body.itemId], function (err, result, fields) {
            if (err) {
                return res.status(500).send({
                    success: false,
                    errors: [err],
                    data: null
                });
            }
            if (result.affectedRows > 0) {
                return res.status(201).send({
                    success: true,
                    errors: null,
                    data: null
                });
            } else {
                return res.status(500).send({
                    success: false,
                    errors: [{ message: 'Could not delete data' }],
                    data: null
                });
            }
        })
    }
]

exports.getUserItems = (req, res) => {
    db.conn.query(`select * from mwo.items where itemUserId = ?`, [req.jwt.userId], function (err, result, fields) {
        if (err) {
            return res.status(500).send({
                success: false,
                errors: [err],
                data: null
            });
        }
        if (result != undefined && Array.isArray(result)) {

            return res.status(201).send({
                success: true,
                errors: null,
                data: result
            });

        } else {
            return res.status(500).send({
                success: false,
                errors: [{ message: 'Could not get data' }],
                data: null
            });
        }
    })
}

exports.getRandomItem = (req, res)=> {
    db.conn.query(`select i.id, i.itemName, i.itemDescription, i.itemPhoto, i.itemPriceCategory, i.itemCategory, i.itemUserId, s.userId, s.wanted
    from mwo.items as i
    left join
    (select * from mwo.swipes as s where s.userId = ?) as s
    on i.id = s.itemId
    where NOT (s.userId <=> ?)
    limit 10`, [req.jwt.userId, req.jwt.userId], function (err, result, fields) {
        if (err) {
            return res.status(500).send({
                success: false,
                errors: [err],
                data: null
            });
        }
        if (result != undefined && Array.isArray(result)) {

            return res.status(201).send({
                success: true,
                errors: null,
                data: shuffle(result)
            });

        } else {
            return res.status(500).send({
                success: false,
                errors: [{ message: 'Could not get data' }],
                data: null
            });
        }
    })
}

//HELPERS

var helperHostFile = (file, errors) => {
    var size = file.byteCount;
    var fileExtension = file.filename.split('.')[1];
    let hash_generator = crypto.createHash('md5');
    var name = hash_generator.update(file.filename + Date.now().toString(), 'utf-8').digest('hex') + '.' + fileExtension;
    url = storageUrl + '/' + name;
    blobService.createBlockBlobFromStream(containerName, name, file, size, function(error) {
        if (error) {
            errors.push(error);
        }
    });
    return url;
}

const helperAddItem = (fields) =>
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
        if(element.name && element.name === "userId"){
            item['userId'] = element.value;
        }
    });
    db.conn.query('INSERT INTO mwo.items (itemName, itemDescription, itemPhoto, itemPriceCategory, itemCategory, itemUserId, itemStatus) VALUES (?, ?, ?, ?, ?, ?, ?);',
                                [item['name'], item['description'], item['photo'], item['priceCategory'], item['category'], item['userId'], 'unmatched'],
    function (err, results, fields) {
        if (err) throw err;
        else console.log('Inserted ' + results.affectedRows + ' row(s).');
    })
}

function shuffle(a) {
    var j, x, i;
    for (i = a.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = a[i];
        a[i] = a[j];
        a[j] = x;
    }
    return a;
}
