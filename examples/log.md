
# Test method

```
#Use localhost tcp
./node-service-api
```

Should preset connection href in node-service-client file
```
var server = 'nats:///Volumes/user/gnats.sock';
var nats = require('nats').connect(server);
//var nats = require('nats').connect();
```
```
#Use unixsock or localhost tcp
./node-service-client 
```

## node-service-client prints

### 20171216
Using unixsock:
```
bogon:examples youlins$ ./node-service-client 
Listening on nats:///Volumes/user/gnats.sock, msgCnt 100000 msgSize 1000
Begin time : 1513383517540
End time : 1513383543725, spend time 26185
bogon:examples youlins$ ./node-service-client 
Listening on nats:///Volumes/user/gnats.sock, msgCnt 100000 msgSize 1000
Begin time : 1513383558379
End time : 1513383584801, spend time 26422
bogon:examples youlins$ ./node-service-client 
Listening on nats:///Volumes/user/gnats.sock, msgCnt 100000 msgSize 1000
Begin time : 1513383590288
End time : 1513383616368, spend time 26080
```
Using localhost tcp:
```
bogon:examples youlins$ ./node-service-client 
Listening on nats://localhost:4222, msgCnt 100000 msgSize 1000
Begin time : 1513383635579
End time : 1513383666241, spend time 30662
bogon:examples youlins$ ./node-service-client 
Listening on nats://localhost:4222, msgCnt 100000 msgSize 1000
Begin time : 1513383671147
End time : 1513383700878, spend time 29731
bogon:examples youlins$ ./node-service-client 
Listening on nats://localhost:4222, msgCnt 100000 msgSize 1000
Begin time : 1513383705085
End time : 1513383736511, spend time 31426
```

Fill the test data in cmp file:
```
var LocalhostAvg = (31426 + 29731 + 30662)
var UnixsockAvg = (26185 + 26422 + 26080)
```

```
bogon:examples youlins$ ./cmp 
Spendtime Unixsock/Localhost => 32777.5/45909.5
0.7139589845239003
```

