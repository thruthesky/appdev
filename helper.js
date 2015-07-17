function trace(msg) {
    console.log(msg);
}

function onDeviceReady() {
    trace('device is ready now');
    $('body').append('<h1>Device is ready now</h1>');
}