angular.module( 'LongViewApp', ['ngRoute'] )
    .factory( 'usersService', ['$rootScope', function( $rootScope ) {  
        var user = {};
        var loggedIn = false;
        return{
            setUser : function( daUser ) {  
                user = daUser;
                loggedIn = true;
                $rootScope.$broadcast( 'userLoggedIn' );
            },
            getUser : function() {
                return user;
            },
            hasUser : function() {
                return loggedIn;
            },
            logout : function( daLocation ) {
                this.setUser( {} );
                loggedIn = false;
                $rootScope.$broadcast( 'userLoggedOut' );
                daLocation.path( "/" );
                daLocation.replace();
            }
        }
    } ] )
    .config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider){
         //$locationProvider.html5Mode( true );
            $routeProvider.when( '/', {
                templateUrl : './index.jade',
                controller : 'HomeCtrl'
            } );
            $routeProvider.when( '/daview', {
                templateUrl : './daview.jade',
                controller : 'CamCtrl'
            } );
            $routeProvider.when( '/about', {
                templateUrl : './about.jade',
                controller : 'AboutCtrl'
            } );
    }])
    .controller( 'NavbarCtrl', ['$scope', '$location', 'usersService', function($scope, $location, usersService){  
        $scope.hasUser = false;
        $scope.aboutClk = function() {
            $location.path( '/about' );
            $location.replace();
        };
        $scope.daviewClk = function() {
            $location.path( '/daview' );
            $location.replace();
        };
        $scope.refreshUser = function(){
            $scope.hasUser = usersService.hasUser();
        };
        $scope.logout = function() {
            usersService.logout( $location );
        };
        $scope.$on( 'userLoggedIn', function( event ) {  
            $scope.refreshUser();
        } );
        $scope.$on( 'userLoggedOut', function( event ) {  
            $scope.refreshUser();
        } );               
    }] )
    .controller( 'AboutCtrl', ['$scope', '$location', function($scope, $location){  
        $scope.daviewClk = function() {
            console.log( "going to daview" );
            $location.path( '/daview' );
            $location.replace();
        };
    }] )
    .controller( 'HomeCtrl', [ '$rootScope', '$scope', '$http', '$location', 'usersService', function( $rootScope, $scope, $http, $location, usersService ){
        $scope.username = "";
        $scope.userpassw = "";
        $scope.attemptLogin = function() {
            $http.post( 'http://localhost:3000/login', { username:$scope.username, passw:$scope.userpassw } ).success( function( data ) {  
                if( data.authed == "pass" ) {
                    usersService.setUser( data );
                    $location.path( '/daview' );
                    $location.replace();
                } else { 
                    alert( "Login Failed!" );
                }
            } );
            $scope.username = "";
            $scope.userpassw = "";
        };    
    } ] )
    .controller( 'CamCtrl', [ '$scope', '$location', 'usersService', function($scope, $location, usersService){
        $scope.hyper = {}; // this contains the single most recent sensor data
        $scope.hyperObs = []; // this contains 20 most recent sensor data
        $scope.hyperObsIndex = 0; // running index for live viz
        $scope.daPic = "./daview/webcam.jpg";
        $scope.messages = [];
        $scope.streamingImage = false;
        $scope.streamImageBtnCaption = "Start Continuous Imaging";
        $scope.streamingSensor = false;
        $scope.streamSensorBtnCaption = "Start Sensor Stream";
        $scope.scaleTmpt = {};
        $scope.transition = d3.transition().duration( 100 );
        $scope.colorLevs = [ "#084594", "#2171b5", "#4292c6", "#6baed6", "#9ecae1", "#c6dbef" ];
        $scope.stoppedTmptPlot = false;
        $scope.hasScreenTmptPlot = false;
        $scope.shouldClearObs = false;
        $scope.dlo = 28;
        $scope.dhi = 29;









        $scope.getMessages = function() {
            return $scope.messages;
        };
        
        $scope.fadeMsg = function() {
            $scope.$apply( function() {
                $scope.messages.splice( 0, 1 );
            } );
        };
        
        $scope.queueMessage = function( someText ) {
            $scope.$apply( function() {
                $scope.messages.push( someText + " __________ " + (new Date() ) ); // using very simple message formatting for now
            } );
            setTimeout( function() {  
                $scope.fadeMsg();
            }, 5000 );
        };
        
        $scope.putMessage = function( someString ) {
            $scope.messages.push( someString + " __________ " + ( new Date() ) );
            setTimeout( function() { 
                $scope.fadeMsg();
            }, 5000 );
        };
        
        $scope.toggleStreamImage = function() {
            if( $scope.streamingImage ) {
                $scope.imageStreamStop();   
            } else {
                $scope.putMessage( "Acquiring Images, Please Wait" );
                $scope.imageStreamStart();
            }
        };
        
        $scope.toggleStreamSensor = function() {
            if( $scope.streamingSensor ) {
                $scope.sensorStreamStop();
                $scope.stopTmptPlot();
            } else {
                $scope.sensorStreamStart();
                $scope.resumeTmptPlot();
            }
        };
        
        $scope.setStreamImageCaption = function() {
            if( $scope.streamingImage )
                $scope.streamImageBtnCaption = "Stop Continuous Imaging";
            else {
                $scope.daPic = "./daview/webcam.jpg";
                $scope.streamImageBtnCaption = "Start Continuous Imaging";
                }
        };
        
        $scope.setStreamSensorCaption = function() {
            if( $scope.streamingSensor )
                $scope.streamSensorBtnCaption = "Stop Sensor Stream";
            else 
                $scope.streamSensorBtnCaption = "Start Sensor Stream";
        };
        
        $scope.imageStreamStart = function() {
            $scope.streamingImage = true;
            $scope.setStreamImageCaption();
            socket.emit( 'imgStartClient', {} );
        };     
        
        $scope.imageStreamStop = function() {
            $scope.streamingImage = false;
            $scope.setStreamImageCaption();
            socket.emit( 'imgStopClient', {} );
        };
                   
        $scope.sensorStreamStart = function() {
            $scope.streamingSensor = true;
            $scope.setStreamSensorCaption();
            socket.emit( 'scStartClient',{} );
            $scope.resumeTmptPlot();
        };
        
        $scope.sensorStreamStop = function() {
            $scope.streamingSensor = false;
            $scope.setStreamSensorCaption();
            socket.emit( 'scStopClient', {} );
        };
               
        $scope.panLeft = function() {
            socket.emit( 'panLeft', {} );
        };
        
        $scope.panRight = function() {
            socket.emit( 'panRight', {} );
        };
        
        $scope.placeNewOb = function ( d, i ) {
            //if( d.index < 20 )
            //    return( i * 10 );
            //else
                return( 19 * 10 );
        };
        
        $scope.placeOldObs = function ( d, i ) {
            //if( $scope.hyperObsIndex < 20 )
            //    return( d.index * 10 );
            //else
                return( (d.index - ($scope.hyperObsIndex - 20) ) * 10 );
        };
        
        $scope.determineFill = function( d, i ) {
            var lev = $scope.hyperObsIndex - d.index - 1;
            var ret = $scope.colorLevs[ 5 ];
            if( lev < 5 )
                ret = $scope.colorLevs[ lev ];
            return ret;
        };
        
        $scope.updateTmptPlot = function( data ) {
            var rects = gTmptPlot.selectAll( "rect" )
                            .data( data, function( d ) { return d.index } );
            
            rects.exit()
                .remove();
                
            rects.enter()
                .append( "rect" )
                .attr( "x", function( d, i ) { return 20 + $scope.placeNewOb( d, i );  } )
                .attr( "y", function( d, i ) { return ( 50 + $scope.scaleTmpt( d.Temperature ) - 5 ) } )
                .attr( "width", 10 )
                .attr( "height", 10 );

            rects
                .attr( "x", function( d, i ) { return 20 + $scope.placeOldObs( d, i );  } )
                .attr( "y", function( d, i ) { return ( 50 + $scope.scaleTmpt( d.Temperature ) - 5 ) } )
                .attr( "width", 10 )
                .attr( "height", 10 )
                .attr( "fill", function( d, i ) { return $scope.determineFill( d, i ) } );          
            
            if( $scope.shouldClearObs ) {
                $scope.shouldClearObs = false;
                setTimeout( function() {
                    $scope.hyperObs = [];
                    $scope.hyperObsIndex = 0;
                }, 300 );
            }
        };
        
        $scope.updateAirpPlot = function(){
        
        };
        
        $scope.adjustScale = function( data ) {
            if( data.Temperature < $scope.dlo || data.Temperature > $scope.dhi ) {
                $scope.dlo = Math.floor( data.Temperature );
                $scope.dhi = $scope.dlo +1;
                $scope.scaleTmpt.domain( [$scope.dlo,$scope.dhi] );
                $scope.drawAxis();
            }
        };
        
        $scope.updateObs = function( data ) {
            var indexedData = {
                                  index : $scope.hyperObsIndex++,
                                  Temperature : data.Temperature,
                                  Pressure : data.Pressure
                              };
            $scope.hyperObs.push( indexedData );
            if( $scope.hyperObs.length > 20 ) { // keep it to 20 obs max
                $scope.hyperObs.splice( 0, 1 );
            }
            $scope.updateTmptPlot( $scope.hyperObs );
            $scope.updateAirpPlot( $scope.hyperObs );
        };
        
        $scope.resumeTmptPlot = function() {
            $scope.stoppedTmptPlot = false;
            gScreen.selectAll( "rect" )
                .remove();
            $scope.hasScreenTmptPlot = false;
        };
        
        $scope.stopTmptPlot = function( terminate ) {
            if( !$scope.stoppedTmptPlpt ) {
                $scope.stoppedTmptPlot = true;
                if( terminate )
                    $scope.shouldClearObs = true;

                if( !$scope.hasScreenTmptPlot ) {
                    console.log( "applying screen" );
                    $scope.hasScreenTmptPlot = true;
                    gScreen
                        .append( "rect" )
                        .attr( "x", 0 )
                        .attr( "y", 0 )
                        .attr( "width", 300 )
                        .attr( "height", 300 )
                        .style( "fill-opacity", 0.3 )
                        .style( "fill", "black" );
                }
            }
        };
        
        $scope.drawAxis = function() {
           gAxis.call(
               d3.svg.axis()
               .scale( $scope.scaleTmpt )
               .orient( "right" )          
               .tickFormat( function(d) { return( d + "°C" ) } ) 
           );        
        };
        
        socket.on( 'imgStopServer', function( data ) {  
            $scope.streamingImage = false;
            $scope.setStreamImageCaption();
            $scope.queueMessage( data.msg );
        } );
                
            socket.on( 'scStopServer', function(data) {  
            $scope.streamingSensor = false;
            $scope.setStreamSensorCaption();
            $scope.queueMessage( data.msg );
            $scope.stopTmptPlot( true );
        } );
        
        socket.on( 'hyper', function( data ) {  
            $scope.$apply( function() {
                $scope.hyper = data;
            } );
            $scope.adjustScale( data );
            $scope.updateObs( data );
        } );
        
        socket.on( 'refImg', function( data ) {
            if( $scope.streamingImage ) {
                $scope.$apply(function() {
                    $scope.daPic = "./daview/topsecret.jpg?" + Math.random() ;
                } );
            }
        } );
        
        socket.on( 'zonked', function( data ) { 
            $scope.queueMessage( "Can't Turn Servo Beyond This Point" );
        } );

        socket.on( 'notTooFast', function( data ) {  
            $scope.queueMessage( data.msg );
        } );
        
        $scope.logout = function() {
            usersService.logout( $location );
        }
        
        init();
        
        function init() {
                  
            $scope.scaleTmpt = d3.scale.linear()
                               .domain( [20, 21] )
                               .range( [250,0] );
           
           $scope.drawAxis();
                                       
            if( usersService.getUser().authed == "pass" ) {
                // uncomment to kickstart sensor stream
                //$scope.sensorStreamStart();            
            } else { // redirect to home if user has not logged in
                $location.path( '/' );
                $location.replace();
            }
        }
        
    } ] )
