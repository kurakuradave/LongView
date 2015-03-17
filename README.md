# LongView

LongView is a simple web/IoT/whatever-app that lets you:
* get real-time temperature and air pressure sensor data stream from a remote unit
* get near real-time imagery captured by a webcam on that remote unit
* pan the webcam left and right to look around
  
Remote unit can be a single-board computer ( Raspberry Pi / pcDuino / BeagleBoneBlack etc ), desktop or laptop. Just as long as it runs Node.js and has a USB port for communicating with an Arduino. Have fun! :)


LongView Server
* MEAN stack (MongoDB, Express, Angular and Node.js)
* Socket.IO

LongView Remote Unit
* Node.js app
* Node-Serialport for communicating with the Arduino via Serialport
* fswebcam for taking images with a webcam and saving them to files
* Socket.IO

LongView Sensor Unit
* Arduino UNO microcontroller
* Adafruit BMP085 Temperature and Air Pressure Sensor
* Hobby micro servo for panning the webcam


Building The Arduino Sensor Unit
Parts:
- Arduino UNO
- Hobby servo
- Adafruit Air Pressure and Temperature Breakout board BMP085

Wiring:

WARNING!!! Please double-check this with official documentation from Adafruit! 
Also, if you're not using UNO, the SDA and SCL pins are NOT on A4 and A5.
Find out where they are on your specific Arduino board from official Arduino documentation at www.arduino.cc

Arduino          Servo
+5V        <---   red cable
GND        <---   black cable
Digital 9  <---   signal cable (may be white/yellow/colors other than red and black)


Arduino          BMP085 breakout board
+5V        <---  VIN
GND        <---  GND
SDA/analog4 <--  SDA
SCL/analog5 <--  SDA

For the webcam, just use any ordinary uvc webcam on Linux.
If your remote unit is a laptop and it already has a camera on it, the webcam will be registered at /dev/video1. 
If your remote unit does not already have a camera, the webcam will be registered at /dev/video0.
Please remember to edit the code in CamUnit.js accordingly.
Also, on your remote unit, you need to install fswebcam first. Just execute
$ sudo apt-get install fswebcam 
or the equivalent of that for non debian-based distros


MongoDB 
Last but not least, on your server, please create a new MongoDB database  with the name "salome" and make sure it has a collection named "users", which has the following document:
{ username: "demo", passw: "omedomed" }


Have fun! :)
