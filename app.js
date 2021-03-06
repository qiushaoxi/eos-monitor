const superagent = require('superagent');
const config = require('./config.json');
const moment = require('moment');
const shell = require("shelljs");
const mail = require('./tools/mail');

const restart_script = config.restart_script;
var producer = config.producer;
var my_last_block_timestmp = Date.now();

var restart_flag = false;
var mail_flag = false;

function is_time_out(time, timeout) {
    let gap = Date.now() - time;
    if (gap > timeout) {
        return true;
    } else {
        return false;
    }

}

function safelyParseJSON(json) {
    // This function cannot be optimised, it's best to
    // keep it small!
    let parsed

    try {
        parsed = JSON.parse(json)
    } catch (e) {
        // Oh well, but whatever...
        logger.error(e);
    }

    return parsed // Could be undefined!
}

function sendmail(title, message) {
    if (mail_flag) {
        return;
    } else {
        mail_flag = true;
        mail.sendMail(title, message);
        setTimeout(() => {
            restart_flag = false;
        }, config.mail_time);
    }

}
function restart(node) {
    //do not restart when restarting
    sendMail(node.name, node.url);
    if (restart_flag) {
        return;
    } else {
        console.error("restarting", moment(Date.now()));
        restart_flag = true;
        shell.exec(node.restart_script);
        setTimeout(() => {
            restart_flag = false;
        }, config.restart_time);
    }
}

function check_node(node) {

    let url = node.url + "/v1/chain/get_info";
    let name = node.name;

    superagent.post(url)
        .end((err, res) => {
            if (err) {
                console.error(err);
                restart(node);
                return;
            }
            if (!res) {
                console.error("res is null");
                restart(node);
                return;
            }
            let result = safelyParseJSON(res.text);

            console.log('=======================');
            console.log(result.head_block_producer);
            console.log(result.head_block_num);

            let block_timestmp = moment(result.head_block_time + "Z").valueOf();
            console.log("time interval from last block:", ((Date.now() - block_timestmp) / 1000).toFixed(2) + " s");

            let timeout_flag = is_time_out(block_timestmp, config.timeout);
            console.log("time out?", timeout_flag);
            if (timeout_flag) {
                restart(node);
                return;
            }

            // record my block
            if (result.head_block_producer == producer) {
                my_last_block_timestmp = block_timestmp
            }
            console.log("my_last_block_time:", ((Date.now() - my_last_block_timestmp) / 60000).toFixed(2) + " min")

            let produce_timeout_flag = is_time_out(my_last_block_timestmp, config.produce_timeout);
            console.log("produce time out?", produce_timeout_flag);
            if (produce_timeout_flag) {
                restart(node);
                return;
            }

        });
}

console.log("start moniting!");
setInterval(() => {
    for (let i = 0; i < config.nodes.length; i++) {
        check_node(config.nodes[i]);
    }
}, 3000);

