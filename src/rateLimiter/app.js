"use strict";
exports.__esModule = true;
var express = require("express");
require("dotenv/config");
var NodeCache = require("node-cache");
var App = /** @class */ (function () {
    function App() {
        var _this = this;
        // This monitors and refills the buckets
        this.refillBucket = function () {
            try {
                // Bucket will refill based on refresh rate
                setTimeout(function () {
                    _this.refillBucket();
                    // console.log("bucket Refresh called");
                }, _this.bucketRefreshRate);
                var keys = _this.cache.keys();
                for (var i = 0; i < keys.length; i++) {
                    // console.log('val: ', this.cache.get(keys[i]))
                    var currentVal = _this.cache.get(keys[i]);
                    if (currentVal == null) {
                        continue;
                    }
                    if (currentVal + 1 >= _this.bucketSize) {
                        _this.cache.del(keys[i]);
                        // console.log('bucket full, deleting')
                    }
                    else {
                        _this.cache.set(keys[i], currentVal + 1);
                        // console.log('incrementing bucket for key')
                    }
                }
            }
            catch (e) {
                console.log(e);
            }
        };
        this.leakBucket = function () {
            try {
                // Bucket will refill based on refresh rate
                setTimeout(function () {
                    _this.leakBucket();
                    // console.log("bucket Refresh called");
                }, _this.outflowRate);
                // Get all the keys in the cache
                var keys = _this.leakingCache.keys();
                // For every key get its queue
                for (var i = 0; i < keys.length; i++) {
                    // console.log('val: ', this.leakingCache.get(keys[i]))
                    var queue = _this.leakingCache.get(keys[i]);
                    // If queue is null try the next key
                    if (queue == null) {
                        console.log('Queue is null');
                        continue;
                    }
                    // If there is a queue and the size is greater then 0
                    if (queue.length > 0) {
                        // Grab the first message from the queue
                        var message = queue.shift();
                        // Validate that the message isn't null
                        if (message == null) {
                            throw new Error('undefined message in queue');
                        }
                        // Split it into its components
                        var req = message.req, res = message.res, next = message.next;
                        // Set the response
                        res.set({
                            'x-ratelimit-remaining': _this.bucketSize - queue.length,
                            'x-ratelimit-limit': _this.bucketSize
                        });
                        // Send the response
                        next();
                    }
                    else {
                        // If the queue length is 0, we don't need to monitor that key anymore
                        _this.leakingCache.del(keys[i]);
                    }
                }
            }
            catch (e) {
                console.log(e);
            }
        };
        // Token Bucket Logic
        this.tokenBucketMiddleware = function () {
            return function (req, res, next) {
                try {
                    var ip = req.ip;
                    // console.log('ip is: ', ip)
                    if (_this.cache.has(ip)) {
                        var reqsMade = _this.cache.get(ip);
                        if (reqsMade == null) {
                            console.log('Requests for IP is undefined');
                            return;
                        }
                        // console.log('len: ', this.cache.keys().length)
                        if (reqsMade - 1 >= 0) {
                            res.set({
                                'x-ratelimit-remaining': reqsMade - 1,
                                'x-ratelimit-limit': _this.bucketSize
                            });
                            _this.cache.set(ip, reqsMade - 1);
                            next();
                        }
                        else {
                            res.set({
                                'x-ratelimit-remaining': 0,
                                'x-ratelimit-limit': _this.bucketSize,
                                'x-ratelimit-retry-after': _this.bucketRefreshRate
                            });
                            res.sendStatus(429);
                        }
                        // console.log(`We have ${ip}`)
                    }
                    else {
                        // console.log(`We don't have the IP, Adding`)
                        _this.cache.set(ip, _this.bucketSize - 1);
                        res.set({
                            'x-ratelimit-remaining': _this.bucketSize - 1,
                            'x-ratelimit-limit': _this.bucketSize
                        });
                        next();
                    }
                }
                catch (err) {
                    throw new Error(err);
                }
            };
        };
        this.leakingTokenBucketMiddleware = function () {
            return function (req, res, next) {
                // console.log('in leaking middleware')
                try {
                    var ip = req.ip;
                    // console.log('leaking ip is: ', ip)
                    if (_this.leakingCache.has(ip)) {
                        // console.log('cache has IP')
                        var queue = _this.leakingCache.get(ip);
                        if (queue == null) {
                            console.log('Requests for IP is undefined');
                            return;
                        }
                        // console.log('len: ', this.leakingCache.keys().length)
                        // If we can add the message to our queue, add it. Otherwise drop it and send 429
                        if (queue.length < _this.bucketSize) {
                            // console.log('room in queue, adding req/res')
                            queue.push({ req: req, res: res, next: next });
                        }
                        else {
                            // console.log('no room in queue')
                            res.set({
                                'x-ratelimit-remaining': 0,
                                'x-ratelimit-limit': _this.bucketSize,
                                'x-ratelimit-retry-after': _this.outflowRate
                            });
                            res.sendStatus(429);
                        }
                    }
                    else {
                        // console.log(`We don't have the IP, Adding`)
                        var tqueue = [];
                        tqueue.push({ req: req, res: res, next: next });
                        // console.log('pushed onto temp queue')
                        _this.leakingCache.set(ip, tqueue);
                        // console.log('set the queue onto the leaking cache')
                    }
                }
                catch (err) {
                    throw new Error(err);
                }
            };
        };
        this.express = express();
        this.routes();
        // Load environments and validate
        // All of these could be retrieved from a cache
        this.ttl = process.env.TTL ? +process.env.TTL : -1;
        this.bucketSize = process.env.BUCKET_SIZE
            ? +process.env.BUCKET_SIZE
            : -1;
        this.bucketRefreshRate = process.env.BUCKET_REFRESH_RATE
            ? +process.env.BUCKET_REFRESH_RATE
            : -1;
        this.outflowRate = process.env.OUTFLOW_RATE
            ? +process.env.OUTFLOW_RATE
            : -1;
        // Validate that .env is loading properly
        if (this.ttl == -1 ||
            this.bucketSize == -1 ||
            this.bucketRefreshRate == -1 ||
            this.outflowRate == -1) {
            throw new Error('env not loading properly');
        }
        // Instantiate cache
        this.cache = new NodeCache({ stdTTL: this.ttl });
        this.leakingCache = new NodeCache({
            stdTTL: this.ttl,
            useClones: false
        });
        if (this.cache == null || this.leakingCache == null) {
            throw new Error('Cache is null!');
        }
        // Start bucket refiller
        this.refillBucket();
        // Start the leaking bucket
        this.leakBucket();
    }
    App.prototype.routes = function () {
        this.express.get('/', function (req, res, next) {
            res.send('Typescript App works!!!');
        });
        // request to get all the users
        this.express.get('/tokenBucket', this.tokenBucketMiddleware(), function (req, res, next) {
            res.send('Success');
        });
        this.express.get('/leakingTokenBucket', this.leakingTokenBucketMiddleware(), function (req, res, next) {
            res.send('Success');
        });
    };
    return App;
}());
exports["default"] = new App().express;
