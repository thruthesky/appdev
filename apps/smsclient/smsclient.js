var url_server = 'http://sonub.org';
function callback_deviceReady() {

}
$(function(){
    setHeader();
    setFooter();
    begin_sms_sending_loop();
});


function begin_sms_sending_loop()
{
    send_new_sms();
}


function send_new_sms() {
    var rand_second = Math.floor((Math.random() * 30) + 1) + 30;
    // for test, make it short.
    var seconds = rand_second * 100;
    trace("send_new_sms : sleep for " + (seconds/1000) + " seconds");
    setTimeout(load_sms_data_from_server, seconds );
}

function callback_sms_send_finished() {
    send_new_sms();
}

function load_sms_data_from_server() {
    ajax_api(url_server + '/smsgate/loadData', function(re){
        trace('load_sms_data_from_server()');
        if ( re == 'promise.failed' ) {
            trace("loading sms data from server has been failed.");
            send_new_sms();
        }
        else if ( re.length == 0 ) {
            trace("No SMS data loaded from the server.")
            send_new_sms();
        }
        else {
            trace(re);
            emit_sms_data(re);
        }
    });
}

function emit_sms_data(re) {
    trace("emit_sms_data(re)");
    if ( typeof re.number == 'undefined' || re.number == '' ) {
        trace("No number in SMS data.");
        return send_new_sms();
    }
    if ( typeof re.message == 'undefined' || re.message == '' ) {
        trace("No message in SMS data.");
        return send_new_sms();
    }
    trace(re);
    var messageInfo = {
        phoneNumber: re.number,
        textMessage: re.message
    };

    re.result = 'Y';
    record_sms_send_result(re);

    /*
     sms.sendMessage(messageInfo, function(message) {
     trace.log("success: " + message);
     re.result = 'Y';
     recordSMSResult(re);
     }, function(error) {
     trace.log("error on sending sms: ...");
     trace.log(error);
     re.result = 'N';
     recordSMSResult(re);
     });
     */
}

function record_sms_send_result(re) {
    var url = url_server + '/smsgate/record_send_result';
    url += '?id=' + re.id;
    url += '&result=' + re.result;
    trace("recording url : " + url);
    ajax_api(url, function(re){
        trace('Recording sms result : ...');

        if ( re == 'promise.failed' ) {
            trace("recording sms send result to server has been failed.");
            send_new_sms();
        }
        else {
            trace("sms send result - recorded.");
            callback_sms_send_finished();
        }

    });
}