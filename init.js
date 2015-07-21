var appdevInitLoad = true;
var deviceReady = false;
var deviceID = null;
var deviceModel = null;
document.addEventListener('deviceready', onDeviceReady, false);
function onDeviceReady() {
    deviceReady = true;
    deviceID = getDeviceID();
    deviceModel = getDeviceModel();
    trace("onDeviceRead()");
    trace("deviceID : " + deviceID);
    if ( typeof callback_deviceReady == 'function' ) callback_deviceReady();
}
