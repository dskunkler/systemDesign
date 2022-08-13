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
                    console.log('val: ', _this.cache.get(keys[i]));
                    var currentVal = _this.cache.get(keys[i]);
                    if (currentVal == null) {
                        continue;
                    }
                    if (currentVal + 1 >= _this.bucketSize) {
                        _this.cache.del(keys[i]);
                        console.log('bucket full, deleting');
                    }
                    else {
                        _this.cache.set(keys[i], currentVal + 1);
                        console.log('incrementing bucket for key');
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
                    console.log('ip is: ', ip);
                    if (_this.cache.has(ip)) {
                        var reqsMade = _this.cache.get(ip);
                        if (reqsMade == null) {
                            console.log('Requests for IP is undefined');
                            return;
                        }
                        console.log('len: ', _this.cache.keys().length);
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
                        console.log("We have ".concat(ip));
                    }
                    else {
                        console.log("We don't have the IP, Adding");
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
        this.express = express();
        this.routes();
        this.users = [
            { firstName: 'fnam1', lastName: 'lnam1', userName: 'username1' },
        ];
        // Load environments and validate
        // All of these could be retrieved from a cache
        this.ttl = process.env.TTL ? +process.env.TTL : -1;
        this.bucketSize = process.env.BUCKET_SIZE
            ? +process.env.BUCKET_SIZE
            : -1;
        this.bucketRefreshRate = process.env.BUCKET_REFRESH_RATE
            ? +process.env.BUCKET_REFRESH_RATE
            : -1;
        // Validate that .env is loading properly
        if (this.ttl == -1 ||
            this.bucketSize == -1 ||
            this.bucketRefreshRate == -1) {
            throw new Error('env not loading properly');
        }
        // Instantiate cache
        this.cache = new NodeCache({ stdTTL: this.ttl });
        if (this.cache == null) {
            throw new Error('Cache busted!');
        }
        // Start bucket refiller
        this.refillBucket();
    }
    App.prototype.routes = function () {
        this.express.get('/', function (req, res, next) {
            res.send('Typescript App works!!!');
        });
        // request to get all the users
        this.express.get('/tokenBucket', this.tokenBucketMiddleware(), function (req, res, next) {
            console.log('url:::::::' + req.url);
            res.send('Success');
        });
    };
    return App;
}());
exports["default"] = new App().express;
