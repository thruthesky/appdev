function trace(msg) {
    console.log(msg);
}

function onDeviceReady() {
    trace('device is ready now');
    $('.page .content').append('<h1>Device is ready now</h1>');
}


/**
 * ajax api call for portal
 *
 * @param qs - query string with GET METHOD data.
 * @param callback_function
 *
 * @code
 *
 * @endcode
 * @Attention This method saved the returned-data from server into Web Storage IF qs.cache is set to true.
 *
 *  - and it uses the stored data to display on the web browser,
 *  - after that, it continues loading data from server
 *  - when it got new data from server, it display onto web browser and update the storage.
 *
 */
function ajax_api( url, callback_function )
{
    console.log('ajax_api:' + url);
    var promise = $.ajax( { url : url } );
    promise.done( function( re ) {
        //console.log("promise.done() : callback function : " + callback_function);
        try {
            var data = JSON.parse(re);
            callback_function( data )
        }
        catch (e) {
            console.log(re);
        }
    });

    promise.fail( function( re ) {
        // alert('ajax call - promise failed');
        console.log("promise failed...");
        console.log(re);
    });
}