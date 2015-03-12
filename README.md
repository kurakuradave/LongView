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
