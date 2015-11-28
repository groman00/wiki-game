var express = require('express');
var app = express();
var request = require('request');

app.get('/', function (req, res) {
    request('https://www.wikipedia.org/', function (error, response, body) {
        if (!error && response.statusCode == 200) {
            res.send(body);
        }
    });
});

var server = app.listen(3000, function () {
    var host = server.address().address;
    var port = server.address().port;
    console.log('This app is listening at http://%s:%s', host, port);
});
