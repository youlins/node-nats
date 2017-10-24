"use strict";

var NATS = require('../');

function makeVow(opts, testparams, testFunction) {
    return function() {
        return new Promise(function (resolve, reject) {testFunction(opts, testparams, resolve, reject)});
    }
}

function pubSubTest(opts, testparams, resolve, reject) {
    var nc1 = NATS.connect(opts);
    var nc2 = NATS.connect(opts);

    var loop = testparams.messageCount;
    nc1.on('connect', function () {
        var received = 0;
        var start = new Date();

        nc1.subscribe('test', function () {
            received += 1;

            if (received === loop) {
                var stop = new Date();
                var mps = parseInt(loop / ((stop - start) / 1000), 10);
                if (size) {
                    console.log(`Publish/Subscribe Performance Test (${received}) MaxControlLineSize=${nc1.options.maxControlLineSize} ${mps} msgs/sec`);
                } else {
                    console.log(`Publish/Subscribe Performance Test (${received}) ${mps} msgs/sec`);
                }
                results.push(mps);
                nc1.close();
                nc2.close();
                resolve(true);
            }
        });

        // Make sure sub is registered
        nc1.flush(function () {
            for (var i = 0; i < loop; i++) {
                nc2.publish('test', 'ok');
            }
        });
    });
}


function subTest(opts, testparams, resolve, reject) {
    var c = NATS.connect(opts);

    var start;
    var loop = testparams.messageCount;
    var received = 0;

    c.subscribe('test', function () {
        received += 1;
        if (received === 1) {
            start = new Date();
        }
        if (received === loop) {
            var stop = new Date();
            var mps = parseInt(loop / ((stop - start) / 1000), 10);
            if (size) {
                console.log(`Subscribe Performance Test (${received}) MaxControlLineSize=${nc1.options.maxControlLineSize} ${mps} msgs/sec`);
            } else {
                console.log(`Subscribe Performance Test (${received}) ${mps} msgs/sec`);
            }
            results.push(mps);
            c.close();
            resolve(true);
        }
    });
}

function pubTest(opts, testparams, resolve, reject) {

    var c = NATS.connect(opts);
    var loop = testparams.messageCount;
    c.on('connect', function() {
        var start = new Date();
        var invalid2octet = new Buffer('\xc3\x28', 'binary');
        for (var i = 0; i < loop; i++) {
            c.publish('test', invalid2octet);
        }

        c.flush(function() {
            var stop = new Date();
            var mps = parseInt(loop / ((stop - start) / 1000), 10);
            if (size) {
                console.log(`Publish Performance Test (${loop}) MaxControlLineSize=${nc1.options.maxControlLineSize} ${mps} msgs/sec`);
            } else {
                console.log(`Publish Performance Test (${loop}) ${mps} msgs/sec`);
            }
            results.push(mps);
            c.close();
            resolve(true);
        });
    });
}

function usage(m) {
    if(m) {
        console.error(m);
    }

    var flags = [];
    flags.push('\t-s size - control line size [default is library default]');
    flags.push('\t-i count - number of iterations [default 1]');
    flags.push('\t-c count - number of messages to send [default 2 million]');
    flags.push('\t-t testname (pubsub | pub | sub)');

    console.log("node node-nats-bench [flags]")
    flags.forEach((s) => console.log(s));
    process.exit(m ? 1 : 0);
}


var results = [];
var iterations = 1;
var messageCount = 2000000;
var test;
var size;

for(var i=2; i < process.argv.length; i++) {
    var arg = process.argv[i];
    switch(arg) {
        case '-h':
            usage();
            break;
        case '-c':
            messageCount = parseInt(process.argv[++i]);
            break;
        case '-t':
            var name = process.argv[++i];
            switch(name) {
                case 'pubsub':
                    test = pubSubTest;
                    break;
                case 'sub':
                    test = subTest;
                    break;
                case 'pub':
                    test = pubTest;
                    break;
                default:
                    usage(`Unknown test ${name}`);
                    break;
            }
            break;
        case '-s':
            size = parseInt(process.argv[++i]);
            break;
        case '-i':
            iterations = parseInt(process.argv[++i]);
            break;
        default:
            usage(`Unknown flag ${arg}`);
            break;
    }
}

if(!test) {
    usage("No test specified");
}

// Print the node version
console.log(`Node Version: ${process.version}`);
if(test === subTest) {
    console.log("Waiting on %d messages", messageCount*iterations);
}

var tasks = [];
var opts = {};
if(size) {
    opts.maxControlLineSize = size;
}

var testparams = {};
testparams.messageCount = messageCount;

// add number of iterations
for(var i=0; i < iterations; i++) {
    tasks.push(makeVow(opts, testparams, test));
}

// add summary task
if(tasks.length > 1) {
    tasks.push(function () {
        var max = results.reduce((max, v) => max = v > max ? v : max);
        var min = results.reduce((min, v) => min = min > v ? v : min);
        var sum = results.reduce((sum, v) => sum += v);
        console.log(`max: ${max}  min: ${min} avg:`, sum / iterations);
    })
}
// add process exit
tasks.push(function() {process.exit();});

// run it
tasks.reduce((p, fn) => p.then(fn), Promise.resolve())
