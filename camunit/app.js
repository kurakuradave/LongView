// import the camera library
var CamUnit = require( './CamUnit.js' );
var cu = new CamUnit();
var pairedServer = require( './pairedServer.js' );
var cfg = require( './LongViewConfig.js' );
var fullServerAddress = cfg.serverAddress + ":" + cfg.serverPort;

// utilities needed
var fs = require( 'fs' );
var reqq = require( 'request' );
var http = require( 'http' );

// set digest rate
var digestClock = 300;

// for holding sensor data between digest cycles
var lastSensorData = {};

// timeout limits
var imgTimeoutLimit = 60000;
var scTimeoutLimit = 15000;

// for cancelling timeouts when auto-off fires
var imgTimeoutID = {};
var scTimeoutID = {};

// for ensuring hardware safety
var lastPanned = new Date();
var allowPan = function() {
    var ret = false;
    if( ( new Date() ) - lastPanned > 500 )  //min 500 ms pause between each pan requests, to prevent abuse
        ret = true;
    return ret;
};
var lastIMG = new Date();
var allowIMG = function() {
    var ret = false;
    if( ( new Date() ) - lastIMG > 1000 )
        ret = true;
    return ret;
};
var lastSC = new Date();
var allowSC = function() {
    var ret = false;
    if( (new Date() ) - lastSC > 500 )
        ret = true;
    return ret;
};




// Arduino communication via Serial port
var fromArds = [];
var toArds = [];
var arduino = { comName : "", pnpId : "usb-Arduino" };
var sp;
var spDrained = true;
var spFlushed = true;
var serialport = require("serialport");
var SerialPort = serialport.SerialPort; // localize object constructor         
var connectsp = function( daPath ) {
    console.log( "Attempting to open Serialport to Arduino..." );
    var aPort = new SerialPort(daPath, {
        parser: serialport.parsers.readline("\n"),
        baudrate: 9600,
        disconnectedCallback: function(data) {
            console.log( "!!! Disconnected from Arduino !!!" );
            console.log( "Reconnecting after 10 seconds" );
            setTimeout( sp = connectsp(arduino.comName), 10000 );
        }
    });
    return aPort;
}

serialport.list(function (err, ports) {
  ports.forEach(function(port) {
    console.log(port.comName);
    console.log(port.pnpId);
    console.log(port.manufacturer);
    // find arduino on usb serial
    if( port.pnpId.indexOf( arduino.pnpId ) != -1 ) { 
        arduino.comName = port.comName;
        console.log( arduino  );
    }
  });

  // if arduino NOT found
  if( arduino.comName == "" ) {
    console.log( "Error: Can't Find Arduino On USB - Is It Plugged In?" );
    process.exit()
  } else { // arduino FOUND, open the serialport
    sp = connectsp( arduino.comName);
        sp.on("open", function () {
            console.log('Serialport to Arduino opened!');
            sp.on('data', function(data) {
                spFlushed = false;
                var obj = JSON.parse( data );
                if( obj.Temperature ) { // sensor data
                    lastSensorData = obj; 
                } else if( obj ) { // other messages
                    fromArds.push( obj );
                }
                sp.flush( function(err) {  
                    if( err ) console.log( err );
                    else {
                        spFlushed = true;
                    }
                } );
            });
            sp.on( 'close', function(data) {
                console.log( "connection to Arduino closed!" );
                console.log(data);
            } );
            sp.on( 'error', function(err) {  
                console.log( 'uh oh, an error happenned:' );
                console.log( err );
            } );
        });
      
  }

});




// socket.io stuff
var io = require( 'socket.io-client' );
var socket = io.connect(fullServerAddress, {reconnect: true});
socket.on('connect', function(socket) { 
     console.log( "CamUnit connected to server via socket!" );
});
socket.on( 'panLeft', function(data) { 
    if( allowPan() ) {
        toArds.push( "0\n" );
    } else {
        socket.emit( 'notTooFast', { msg: "To protect hardware, minimum 500 ms is required between pan requests" } );    
    }
} );

socket.on( 'panRight', function(data){  
    if( allowPan() ) {
        toArds.push( "1\n" );
    } else {
        socket.emit( 'notTooFast', { msg: "To protect hardware, minimum 500 ms is required between pan requests" } );    
    }
} );

socket.on( 'imgStartClient', function(data) {  
    if( allowIMG() )
        rollCamera();
    else
        socket.emit( 'notTooFast', { msg : "Minimum 1 sec required between start continuous imaging requests" } );
} );

socket.on( 'imgStopClient', function() {
        cu.stopContinuous();
        clearTimeout( imgTimeoutID );
        console.log( "stopped continuous imaging and cleared timeout" );
} );

socket.on( 'scStartClient', function(data) {  
    if( allowSC() )
        toArds.push( "3\n" );
    else
        socket.emit( 'notTooFast', { msg : "Minimum 500 millisecs required between start sensor streaming requests" } );
} );

socket.on( 'scStopClient', function() {
    toArds.push( "4\n" );
    clearTimeout( scTimeoutID );
} );




// handle camera 
var rollCamera = function() { // have one minute of fun! :)
    lastIMG = new Date();
    cu.startContinuous( 1000 );
    imgTimeoutID = setTimeout( function() { 
        cutCamera();        
    }, imgTimeoutLimit );
};

var cutCamera = function() {
    cu.stopContinuous();
    socket.emit( 'imgStopServer', { msg : "Continuous Imaging Auto-Off To Preserve Bandwidth" } );
};

cu.on( 'snapped', function( daFile ) {  
    //console.log( "File saved to: " + daFile );
    var formData = {
      custom_file: {
        value:  fs.createReadStream(daFile),
        options: {
          filename: 'topsecret.jpg',
          contentType: 'image/jpg'
        }
      }
    };
    
    reqq.post({url: fullServerAddress + '/upsnap/', qs:{ remotekey : pairedServer.key }, formData: formData}, function optionalCallback(err, httpResponse, body) {
      if (err) {
        return console.error('upload failed:', err);
      }
      //console.log('Upload successful!  Server responded with:', body);
      this.end();
    });    
} ); 




// prepare sensor data from Arduino for digestion
setInterval( function() { 
    if( lastSensorData.Temperature ) {
        fromArds.push( lastSensorData );
        lastSensorData = {};
    }
}, digestClock );




// start digest cycle to be in motion
setInterval( function() {
    digest();
}, digestClock );





var digest = function() {
    // process incoming stuff from Arduino
    var inc = fromArds[ 0 ];
    if( spFlushed && inc )  {
        //console.log( fromArds[ 0 ] );
        if( inc.msg == "SOR" ) {// reached end of servo movement range 
            socket.emit( 'zonked', inc );
        } else { // dump sensor readings
            socket.emit( 'dump', inc );
        }
        fromArds.splice( 0, 1 );
    }
    
    // process outgoing stuff to Arduino
    if( spDrained && toArds[0] ) {
        sp.write( toArds[ 0 ], function() {
            spDrained = false;
            sp.drain( function(err) {  
                if( err ) console.log( err );
                else {
                    spDrained = true;
                }
            } );
            if( toArds[0] == "3\n" ) { // starting continuous stream of sensor data
                lastSC = new Date();
                scTimeoutID = setTimeout( function(  ){ // set auto-off
                    toArds.push( "4\n" );
                    socket.emit( 'scStopServer', {msg:"Sensor Stream Auto-Off To Preserve Bandwidth"}   );
                }, scTimeoutLimit );  
            }
            if( toArds[0]=="0\n" || toArds[0] == "1\n" ) // panning servo
                lastPanned = new Date(); // for preventing pan abuse
            toArds.splice( 0, 1 );   
        } );     
    }
}




// for testing
//cu.startContinuous( 1000 );

//setTimeout( function() {
//    cu.stopContinuous();
//}, 10000 );

/* for testing continuous panning
var dir = "0\n";
setInterval( function( ) {
    //console.log( dir );
    toArds.push( dir );    
}, 500 );
*/




/* kickoff stuff on start
setTimeout( function() {
    rollCamera();
    toArds.push( "3\n" );
}, 5000 );
*/
