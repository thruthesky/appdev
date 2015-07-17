var deviceReady = false;
document.addEventListener('deviceready', onDeviceReady, false);
function onDeviceReady() {
    deviceReady = true;
    if ( typeof callback_deviceReady == 'function' ) callback_deviceReady();
}
