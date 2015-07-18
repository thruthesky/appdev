var url_server = 'http://sonub.org';
function callback_deviceReady() {

}
$(function(){
    setHeader();
    setFooter();
    SendSMS();
});


function SendSMS() {
    trace("SendSMS :");
    var rand_second = Math.floor((Math.random() * 30) + 1) + 30;
    setTimeout(LoadSMSData, rand_second * 100 );
}

function callback_FinishSMS() {
    SendSMS();
}

function LoadSMSData() {
    ajax_api(url_server + '/smsgate/loadData', function(re){
        trace('LoadSMSData : loading Data...');
        trace(re);
        EmitSMSData(re);
    });
}

function EmitSMSData(re) {
    trace("EmitSMSData(re) : ");
    trace(re);
    var messageInfo = {
        phoneNumber: re.number,
        textMessage: re.message
    };

    re.result = 'Y';
    recordSMSResult(re);

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

function recordSMSResult(re) {
    var url = url_server + '/smsgate/record_send_result';
    url += '?id=' + re.id;
    url += '&result=' + re.result;
    trace("recording url : " + url);
    ajax_api(url, function(re){
        trace('Recording sms result : ...');
        trace(re);
    });
    callback_FinishSMS();
}