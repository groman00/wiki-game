var express = require('express')
    , app = express()
    , request = require('request')
    , url = require('url')
    , cookieParser = require('cookie-parser')
    , bodyParser = require('body-parser')
    , parseurl = require('parseurl')
    , session = require('express-session')
    , sanitizeHtml = require('sanitize-html');
    

//var externalUrl = 'https://www.wikipedia.org/';
var externalUrl = 'https://en.wikipedia.org';
var externalImagePath = '/portal/wikipedia.org/assets/img/';

app.set('views', './views')
app.set('view engine', 'jade');
app.use(express.static('public'));

app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded


/*  User Tracking
    todo: 
        - move to new file? 
        - see section about using mongo: http://blog.modulus.io/nodejs-and-express-sessions
*/

function clearSession(req){
    delete req.session.views;   
    delete req.session.startTerm;
    delete req.session.endTerm;
};

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
    var pathname = parseurl(req).pathname.toLowerCase(), 
        views,
        term;

    if(pathname.indexOf('/wiki/') !== 0){
        next();
        return false;
    }

    //clear session values if this is a new game
    if(req.body.endTerm){
        clearSession(req);
    }

    term = getTermFromUrl(req).toLowerCase();
    views = req.session.views;

    if (!views) {
        views = req.session.views = {};
    }

    // count the views
    views[term] = (views[term] || 0) + 1;

    console.log(views);

    next();

});
/* */


function getTermFromUrl(url){
    var path = typeof url === 'string' ? url : parseurl(url).pathname;
    return path.split('/').pop();
};

function renderSanitized(req, res, content, error){
    
    var sanitized = sanitizeHtml(content, {
        allowedTags: sanitizeHtml.defaults.allowedTags.concat([
            'html', 'head', 'body', 'link', 'style', 'form', 'input', 'option', 'title', 'meta', 'h1', 'h2', 'span'
        ]),
        allowedAttributes: false
    });
    
    //determine game state
    var state = 'new';
    var views = req.session.views;
    var viewCount = views ? Object.keys(views).length : 0;
    var endTerm;

    if(req.session.endTerm){
        
        endTerm = req.session.endTerm.replace(/\_/g, ' ');

        //check if current url is in our list of viewed urls
        if(views.hasOwnProperty(req.session.endTerm)){
            state = 'complete';
            clearSession(req);
        }else{
            state = 'inProgress';
        }
    }

    //render template without closing body and html tags so we can inject our own js code
    res.render('index', {
        wikiContent: sanitized.substr(0, sanitized.indexOf('</body>')),
        gameState: state,
        uniquePageViews: viewCount,
        startTerm: getTermFromUrl(req).toLowerCase(),
        endTerm: endTerm,
        error: error
    });    

};

function searchTerm(term, callback){
    request(externalUrl + '/w/index.php?search=' + term +'&title=Special%3ASearch&go=Go', callback); 
};

function renderSearchTerm(req, res, error){
    searchTerm(req.params.term, function(err, response, body){
        if (!err && response.statusCode == 200) {
            renderSanitized(req, res, body, error);
        }        
    });
};

app.get('/', function (req, res) {
    
    request(externalUrl + '/wiki/Main_Page', function (error, response, body) {
    //request('https://www.wikipedia.org/search-redirect.php?family=wikipedia&language=en&search=fudge&go=&go=Go', function (error, response, body) {
    //request('https://en.wikipedia.org/w/load.php?debug=false&lang=en&modules=ext.cite.styles%7Cext.gadget.DRN-wizard%2CReferenceTooltips%2CWatchlistBase%2CWatchlistGreenIndicators%2Ccharinsert%2Cfeatured-articles-links%2CrefToolbar%2Cswitcher%2Cteahouse%7Cext.uls.nojs%7Cext.visualEditor.desktopArticleTarget.noscript%7Cext.wikimediaBadges%7Cmediawiki.legacy.commonPrint%2Cshared%7Cmediawiki.raggett%2CsectionAnchor%7Cmediawiki.skinning.interface%7Cskins.vector.styles%7Cwikibase.client.init&only=styles&skin=vector', function (error, response, body) {
        if (!error && response.statusCode == 200) {
           renderSanitized(req, res, body, false);
        }
    });
});


//Term Detail Page
app.get('/wiki/:term', function (req, res) {
    renderSearchTerm(req, res);    
});

app.post('/wiki/:term', function (req, res) {
    
    searchTerm(req.body.endTerm, function(error, response, body){

        //no referer means topic not found
        var notFound = !response.request.headers.referer;

        if(!notFound){
            req.session.startTerm = req.body.startTerm;
            req.session.endTerm = getTermFromUrl(response.req.path).toLowerCase();
        }
        
        renderSearchTerm(req, res, notFound);

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
