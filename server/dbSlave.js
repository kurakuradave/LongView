// mongodb
var mongodb = require( 'mongodb' );
var mongoServer = new mongodb.Server('localhost',27017, {auto_reconnect: true});
var db = new mongodb.Db('salome', mongoServer);
var daObject = {};

this.getAllUsers = function( callback ) {
    db.open( function( err, db ) {
        if( err ) {
            console.log( "ERROR accessing db:" );
            console.log( err.message );
            callback( null );
        } else {
            var coll = db.collection( 'users' );
            coll.find( {}).toArray( function( err, results ) {
                if( err ) {
                    console.log( "ERROR accessing collection users for authentication" );
                    console.log( err );
                    callback( null );
                } else {
                    db.close();
                    callback( results );                    
                }
            } );
        }
      } );
}

var verifyPass = function( req, callback ) {
    daObject = req.body;
    this.getAllUsers( function( qresults ) {  
        var uname = req.body.username;
        var pw = req.body.passw;
        var found = false;
        qresults.forEach( function( qr ) {

            if( qr.username == uname && qr.passw == pw )
                found = true;
        } );
        callback( found );
    } );
};

// for testing, not used
var doQuery = function( req, callback ) {
    db.open( function( err, db ) {
        if( !err ) {
            var coll = db.collection( 'acakadut' );
            coll.find({}).toArray(function(err, results){
                if( err ) {
                    console.log( "ERROR querying db" );
                    console.log( err );
                } else {
                    console.log(results); // output all records
                    var newRes = [];
                    results.forEach( function( r ) {
                        var nr = {};
                        nr.lat = r.lat;
                        nr.long = r.long;
                        nr.title = r.title;
                        nr.description = r.description;
                        newRes.push( nr );
                    } );
                    callback( newRes );
                }
                db.close();
            } );
        } else {
            console.log( "ERROR opening db" );
            console.log( err );
            db.close();
        }
    } );
}

module.exports.doQuery = doQuery;
module.exports.verifyPass = verifyPass;
