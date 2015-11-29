var express = require('express')
    , app = express()
    , request = require('request')
    , sanitizeHtml = require('sanitize-html');


//var externalUrl = 'https://www.wikipedia.org/';
var externalUrl = 'https://en.wikipedia.org';
var externalImagePath = '/portal/wikipedia.org/assets/img/';


app.set('views', './views')
app.set('view engine', 'jade');
app.use(express.static('public'));


function renderSanitized(res, template, content){
    
    var sanitized = sanitizeHtml(content, {
        allowedTags: sanitizeHtml.defaults.allowedTags.concat([
            'html', 'head', 'body', 'link', 'style', 'form', 'input', 'option', 'title', 'meta', 'h1', 'h2'
        ]),
        allowedAttributes: false
    });
    
    //render template without closing body and html tags so we can inject our own js code
    res.render(template, { wikiContent: sanitized.substr(0, sanitized.indexOf('</body>'))});    

};


app.get('/', function (req, res) {
    
    request(externalUrl + '/wiki/Main_Page', function (error, response, body) {
    //request('https://www.wikipedia.org/search-redirect.php?family=wikipedia&language=en&search=fudge&go=&go=Go', function (error, response, body) {
    //request('https://en.wikipedia.org/w/load.php?debug=false&lang=en&modules=ext.cite.styles%7Cext.gadget.DRN-wizard%2CReferenceTooltips%2CWatchlistBase%2CWatchlistGreenIndicators%2Ccharinsert%2Cfeatured-articles-links%2CrefToolbar%2Cswitcher%2Cteahouse%7Cext.uls.nojs%7Cext.visualEditor.desktopArticleTarget.noscript%7Cext.wikimediaBadges%7Cmediawiki.legacy.commonPrint%2Cshared%7Cmediawiki.raggett%2CsectionAnchor%7Cmediawiki.skinning.interface%7Cskins.vector.styles%7Cwikibase.client.init&only=styles&skin=vector', function (error, response, body) {
        if (!error && response.statusCode == 200) {
           renderSanitized(res, 'index', body);
        }
    });
});


//Term Detail Page
app.get('/wiki/:term', function (req, res) {
    request(externalUrl + '/w/index.php?search=' + req.params.term +'&title=Special%3ASearch&go=Go', function (error, response, body) {    
        if (!error && response.statusCode == 200) {
            renderSanitized(res, 'index', body);
        }
    });    
});




//proxy assets found at wikipedia.org/w/load.php?param=something
//ie: https://en.wikipedia.org/w/load.php?debug=false&lang=en&modules=ext.cite.styles%7Cext.........
app.get('/w/load.php', function (req, res) {
    request(externalUrl + req.originalUrl, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            res.writeHead(200, {
                'Content-Type': response.headers['content-type']
            });
            res.end(body);
        }else{
            res.end();
        }
    });
});


//proxy relative references to external images
//TODO: get this to work...
/*
app.get(externalImagePath + ':file', function (req, res) {
    var file = req.params.file;

    //make sure this is an image
    if(!/[a-zA-Z0-9-_]+.(png|jpg|jpeg|gif)/.test(file)){
        res.writeHead(404, {'Content-Type': 'text/plain' });
        res.end();
    }else{
        request(externalUrl + externalImagePath + file, function (error, response, body) {
            if (response.statusCode === 200) {
                res.writeHead(200, {
                    'Content-Type': response.headers['content-type']
                });
                response.pipe(res);
            } else {
                res.writeHead(response.statusCode);
                res.end();
            }
        });       
    }
});
*/


var server = app.listen(3000, function () {
    var host = server.address().address;
    var port = server.address().port;
    console.log('This app is listening at http://%s:%s', host, port);
});
