var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('daview', { title: 'The View' });
});

router.get( '/about', function( req, res, next ){  
    res.send( "Experimental IoT app using Arduino, temperature sensors, webcam Raspberry Pi, and of course, MEAN stack :)" );
} );

router.get('/topsecret.jpg', function(req, res, next){
    res.sendfile( "./uploads/topsecret.jpg" );
});

router.get( '/webcam.jpg', function( req, res, next ){
    res.sendfile( "./public/images/webcam.jpg" );
} );

module.exports = router;
