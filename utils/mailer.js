var mandrill = require('mandrill-api');
var config = require('../config');

exports.sendEmail = function(to, template_name, vars, fn) {
    console.log('senfing email')
    var mandrill_client = new mandrill.Mandrill(config.mandrill.apiKey);
    var params = {
        "template_name": template_name,
        "template_content": vars.content,
        "message": {
            "to": [{
                "email": to.email,
            }],
            "global_merge_vars": vars.merge,
            "merge_vars": [{
                "rcpt": to.email,
                "vars": vars.merge
            }]
        }
    };

    if(vars.replyTo){
        params.message.headers = {};
        params.message.headers['Reply-To'] = vars.replyTo;
    }

    console.log('sending email')
    mandrill_client.messages.sendTemplate(params, function (res) {
        console.log('email sent')
        if (fn) fn(null, res);
    }, function (err) {
        if (fn) fn(err, null);
    });
};