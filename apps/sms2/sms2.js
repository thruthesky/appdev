var url_server = 'http://sap.withcenter.com'; // SMSGate Server which has Message Database.
var url_load_sms = url_server + '/smsgate/sender/load';
var url_report_result = url_server + '/smsgate/sender/result';
/**
 *
 * Next SMS will be sent within this seconds ( after sending one )
 *
 *  $minimum_wait is the minimum interval to send next SMS.
 *  A random seconds between 0 to $interval will be added to $minimum_wait
 *
 *  - For test, set it to 3 both minimum_wait and interval.
 *  - For production, set it to 30.
 */
var minimum_wait = 1;
var interval = 2;
var count_run = 0;
var count_no_data = 0;
var count_success = 0;
var count_fail = 0;
var count_error_loading = 0;
var count_error_recording = 0;
var second = 1000;
var count_next_send = 0;
var pause_after_send = 10;
$(function(){
    init_app();
    count_how_many_seconds_left_for_next_sms_sending();
});

/**
 * Device is ready callback
 *
 * - Runs SMS sending loop on device is ready
 * - And it runs forever.
 *
 */
function callback_deviceReady() {
    init_display();
    if ( getDeviceID() ) {
        begin_sms_sending_loop();
    }
}


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
function count_how_many_seconds_left_for_next_sms_sending() {

    setInterval(function () {
        --count_next_send;
        if (count_next_send < -60) dev.refresh();
        $(".row.count-next-send span").text(count_next_send);
    }, 1000);
}



function init_display() {
    if ( deviceID ) {
        setDisplayDeviceID();
    }
    else {
        setDisplayStatus("<b style='color:red;'>No Device ID : Check if device plugin is set.</b>")
    }
}

function begin_sms_sending_loop()
{
    send_new_sms();
}






function init_app() {

    /**
     * @life-cycle - it first sets the header, footer and buttons
     */
    setHeader('SMS2 Sender');
    setTopButtonLeft('Reload');
    setFooter('SMSGate Client Version 2');

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
    markup += "<div class='row total-record'><b>Total Record</b><span></span></div>";
    markup += "<div class='row success'><b>Success</b><span></span></div>";
    markup += "<div class='row fail'><b>Fail</b><span></span></div>";
    markup += "<div class='row error-loading'><b>Error SMS Loading</b><span></span></div>";
    markup += "<div class='row error-recording'><b>Error Result Recording</b><span></span></div>";
    markup += "<div class='row count-next-send'><b>Next Send Within</b><span></span></div>";
    markup += "<div class='row status'><b>Status</b><span></span></div>";
    markup += "</div>";
    setPage(markup);

    setDisplayRun(0);
    setDisplayNoData(count_no_data);
    setDisplaySuccess(count_success);
    setDisplayFail(count_fail);
    setDisplayErrorAjaxLoading(count_error_loading);
    setDisplayErrorAjaxRecording(count_error_recording);



    /*
    $('.info').append('<ul>');
    $('.info').append("<li>TODO : Show number of SMS in queue</li>");
    $('.info').append('</ul>');
    */


}



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
function setDisplayTotalRecord(no) {
    $('.row.total-record span').html(no);
}




function rand_interval() {
    return Math.floor((Math.random() * interval) + 1) + minimum_wait;
}






/**
 *
 * Sends an SMS
 *
 * - it is called to send a new SMS ( maybe after finishing one SMS )
 *
 */
function send_new_sms() {
    clearDisplayStatus();

    // for test, make it short.
    var seconds = rand_interval() * second; // it should be 1,100
    setDisplayStatus("Sending new SMS after sleeping for " + (seconds/1000) + " seconds");
    setDisplayRun(++count_run);
    count_next_send = parseInt(seconds/1000);
    setTimeout(load_sms_data_from_server, seconds );
}




/**
 * Loads an SMS message data from SMSGate Server
 *
 *      - It is called by send_new_sms()
 *      - This function does not actually send SMS,
 *          - It only loads SMS data from server and pass it to emit_sms_data().
 *
 *      - If there is error on loading SMS data from server, it finishes the cycle and wait for next sms sending.
 */
function load_sms_data_from_server() {
    var url = url_load_sms + '?sender=' + deviceID;
    setDisplayStatus("Loading SMS data from Server:");
    //setDisplayStatus(url);
    ajax_api(url, function(re){
        if ( re == 'promise.failed' ) {
            setDisplayStatus("Fail : Loading sms data from server has been failed.");
            setDisplayErrorAjaxLoading(++count_error_loading);
            return callback_sms_send_finished();
        }
        else if ( re.error == -409 ) {
            setDisplayStatus('<b style="color:red;">'+re.message+'</b>');
            setDisplayNoData(++count_no_data);
            return callback_sms_send_finished();
        }
        else if ( re.error ) {
            // @todo It is a different error. Need to handle.
            // It is not ajax loading erro nor no-data error.
            setDisplayStatus("Error from server: " + re.message);
            return callback_sms_send_finished();
        }
        else {
            emit_sms_data(re);
        }
    });
}

/**
 *
 * It actually send SMS Txt message on mobile(sender)
 *      - It reports to the server whether it succeeds or not.
 *
 *      - If there is an error sending SMS TXT to other mobile
 *          -- This may be caused by the CORDOVA-SMS-PLUGIN itself,
 *          -- It refreshes the app(page) after 60 seconds from the time that the plugin has no response.
 *              --- so, it may begin the work.
 *
 */
function emit_sms_data(re) {

    setDisplayStatus("emit_sms_data() : Emitting SMS data");
    trace(re);
    if ( checkNumber(re) ) return callback_sms_send_finished();
    if ( checkMessage(re) ) return callback_sms_send_finished();
    setDisplayStatus('number: ' + re.number);
    setDisplayStatus('message: ' + re.message);
    setDisplayTotalRecord(re.total_record);



    var messageInfo = {
        phoneNumber: re.number,
        textMessage: re.message
    };

    if ( isTestDevice() ) {
        re.result = 'Y';
        setDisplayStatus("It's a test device. faking SMS sent with result: " + re.result);
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

function checkNumber(re) {
    if ( typeof re.number == 'undefined' || re.number == '' ) {
        trace("No number in SMS data.");
        return true;
    }
    else return false;
}
function checkMessage(re) {
    if ( typeof re.message == 'undefined' || re.message == '' ) {
        trace("No message in SMS data.");
        return true;
    }
    else return false;
}
function isTestDevice() {
    return deviceModel == 'Chrome';
}



/**
 *
 *
 * Reports to the Server with the result of SMS sending
 *
 *
 * @param re
 *
 */
function record_sms_send_result(re) {
    var url = get_url_report_result(re);
    count_result(re);
    ajax_api(url, function(re){
        trace('Recording sms result : ...');
        if ( re == 'promise.failed' ) {
            setDisplayStatus("Connecting to SMSGate Server has been failed.");
            setDisplayErrorAjaxRecording(++count_error_recording);
            return callback_sms_send_finished();
        }
        if ( re.error ) {
            setDisplayStatus(re.message);
            setDisplayErrorAjaxRecording(++count_error_recording);
            callback_sms_send_finished();
        }
        else {
            setDisplayStatus("sms send result - recorded.");
            callback_sms_send_finished();
        }


    });
}
function get_url_report_result(re) {
    var url = url_report_result;
    url += '?idx=' + re.idx;
    url += '&result=' + re.result;
    url += '&sender=' + deviceID;
    return url;
}
function count_result(re) {
    if ( re.result == 'Y' ) setDisplaySuccess(++count_success);
    else setDisplayFail(++count_fail);
    setDisplayStatus("Recording the result of SMS sending: result="+re.result);
}




function callback_sms_send_finished() {
    setDisplayStatus("Sending SMS finished. Pause "+(pause_after_send*1000)+" seconds.");
    setTimeout(send_new_sms, pause_after_send * 1000);
}
