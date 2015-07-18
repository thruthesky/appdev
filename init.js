var deviceReady = false;
var deviceID = null;
document.addEventListener('deviceready', onDeviceReady, false);
function onDeviceReady() {
    deviceReady = true;
    deviceID = getDeviceID();
    trace("onDeviceRead()");
    trace("deviceID : " + deviceID);
    if ( typeof callback_deviceReady == 'function' ) callback_deviceReady();
}
