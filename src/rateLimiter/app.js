"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var express = require("express");
var uuid = require("uuid");
require("dotenv/config");
var NodeCache = require("node-cache");
var App = /** @class */ (function () {
    function App() {
        var _this = this;
        // This monitors and refills the buckets
        this.refillBucket = function () { return __awaiter(_this, void 0, void 0, function () {
            var keys, i, currentVal;
            var _this = this;
            return __generator(this, function (_a) {
                try {
                    // Bucket will refill based on refresh rate
                    setTimeout(function () {
                        _this.refillBucket();
                        // console.log("bucket Refresh called");
                    }, this.bucketRefreshRate);
                    keys = this.cache.keys();
                    for (i = 0; i < keys.length; i++) {
                        currentVal = this.cache.get(keys[i]);
                        if (currentVal == null) {
                            continue;
                        }
                        if (currentVal + 1 >= this.bucketSize) {
                            this.cache.del(keys[i]);
                            // console.log('bucket full, deleting')
                        }
                        else {
                            this.cache.set(keys[i], currentVal + 1);
                            // console.log('incrementing bucket for key')
                        }
                    }
                }
                catch (e) {
                    console.log(e);
                }
                return [2 /*return*/];
            });
        }); };
        this.leakBucket = function () { return __awaiter(_this, void 0, void 0, function () {
            var keys, i, queue, message, req, res, next, e_1;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        // Bucket will refill based on refresh rate
                        console.log("timeout set");
                        return [4 /*yield*/, setTimeout(function () { return __awaiter(_this, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            console.log("timeout executed");
                                            return [4 /*yield*/, this.leakBucket()];
                                        case 1:
                                            _a.sent();
                                            return [2 /*return*/];
                                    }
                                });
                            }); }, this.outflowRate)];
                    case 1:
                        _a.sent();
                        console.log("Leaking bucket called");
                        keys = this.leakingCache.keys();
                        // For every key get its queue
                        if (keys.length == 0) {
                            return [2 /*return*/];
                        }
                        for (i = 0; i < keys.length; i++) {
                            queue = this.leakingCache.get(keys[i]);
                            // If queue is null try the next key
                            if (queue == null) {
                                console.log("Queue is null");
                                continue;
                            }
                            // If there is a queue and the size is greater then 0
                            if (queue.length > 0) {
                                // Grab the first message from the queue
                                console.log("queue has length: ".concat(queue.length));
                                message = queue.shift();
                                console.log("queue popped, new len: ".concat(queue.length));
                                // Validate that the message isn't null
                                if (message == null) {
                                    throw new Error("undefined message in queue");
                                }
                                req = message.req, res = message.res, next = message.next;
                                // Set the response
                                res.set({
                                    "x-ratelimit-remaining": this.bucketSize - queue.length,
                                    "x-ratelimit-limit": this.bucketSize
                                });
                                // Send the response
                                res.send(req.id);
                                // Save the shifted queue
                                this.leakingCache.set(keys[i], queue);
                                console.log("saved the shifted queue");
                            }
                            else {
                                // If the queue length is 0, we don't need to monitor that key anymore
                                console.log("queue length is 0");
                                this.leakingCache.del(keys[i]);
                                continue;
                            }
                        }
                        console.log("leaking bucket finishing");
                        return [3 /*break*/, 3];
                    case 2:
                        e_1 = _a.sent();
                        console.log(e_1);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); };
        // Token Bucket Logic
        this.tokenBucketMiddleware = function () {
            return function (req, res, next) {
                try {
                    var ip = req.ip;
                    // console.log('ip is: ', ip)
                    if (_this.cache.has(ip)) {
                        var reqsMade = _this.cache.get(ip);
                        if (reqsMade == null) {
                            console.log("Requests for IP is undefined");
                            return;
                        }
                        // console.log('len: ', this.cache.keys().length)
                        if (reqsMade - 1 >= 0) {
                            res.set({
                                "x-ratelimit-remaining": reqsMade - 1,
                                "x-ratelimit-limit": _this.bucketSize
                            });
                            _this.cache.set(ip, reqsMade - 1);
                            next();
                        }
                        else {
                            res.set({
                                "x-ratelimit-remaining": 0,
                                "x-ratelimit-limit": _this.bucketSize,
                                "x-ratelimit-retry-after": _this.bucketRefreshRate
                            });
                            res.sendStatus(429);
                        }
                        // console.log(`We have ${ip}`)
                    }
                    else {
                        // console.log(`We don't have the IP, Adding`)
                        _this.cache.set(ip, _this.bucketSize - 1);
                        res.set({
                            "x-ratelimit-remaining": _this.bucketSize - 1,
                            "x-ratelimit-limit": _this.bucketSize
                        });
                        next();
                    }
                }
                catch (err) {
                    throw new Error(err);
                }
            };
        };
        this.leakingTokenBucketMiddleware = function (req, res, next) { return __awaiter(_this, void 0, void 0, function () {
            var ip, queue, tqueue;
            return __generator(this, function (_a) {
                console.log("in leaking middleware");
                try {
                    req.id = uuid.v4();
                    ip = req.ip;
                    // console.log('leaking ip is: ', ip)
                    if (this.leakingCache.has(ip)) {
                        console.log("cache has IP");
                        queue = this.leakingCache.get(ip);
                        if (queue == null) {
                            console.log("Requests for IP is undefined");
                            console.log("leaving leaking middleware");
                            return [2 /*return*/];
                        }
                        // If we can add the message to our queue, add it. Otherwise drop it and send 429
                        if (queue.length < this.bucketSize) {
                            queue.push({ req: req, res: res, next: next });
                            this.leakingCache.set(ip, queue);
                            console.log("room in queue, adding req/res. New len: ".concat(queue.length));
                            console.log("leaving leaking middleware");
                            return [2 /*return*/];
                        }
                        else {
                            console.log("no room in queue");
                            res.set({
                                "x-ratelimit-remaining": 0,
                                "x-ratelimit-limit": this.bucketSize,
                                "x-ratelimit-retry-after": this.outflowRate
                            });
                            res.sendStatus(429);
                        }
                    }
                    else {
                        tqueue = [];
                        tqueue.push({ req: req, res: res, next: next });
                        // console.log('pushed onto temp queue')
                        this.leakingCache.set(ip, tqueue);
                        console.log("set the queue onto the leaking cache. len: ".concat(tqueue.length));
                    }
                    console.log("middleware finished");
                }
                catch (err) {
                    throw new Error(err);
                }
                return [2 /*return*/];
            });
        }); };
        this.express = express();
        this.routes();
        // Load environments and validate
        // All of these could be retrieved from a cache
        this.ttl = process.env.TTL ? +process.env.TTL : -1;
        this.bucketSize = process.env.BUCKET_SIZE ? +process.env.BUCKET_SIZE : -1;
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
            throw new Error("env not loading properly");
        }
        // Instantiate cache
        this.cache = new NodeCache({ stdTTL: this.ttl });
        this.leakingCache = new NodeCache({
            stdTTL: this.ttl,
            useClones: false
        });
        if (this.cache == null || this.leakingCache == null) {
            throw new Error("Cache is null!");
        }
        // Start bucket refiller
        this.refillBucket();
        // Start the leaking bucket
        this.leakBucket();
    }
    App.prototype.routes = function () {
        var _this = this;
        this.express.get("/", function (req, res, next) {
            res.send("Typescript App works!!!");
        });
        // request to get all the users
        this.express.get("/tokenBucket", this.tokenBucketMiddleware(), function (req, res, next) {
            res.send("Success");
        });
        this.express.get("/leakingTokenBucket", function (req, res, next) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.leakingTokenBucketMiddleware(req, res, next)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
    };
    return App;
}());
exports["default"] = new App().express;
