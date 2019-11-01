const multiparty = require('multiparty');
const crypto = require('crypto');
const storage = require('azure-storage');
const { check, validationResult } = require('express-validator');
const db = require('../main');
const containerName = 'images';
const blobService = storage.createBlobService('DefaultEndpointsProtocol=https;AccountName=mwo;AccountKey=TEFwo7L1xbtP1CS77SwZl+muwk5cULioDR+MgUdEvN1KBO6Ng9IDwyDQJfEO51R0uz63rczebA2+Su04QXqVCw==;EndpointSuffix=core.windows.net');
const storageUrl = blobService.getUrl(containerName);

//ITEMS
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
}

exports.delete = [    
    check('itemId').isNumeric(),
    (req, res)=> {
        db.conn.query(`DELETE FROM items WHERE id = ?`, [req.body.itemId], function (err, result, fields) {
            if (err) {
                return res.status(500).send({
                    success: 'false',
                    errors: [err],
                    data: null
                });
            }
            if (result.affectedRows > 0) {
                return res.status(201).send({
                    success: 'true',
                    errors: null,
                    data: null
                });
            } else {
                return res.status(500).send({
                    success: 'false',
                    errors: [{ message: 'Could not delete data' }],
                    data: null
                });
            }
        })
    }
]
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