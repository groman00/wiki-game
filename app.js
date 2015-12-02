var express = require('express')
    , app = express()
    , request = require('request')
    , cookieParser = require('cookie-parser')
    , parseurl = require('parseurl')
    , session = require('express-session')
    , sanitizeHtml = require('sanitize-html');
    

//var externalUrl = 'https://www.wikipedia.org/';
var externalUrl = 'https://en.wikipedia.org';
var externalImagePath = '/portal/wikipedia.org/assets/img/';

app.set('views', './views')
app.set('view engine', 'jade');
app.use(express.static('public'));

/*  User Tracking
    todo: 
        - move to new file? 
        - store the "start" url and "end" url once we have a ui for starting games
        - see section about using mongo: http://blog.modulus.io/nodejs-and-express-sessions
*/
app.use(cookieParser());

app.use(session({
    secret: 'x7WiKiKey7x',
    name: 'wikigameconnect.sid',
    //store: sessionStore, // connect-mongo session store
    //proxy: true,
    resave: false,
    saveUninitialized: false
}));

//https://github.com/expressjs/session
app.use(function (req, res, next) {
    
    // get the url pathname
    var pathname = parseurl(req).pathname, 
        views;

    if(pathname.indexOf('/wiki/') !== 0){
        next();
        return false;
    }

    views = req.session.views;

    if (!views) {
        views = req.session.views = {};
    }

    // count the views
    views[pathname] = (views[pathname] || 0) + 1;

    console.log(views);

    next();

});
/* */


function renderSanitized(req, res, template, content){
    
    var sanitized = sanitizeHtml(content, {
        allowedTags: sanitizeHtml.defaults.allowedTags.concat([
            'html', 'head', 'body', 'link', 'style', 'form', 'input', 'option', 'title', 'meta', 'h1', 'h2', 'span'
        ]),
        allowedAttributes: false
    });
    
    //render template without closing body and html tags so we can inject our own js code
    res.render(template, {
        wikiContent: sanitized.substr(0, sanitized.indexOf('</body>')),
        pathname: parseurl(req).pathname
    });    

};

function renderSearchTerm(req, res){
    request(externalUrl + '/w/index.php?search=' + req.params.term +'&title=Special%3ASearch&go=Go', function (error, response, body) {    
        if (!error && response.statusCode == 200) {
            renderSanitized(req, res, 'index', body);
        }
    }); 
}

app.get('/', function (req, res) {
    
    request(externalUrl + '/wiki/Main_Page', function (error, response, body) {
    //request('https://www.wikipedia.org/search-redirect.php?family=wikipedia&language=en&search=fudge&go=&go=Go', function (error, response, body) {
    //request('https://en.wikipedia.org/w/load.php?debug=false&lang=en&modules=ext.cite.styles%7Cext.gadget.DRN-wizard%2CReferenceTooltips%2CWatchlistBase%2CWatchlistGreenIndicators%2Ccharinsert%2Cfeatured-articles-links%2CrefToolbar%2Cswitcher%2Cteahouse%7Cext.uls.nojs%7Cext.visualEditor.desktopArticleTarget.noscript%7Cext.wikimediaBadges%7Cmediawiki.legacy.commonPrint%2Cshared%7Cmediawiki.raggett%2CsectionAnchor%7Cmediawiki.skinning.interface%7Cskins.vector.styles%7Cwikibase.client.init&only=styles&skin=vector', function (error, response, body) {
        if (!error && response.statusCode == 200) {
           renderSanitized(req, res, 'index', body);
        }
    });
});


//Term Detail Page
app.get('/wiki/:term', function (req, res) {
    renderSearchTerm(req, res);    
});

app.post('/wiki/:term', function (req, res) {
    console.log(req.params);
    renderSearchTerm(req, res);
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
