var url_server = 'http://dev.withcenter.com';
var count_run = 0;
var count_no_data = 0;
var count_success = 0;
var count_fail = 0;
var count_error_loading = 0;
var count_error_recording = 0;

function callback_deviceReady() {
    begin_sms_sending_loop();
    setDisplayDeviceID();
}
$(function(){
    setHeader('SMS Sender');
    setFooter('SMSGate Client');
    // begin_sms_sending_loop(); // BUG : It must be ran after device is ready.

    var markup = "<div class='info'>";
    markup += "<div class='row device-id'>Device ID: <span>"+deviceID+"</span></div>";
    markup += "<div class='row run'>Run: <span></span></div>";
    markup += "<div class='row no-data'>No data: <span></span></div>";
    markup += "<div class='row success'>Success: <span></span></div>";
    markup += "<div class='row fail'>Fail: <span></span></div>";
    markup += "<div class='row error-loading'>Error SMS Loading: <span></span></div>";
    markup += "<div class='row error-recording'>Error Result Recording: <span></span></div>";
    markup += "<div class='row status'>Status: <span></span></div>";
    markup += "</div>";
    setPage(markup);



    setDisplayNoData(count_no_data);
    setDisplaySuccess(count_success);
    setDisplayFail(count_fail);
    setDisplayErrorAjaxLoading(count_error_loading);
    setDisplayErrorAjaxRecording(count_error_recording);
});

function setDisplayDeviceID() {
    $('.row.device-id span').html(deviceID);
}
function clearDisplayStatus() {
    $('.row.status span').html('');
}
function setDisplayStatus(msg) {
    trace(msg);
    $('.row.status span').append(msg + '<br>');
}
function setDisplayRun(no) {
    $('.row.run span').html(no);
}
function setDisplayErrorAjaxLoading(no) {
    $('.row.error-loading span').html(no);
}
function setDisplayErrorAjaxRecording(no) {
    $('.row.error-recording span').html(no);
}
function setDisplaySuccess(no) {
    $('.row.success span').html(no);
}
function setDisplayFail(no) {
    $('.row.fail span').html(no);
}
function setDisplayNoData(no) {
    $('.row.no-data span').html(no);
}

function begin_sms_sending_loop()
{
    send_new_sms();
}


function send_new_sms() {
    clearDisplayStatus();
    var rand_second = Math.floor((Math.random() * 30) + 1) + 30;
    // for test, make it short.
    var seconds = rand_second * 100;
    setDisplayStatus("Sending new SMS after sleeping for " + (seconds/1000) + " seconds");
    setDisplayRun(++count_run);
    setTimeout(load_sms_data_from_server, seconds );
}

function callback_sms_send_finished() {
    setTimeout(send_new_sms, 3000);
}

function load_sms_data_from_server() {
    var url = url_server + '/smsgate/loadData?sender=' + deviceID;
    trace('load_sms_data_from_server()');
    setDisplayStatus("Loading an SMS data from Server");
    ajax_api(url, function(re){
        trace('load_sms_data_from_server()');
        if ( re == 'promise.failed' ) {
            setDisplayStatus("Fail : Loading sms data from server has been failed.");
            setDisplayErrorAjaxLoading(++count_error_loading);
            return callback_sms_send_finished();
        }
        else if ( re.length == 0 ) {
            setDisplayStatus("Warning : No SMS data loaded from the server.")
            setDisplayNoData(++count_no_data);
            return callback_sms_send_finished();
        }
        else {
            trace(re);
            emit_sms_data(re);
        }
    });
}

function emit_sms_data(re) {
    setDisplayStatus("Emitting SMS data");
    if ( typeof re.number == 'undefined' || re.number == '' ) {
        trace("No number in SMS data.");
        return callback_sms_send_finished();
    }
    if ( typeof re.message == 'undefined' || re.message == '' ) {
        trace("No message in SMS data.");
        return callback_sms_send_finished();
    }
    setDisplayStatus('number: ' + re.number);
    setDisplayStatus('message: ' + re.message);
    var messageInfo = {
        phoneNumber: re.number,
        textMessage: re.message
    };
    setDisplayStatus("Emitting Now:");
    sms.sendMessage(messageInfo, success_callback_sendMessage, failure_callback_sendMessage);
    function success_callback_sendMessage(message) {
        setDisplayStatus("Emitting success: " + message);
        re.result = 'Y';
        record_sms_send_result(re);
    }
    function failure_callback_sendMessage(error) {
        trace.log("error on sending sms: ...");
        trace.log(error);
        console.log("code: " + error.code + ", message: " + error.message);
        re.result = 'N';
        record_sms_send_result(re);
    }
}

function record_sms_send_result(re) {
    var url = url_server + '/smsgate/record_send_result';
    url += '?id=' + re.id;
    url += '&result=' + re.result;
    url += '&sender=' + deviceID;
    if ( re.result == 'Y' ) setDisplaySuccess(++count_success);
    else setDisplayFail(++count_fail);
    setDisplayStatus("Recording the result of SMS sending: result="+re.result);
    ajax_api(url, function(re){
        trace('Recording sms result : ...');
        if ( re == 'promise.failed' ) {
            setDisplayStatus("Recording sms send result to server has been failed.");
            setDisplayErrorAjaxRecording(++count_error_recording);
            callback_sms_send_finished();
        }
        else {
            setDisplayStatus("sms send result - recorded.");
            callback_sms_send_finished();
        }
    });
}
