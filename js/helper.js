var dev = {
    refresh: function() {
        this.reload();
    },
    reload: function() {
        var stamp = new Date().getTime();
        document.location.href="?stamp=" + stamp;
    }
};
function trace(msg) {
    console.log(msg);
}

function setHeader(msg) {
    var m = '<a href="#" class="top-button-left ui-btn-left ui-btn ui-btn-inline ui-mini ui-corner-all ui-btn-icon-left ui-icon-delete">Cancel</a>';
    m += '<h1>' + msg + '</h1>';
    m += '<button class="top-button-right ui-btn-right ui-btn ui-btn-b ui-btn-inline ui-mini ui-corner-all ui-btn-icon-right ui-icon-check">Save</button>';
    $('.page .header').html(m).toolbar('refresh');
}

function setTopButtonLeft(txt) {
    $('.page .header .top-button-left').html(txt);
}

function setFooter(msg) {
    var m = '';
    m += '<h1>' + msg + '</h1>';
    $('.page .footer').html(m).toolbar('refresh');
}

function setPage(markup) {
    $('.page .content').html(markup);
}

$(function(){
    $('body').on('click', '.page .header .top-button-left', function() {
        if ( typeof on_top_left_button_click == 'function' ) on_top_left_button_click();
    });
});

/**
 * ajax api call for portal
 *
 * @param url - URL with query string like GET METHOD data.
 * @param callback_function - a callback function
 *
 * @Attention it even calls the callback function after failing ajax loading.
 *
 *      - the parameter for callback function is 'promise.failed' if the ajax call failed.
 *
 * @code
            ajax_api(url_server + '/smsgate/loadData', function(re){
                trace('LoadSMSData : loading Data...');
                trace(re);
                EmitSMSData(re);
            });
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
            //trace(re);
            var data = JSON.parse(re);
            callback_function( data )
        }
        catch (e) {
            trace("Try catch exception:");
            console.log(re);
        }
    });

    promise.fail( function( re ) {
        // alert('ajax call - promise failed');
        //console.log("promise failed...");
        //console.log(re);
        callback_function( 'promise.failed' )
    });
}

/**    C O R D O V A ( P H O N E G A P ) Functions **/
function getDeviceID() {
    if ( deviceReady ) {
        if ( typeof device != 'undefined' ) {
            var model = getDeviceModel();
            var version = getDeviceVersion()
            var uuid = getDeviceUUID();
            var id = model + '-' + version;
            if ( uuid ) {
                id += '-' + uuid;
            }
            return id;
        }
        else {
            return false;
        }
    }
    else return 'ERROR-device-is-not-ready';
}
function getDeviceModel() {
    if ( typeof device == 'undefined' ) return alert('device plugin is missing...');
    return device.model;
}
function getDevicePlatform() {
    return device.platform;
}
function getDeviceUUID() {
    return device.uuid;
}
function getDeviceVersion() {
    return device.version;
}


