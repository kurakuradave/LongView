// takes a Server object, returns a Socket object.
function LVSocket( daServer ) {
    var self = this;
    self = require( 'socket.io' )( daServer )
    // socket.io listeners
    self.sockets.on('connection', function(socket){
        socket.on( 'dump', function( data ) {  
            data.stamped=true;
            self.emit( 'hyper', data );
        } );
        socket.on( 'zonked', function( data ) {
            data.stamped = true;
            self.emit( 'zonked', data );
        } );
        socket.on( 'panLeft', function(data) { 
            self.emit( 'panLeft', {} );
        } );
        
        socket.on( 'panRight', function(data) {  
            self.emit( 'panRight', {} );
        } );
  
        socket.on( 'notTooFast', function(data) { 
            self.emit( 'notTooFast', data ); 
        } );
  
        socket.on( 'imgStartClient', function(data) {
            self.emit( 'imgStartClient', data );
        } );
  
        socket.on( 'imgStopClient', function(data){
            console.log( "client requested to stop imaging" );
            self.emit( 'imgStopClient', data );
        } );
  
        socket.on( 'imgStopServer', function(data){
            self.emit( 'imgStopServer', data );
        } );
  
        socket.on( 'scStartClient', function(data) {
            self.emit( 'scStartClient', data );
        } );
  
        socket.on( 'scStopClient', function(data){ 
            self.emit( 'scStopClient', data );
        } );
  
        socket.on( 'scStopServer', function(data){
            self.emit( 'scStopServer', data );
        } );

    });
    return self;
};

module.exports = LVSocket;
