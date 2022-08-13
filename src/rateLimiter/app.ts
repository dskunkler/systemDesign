import * as express from 'express'
import * as bodyParser from 'body-parser'
import 'dotenv/config'
import * as NodeCache from 'node-cache'

type Message = {
    req: express.Request
    res: express.Response
    next: express.NextFunction
}
class App {
    public express: express.Application
    private ttl: number
    private bucketSize: number
    private bucketRefreshRate: number
    private outflowRate: number

    private cache // This could be a redis cache for a distributed system
    // private queuedMessages = new Map<string, { Request; Response }>()
    private leakingCache

    constructor() {
        this.express = express()
        this.routes()

        // Load environments and validate
        // All of these could be retrieved from a cache
        this.ttl = process.env.TTL ? +process.env.TTL : -1
        this.bucketSize = process.env.BUCKET_SIZE
            ? +process.env.BUCKET_SIZE
            : -1
        this.bucketRefreshRate = process.env.BUCKET_REFRESH_RATE
            ? +process.env.BUCKET_REFRESH_RATE
            : -1

        this.outflowRate = process.env.OUTFLOW_RATE
            ? +process.env.OUTFLOW_RATE
            : -1
        // Validate that .env is loading properly
        if (
            this.ttl == -1 ||
            this.bucketSize == -1 ||
            this.bucketRefreshRate == -1 ||
            this.outflowRate == -1
        ) {
            throw new Error('env not loading properly')
        }
        // Instantiate cache
        this.cache = new NodeCache({ stdTTL: this.ttl })
        this.leakingCache = new NodeCache({
            stdTTL: this.ttl,
            useClones: false,
        })
        if (this.cache == null || this.leakingCache == null) {
            throw new Error('Cache is null!')
        }
        // Start bucket refiller
        this.refillBucket()
        // Start the leaking bucket
        this.leakBucket()
    }

    // This monitors and refills the buckets
    private refillBucket = () => {
        try {
            // Bucket will refill based on refresh rate
            setTimeout(() => {
                this.refillBucket()
                // console.log("bucket Refresh called");
            }, this.bucketRefreshRate)

            const keys = this.cache.keys()
            for (let i = 0; i < keys.length; i++) {
                // console.log('val: ', this.cache.get(keys[i]))
                const currentVal: number | undefined = this.cache.get(keys[i])
                if (currentVal == null) {
                    continue
                }
                if (currentVal + 1 >= this.bucketSize) {
                    this.cache.del(keys[i])
                    // console.log('bucket full, deleting')
                } else {
                    this.cache.set(keys[i], currentVal + 1)
                    // console.log('incrementing bucket for key')
                }
            }
        } catch (e) {
            console.log(e)
        }
    }

    private leakBucket = () => {
        try {
            // Bucket will refill based on refresh rate
            setTimeout(() => {
                this.leakBucket()
                // console.log("bucket Refresh called");
            }, this.outflowRate)

            // Get all the keys in the cache
            const keys = this.leakingCache.keys()
            // For every key get its queue
            for (let i = 0; i < keys.length; i++) {
                // console.log('val: ', this.leakingCache.get(keys[i]))
                const queue: Message[] | undefined = this.leakingCache.get(
                    keys[i]
                )

                // If queue is null try the next key
                if (queue == null) {
                    console.log('Queue is null')
                    continue
                }

                // If there is a queue and the size is greater then 0
                if (queue.length > 0) {
                    // Grab the first message from the queue
                    let message = queue.shift()
                    // Validate that the message isn't null
                    if (message == null) {
                        throw new Error('undefined message in queue')
                    }
                    // Split it into its components
                    let { req, res, next } = message
                    // Set the response
                    res.set({
                        'x-ratelimit-remaining': this.bucketSize - queue.length,
                        'x-ratelimit-limit': this.bucketSize,
                    })
                    // Send the response
                    next()
                } else {
                    // If the queue length is 0, we don't need to monitor that key anymore
                    this.leakingCache.del(keys[i])
                }
            }
        } catch (e) {
            console.log(e)
        }
    }

    // Token Bucket Logic
    private tokenBucketMiddleware = () => {
        return (req, res, next) => {
            try {
                const { ip } = req
                // console.log('ip is: ', ip)
                if (this.cache.has(ip)) {
                    const reqsMade: number | undefined = this.cache.get(ip)
                    if (reqsMade == null) {
                        console.log('Requests for IP is undefined')
                        return
                    }

                    // console.log('len: ', this.cache.keys().length)
                    if (reqsMade - 1 >= 0) {
                        res.set({
                            'x-ratelimit-remaining': reqsMade - 1,
                            'x-ratelimit-limit': this.bucketSize,
                        })
                        this.cache.set(ip, reqsMade - 1)
                        next()
                    } else {
                        res.set({
                            'x-ratelimit-remaining': 0,
                            'x-ratelimit-limit': this.bucketSize,
                            'x-ratelimit-retry-after': this.bucketRefreshRate,
                        })
                        res.sendStatus(429)
                    }
                    // console.log(`We have ${ip}`)
                } else {
                    // console.log(`We don't have the IP, Adding`)
                    this.cache.set(ip, this.bucketSize - 1)
                    res.set({
                        'x-ratelimit-remaining': this.bucketSize - 1,
                        'x-ratelimit-limit': this.bucketSize,
                    })
                    next()
                }
            } catch (err) {
                throw new Error(err)
            }
        }
    }

    private leakingTokenBucketMiddleware = () => {
        return (req, res, next) => {
            // console.log('in leaking middleware')
            try {
                const { ip } = req
                // console.log('leaking ip is: ', ip)
                if (this.leakingCache.has(ip)) {
                    // console.log('cache has IP')
                    const queue: unknown[] | undefined =
                        this.leakingCache.get(ip)
                    if (queue == null) {
                        console.log('Requests for IP is undefined')
                        return
                    }

                    // console.log('len: ', this.leakingCache.keys().length)
                    // If we can add the message to our queue, add it. Otherwise drop it and send 429
                    if (queue.length < this.bucketSize) {
                        // console.log('room in queue, adding req/res')
                        queue.push({ req, res, next })
                    } else {
                        // console.log('no room in queue')
                        res.set({
                            'x-ratelimit-remaining': 0,
                            'x-ratelimit-limit': this.bucketSize,
                            'x-ratelimit-retry-after': this.outflowRate,
                        })
                        res.sendStatus(429)
                    }
                } else {
                    // console.log(`We don't have the IP, Adding`)
                    let tqueue: unknown[] = []
                    tqueue.push({ req, res, next })
                    // console.log('pushed onto temp queue')
                    this.leakingCache.set(ip, tqueue)
                    // console.log('set the queue onto the leaking cache')
                }
            } catch (err) {
                throw new Error(err)
            }
        }
    }

    private routes(): void {
        this.express.get('/', (req, res, next) => {
            res.send('Typescript App works!!!')
        })

        // request to get all the users
        this.express.get(
            '/tokenBucket',
            this.tokenBucketMiddleware(),
            (req, res, next) => {
                res.send('Success')
            }
        )
        this.express.get(
            '/leakingTokenBucket',
            this.leakingTokenBucketMiddleware(),
            (req, res, next) => {
                res.send('Success')
            }
        )
    }
}

export default new App().express
