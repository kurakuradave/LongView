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
        $scope.hyper = {};
        $scope.daPic = "./daview/webcam.jpg";
        $scope.messages = [];
        $scope.streamingImage = false;
        $scope.streamImageBtnCaption = "Start Continuous Imaging";
        $scope.streamingSensor = false;
        $scope.streamSensorBtnCaption = "Start Sensor Stream";
        
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
                $scope.messages.push( someText + " __________ " + (new Date() ) );
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
            } else {
                $scope.sensorStreamStart();
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
        }
        
        socket.on( 'imgStopServer', function( data ) {  
            $scope.streamingImage = false;
            $scope.setStreamImageCaption();
            $scope.queueMessage( data.msg );
        } );
                
            socket.on( 'scStopServer', function(data) {  
            $scope.streamingSensor = false;
            $scope.setStreamSensorCaption();
            $scope.queueMessage( data.msg );
        } );
        
        socket.on( 'hyper', function( data ) {  
            $scope.$apply( function() {
                $scope.hyper = data;
            } );
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
            if( usersService.getUser().authed == "pass" ) {
                $scope.sensorStreamStart();            
            } else { // redirect to home if user has not logged in
                $location.path( '/' );
                $location.replace();
            }
        }
        
    } ] )
