//var url_server = 'http://sonub.org';
var url_server = 'http://dev.withcenter.com';
var count_run = 0;
var count_no_data = 0;
var count_success = 0;
var count_fail = 0;
var count_error_loading = 0;
var count_error_recording = 0;
var interval = 30;
var second = 1000;
var count_next_send = 0;


/**
 * @life-cycle It runs SMS sending loop when the device is ready.
 *
 *      - and it runs forever.
 *
 */
function callback_deviceReady() {
    if ( deviceID ) {
        setDisplayDeviceID();
        begin_sms_sending_loop();
    }
    else {
        setDisplayStatus("<b style='color:red;'>No Device ID : Check if device plugin is set.</b>")
    }
}
function on_top_left_button_click() {
    var date = new Date().getTime();
    document.location.href = 'index.html?stamp=' + date;
}

$(function(){
    /**
     * @life-cycle - it first sets the header, footer and buttons
     */
    setHeader('SMS Sender');
    setTopButtonLeft('Reload');
    setFooter('SMSGate Client');

    /**
     * @life-cycle It sets contents
     * @type {string}
     */
    var date = new Date().toString();
    var markup = "<div class='info'>";
    markup += "<div class='row url-server'><b>Server URL</b><span>"+url_server+"</span></div>";
    markup += "<div class='row url-server'><b>Interval</b><span> Random between 0 ~ "+interval+" + 30 seconds</span></div>";
    markup += "<div class='row device-id'><b>Device ID</b><span>"+deviceID+"</span></div>";
    markup += "<div class='row start'><b>Started</b><span>"+date+"</span></div>";
    markup += "<div class='row run'><b>Run</b><span></span></div>";
    markup += "<div class='row no-data'><b>No data</b><span></span></div>";
    markup += "<div class='row success'><b>Success</b><span></span></div>";
    markup += "<div class='row fail'><b>Fail</b><span></span></div>";
    markup += "<div class='row error-loading'><b>Error SMS Loading</b><span></span></div>";
    markup += "<div class='row error-recording'><b>Error Result Recording</b><span></span></div>";
    markup += "<div class='row count-next-send'><b>Next Send Within</b><span></span></div>";
    markup += "<div class='row status'><b>Status</b><span></span></div>";
    markup += "</div>";
    setPage(markup);
    setDisplayNoData(count_no_data);
    setDisplaySuccess(count_success);
    setDisplayFail(count_fail);
    setDisplayErrorAjaxLoading(count_error_loading);
    setDisplayErrorAjaxRecording(count_error_recording);


    /**
     * @note counts how many seconds left for next SMS sending.
     * @Attention
     *      This continues on minus value on calling the SMS plugin to send SMS TXT message.
     * @life-cycle
     *      - It displays the seconds left for next trial of SMS sedning.
     *      - If there is a problem on the SMS plugin, it will cross over -60,
     *          This is considered as malfunctioning of the SMS plugin.
     *          Then it just refreshes.
     */
    setInterval(function(){
        --count_next_send;
        if ( count_next_send < -60 ) dev.refresh();
        $(".row.count-next-send span").text(count_next_send);
    }, 1000);
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


/**
 * @life--cycle
 *
 *      - it is called to send a new SMS ( maybe after finishing one SMS )
 *
 */
function send_new_sms() {
    clearDisplayStatus();
    var rand_second = Math.floor((Math.random() * interval) + 1) + 30;
    // for test, make it short.
    var seconds = rand_second * second; // it should be 1,100
    setDisplayStatus("Sending new SMS after sleeping for " + (seconds/1000) + " seconds");
    setDisplayRun(++count_run);
    count_next_send = parseInt(seconds/1000);
    setTimeout(load_sms_data_from_server, seconds );
}


function callback_sms_send_finished() {
    setDisplayStatus("Sending SMS finished. Pause 3 seconds.");
    setTimeout(send_new_sms, 3000);
}

/**
 * @life-cycle
 *
 *      - It is called by send_new_sms()
 *      - This function does not actually send SMS,
 *          - It only loads SMS data from server and pass it to emit_sms_data().
 *
 *      - If there is error on loading SMS data from server, it finishes the cycle and wait for next sms sending.
 */
function load_sms_data_from_server() {
    var url = url_server + '/smsgate/loadData?sender=' + deviceID;
    setDisplayStatus("Loading SMS data from Server:");
    setDisplayStatus(url);
    ajax_api(url, function(re){
        if ( re == 'promise.failed' ) {
            setDisplayStatus("Fail : Loading sms data from server has been failed.");
            setDisplayErrorAjaxLoading(++count_error_loading);
            return callback_sms_send_finished();
        }
        else if ( re.length == 0 ) {
            setDisplayStatus("No SMS data from server")
            setDisplayNoData(++count_no_data);
            return callback_sms_send_finished();
        }
        else {
            trace(re);
            if ( typeof re.error != 'undefined' && re.error < 0 ) {
                setDisplayStatus("Error from server: " + re.message);
                //alert(re.message);
                return callback_sms_send_finished();
            }
            else emit_sms_data(re);
        }
    });
}

/**
 *
 * @param re
 * @returns {*}
 *
 * @life-cycle
 *
 *      - This function actually send SMS TXT message to other mobile phone.
 *      - On success or On fail, it reports to the server.
 *      - If there is an error sending SMS TXT to other mobile
 *          -- This may be caused by the CORDOVA-SMS-PLUGIN itself,
 *          -- It refreshes the app(page) after 60 seconds from the time that the plugin has no response.
 *              --- so, it may begin the work.
 *
 */
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
    if ( deviceModel == 'Chrome' ) {
        re.result = 'Y';
        setDisplayStatus("It's Chrome. So just pass with result: " + re.result);
        setTimeout(function(){
            record_sms_send_result(re);
        }, 1000);
    }
    else {
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
}

/**
 *
 * @param re
 *
 * @life-cycle
 *
 *      - whether it succeed or not, it reports to the server.
 */
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
