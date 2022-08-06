import express from 'express';
import NodeCache from 'node-cache';
var port = 3000;
var app = express();
var cache = new NodeCache({ stdTTL: 15 }); // This could be a redis cache for a distributed system
// These next two variables could be stored in azure configs and stored in a cache as well
var bucketSize = 4; // Here we could import some rule through Azure config's
var bucketRefreshRate = 1000; // milliseconds. This could also be imported through azure configs as a rule
var refillBucket = function () {
    setTimeout(function () {
        refillBucket();
        // console.log("bucket Refresh called");
    }, 1000);
    var keys = cache.keys();
    for (var i = 0; i < keys.length; i++) {
        console.log('val: ', cache.get(keys[i]));
        var currentVal = cache.get(keys[i]);
        if (currentVal + 1 >= bucketSize) {
            cache.del(keys[i]);
            console.log('bucket full, deleting');
        }
        else {
            cache.set(keys[i], currentVal + 1);
            console.log('incrementing bucket for key');
        }
    }
};
refillBucket();
var checkIP = function (req, res, next) {
    try {
        var ip = req.ip;
        if (cache.has(ip)) {
            var reqsMade = cache.get(ip);
            console.log('len: ', cache.keys().length);
            if (reqsMade - 1 >= 0) {
                res.set({
                    'x-ratelimit-remaining': reqsMade - 1,
                    'x-ratelimit-limit': bucketSize,
                });
                cache.set(ip, reqsMade - 1);
                next();
            }
            else {
                res.set({
                    'x-ratelimit-remaining': 0,
                    'x-ratelimit-limit': bucketSize,
                    'x-ratelimit-retry-after': bucketRefreshRate,
                });
                res.sendStatus(429);
            }
            console.log("We have ".concat(ip));
        }
        else {
            cache.set(ip, bucketSize - 1);
            res.set({
                'x-ratelimit-remaining': bucketSize - 1,
                'x-ratelimit-limit': bucketSize,
            });
            next();
            console.log("We don't have the IP");
        }
    }
    catch (err) {
        throw new Error(err);
    }
};
app.get('/', checkIP, function (req, res) {
    // console.log(req.ip);
    res.send('Success!');
});
app.listen(port, function () {
    console.log("Example app listening on port ".concat(port));
});
//# sourceMappingURL=app.js.map