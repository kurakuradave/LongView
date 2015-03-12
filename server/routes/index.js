var express = require('express');
var router = express.Router();
var dbSlave = require( '../dbSlave' );


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('layout' );
});



router.get('/index.jade', function(req, res, next) {
  res.render('index', {title: "Welcome!"} );
} );

router.get( '/daview.jade', function( req, res, next ) { 
    res.render( 'daview' );
} );

router.get( '/about.jade', function( req, res, next ) {  
    res.render( 'about' );
} );


router.post( '/login', function( req, res, next ) {
    dbSlave.verifyPass( req, function( vres ) { 
        if( vres ) {
           res.end( JSON.stringify( {authed:'pass', username:req.body.username, priv:'normal'} ) );
        } else {
           res.end( JSON.stringify( {authed:'fail'} ) );    
        }
    } ); 
    
} );

module.exports = router;
