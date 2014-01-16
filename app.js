
/**
 * Module dependencies.
 */
var express = require('express'),
    app = express(),
    http = require('http'),
    path = require('path'),
    mongo = require('mongodb'),
    monk = require('monk'),
    // db = monk('localhost:27017/guardian-fortunes');
    db = monk(process.env.MONGOLAB_URI);

// all environments
app.set('port', process.env.PORT || 3000);
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);

// development only
if ('development' == app.get('env')) {
    app.use(express.errorHandler());
}

app.get('/', function(req, res) {
    db.get('articles').find({}, { sort: { count: -1 }, limit: 5 }, function(e, docs){
        res.send(docs);
    });
});

app.get(/^\/(.*)$/, function(req, res) {
     db.get('articles').findOne({ url: req.params[0] }, function(e, article){
        res.send(article);
    });
});

app.post(/^\/(.*)$/, function(req, res) {
    var articles = db.get('articles'),
        url = req.params[0];
    // url should be unique
    articles.index('url', { unique: true });
    articles.findOne({ url: url }, function(e, article){
        if (article) {
            articles.update(
                { url: url },
                {
                    url: article.url,
                    count: parseInt(article.count, 10) + 1
                }
            );
        } else {
            articles.insert({
                url: url,
                count: 1
            });
        }
        articles.findOne({ url: url }, function(e, article) {
            res.send(article);
        });
    });
});

http.createServer(app).listen(app.get('port'), function(){
    console.log('Express server listening on port ' + app.get('port'));
});
