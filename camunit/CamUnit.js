// module for taking webcam snapshots with fswebcam
var spawn = require('child_process').spawn;
var util = require( 'util' );
var EventEmitter = require('events').EventEmitter;

function CamUnit() {
    var self = this;
    var fswebcam;
    var daFile = "./snap.jpg";
    var intvlId;

    self.snap = function( callback ) {
        fswebcam = spawn( 'fswebcam', [ '-d/dev/video1', '-r1280x720', daFile ] );
        
        fswebcam.on( 'exit', function(code) {  
            //console.log( "fswebcam exited with code " + code );
            if( callback ) callback( code );
            self.emit( 'snapped', daFile );
        } );
    };
    
    self.startContinuous = function ( intvl ) {
        if( intvl < 1000 ) intvl = 1000; // can't be too fast 
        intvlId = setInterval( function() {
            self.snap();
        }, intvl );
        console.log( "Taking snaps at every %d millisecs.", intvl );
    };
    
    self.stopContinuous = function() {
        clearInterval( intvlId );
        console.log( "Stops taking snaps now." );
    };
};

util.inherits( CamUnit, EventEmitter );

module.exports = CamUnit;
