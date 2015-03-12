#include<Wire.h>
// include compass library
//#include<LSM303.h>
// include bmp085 library
#include<Adafruit_BMP085.h>
// include servo library
#include<Servo.h>


// declare compass variable
//LSM303 compass;
// declare bmp085 variable
Adafruit_BMP085 bmp;
boolean sensorContinuous = false;
// declare servo variables
Servo daServo;
int servoPin = 9;
int servoVal = 90;


void setup(){
    // start Serial
    Serial.begin( 9600 );
    while(!Serial);
    Serial.setTimeout( 30 );
    Wire.begin();
    // init compass
//    compass.init();
//    compass.enableDefault();
//    compass.m_min = (LSM303::vector<int16_t>) { -1050,  -1266,   -142};    
//    compass.m_max = (LSM303::vector<int16_t>) {  -160,   -341,    -23};

    //compass.m_min = (LSM303::vector<int16_t>){  -543,   -465,   -384};
    //compass.m_max = (LSM303::vector<int16_t>){  +313,   +418,   +312};

     //init bmp085
    if (!bmp.begin()) {
	    Serial.println("Could not find a valid BMP085 sensor, check wiring!");
	while (1) {}
  }
    // reset servo
    daServo.attach( servoPin );
    daServo.write( servoVal );

} 




void loop() {
//    compass.read();
    delay(20);
    while( Serial.available() > 0 ) {        
      String msg = Serial.readString();
        int cmd = msg.substring(0,1).toInt( );
        if( cmd == 0 ) pan( 'l' );
        else if( cmd == 1 ) pan( 'r' );
        else if( cmd == 2 ) reportSensor(); 
        else if( cmd == 3 ) sensorContinuous = true;
        else if( cmd == 4 ) sensorContinuous = false;
    }
    if( sensorContinuous ) reportSensor();
}



void pan( char dir ) {
    if( dir == 'l' ) {// pan left
        if( servoVal > 20 ) {
            servoVal -= 10;
            if( servoVal < 20 ) servoVal = 20; // constrain
            daServo.write( servoVal );
        } else {
            Serial.println( "{\"msg\":\"SOR\"}" ); // servo out of range
            Serial.flush();
        }   
    } else if ( dir == 'r' ) { // pan right  
        if( servoVal < 160 ) {
           servoVal += 10;
           if( servoVal >= 160 ) servoVal = 160;
           daServo.write( servoVal );
        } else {
            Serial.println( "{\"msg\":\"SOR\"}" );
            Serial.flush();  
        }
    }
    delay( 50 );
}

void reportSensor() {
//    Serial.print( "{\"Heading\":" );
//    Serial.print( compass.heading() );
    Serial.print( "{\"Temperature\":" );
    Serial.print( bmp.readTemperature() );
    Serial.print( ",\"Pressure\":" );
    Serial.print( bmp.readPressure() );
    Serial.println( "}" );
    Serial.flush();
    delay( 50 );
}
