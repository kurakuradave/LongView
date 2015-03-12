var camUnit = require( './pairedCam' );
var express = require('express');
var multer  = require('multer');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var cors = require( 'cors' );

var routes = require('./routes/index');
var users = require('./routes/users');
var upsnap = require( './routes/upsnap' );
var daview = require( './routes/daview' );
var about = require( './routes/about' );

var dbSlave = require( './dbSlave' );

var app = express();

var LVSocket = require( './LVSocket.js' );

var LVServer = {}; // placeholder
app.setLVServer = function( aServer ) {
    LVServer = aServer; // receive passback from bin/www
    io = new LVSocket( LVServer ); // create socket
};



//Configure the multer
app.use(multer({ dest: './uploads/',
    rename: function (fieldname, filename) {
        return filename;
    },
    onFileUploadStart: function (file, req, res) {
        if( req.query.remotekey != camUnit.key ) {
            res.end( "Can't upload file!" );
            return false;
        }
    },
    onFileUploadComplete: function ( file, req, res ) {
        if( req.files.custom_file.originalname != 'topsecret.jpg' ) {
            res.end( "Bad file!" );
        } else { 
            res.end("File uploaded.");
        }
        io.emit( 'refImg', {} );
    }
}));


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use( cors() );

app.use('/', routes);
app.use('/users', users);
app.use( '/upsnap', upsnap );
app.use( '/daview', daview );
app.set( '/about', about );


// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});







// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


module.exports = app;
