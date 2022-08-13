import * as express from 'express'
import * as bodyParser from 'body-parser'
import 'dotenv/config'
import * as NodeCache from 'node-cache'

class App {
    public express: express.Application
    public port: string | undefined
    private ttl: number
    private bucketSize: number
    private bucketRefreshRate: number

    public cache // This could be a redis cache for a distributed system

    // array to hold users
    users: any[]

    constructor() {
        this.express = express()
        this.routes()
        this.users = [
            { firstName: 'fnam1', lastName: 'lnam1', userName: 'username1' },
        ]
        // Load environments and validate
        // All of these could be retrieved from a cache
        this.ttl = process.env.TTL ? +process.env.TTL : -1
        this.bucketSize = process.env.BUCKET_SIZE
            ? +process.env.BUCKET_SIZE
            : -1
        this.bucketRefreshRate = process.env.BUCKET_REFRESH_RATE
            ? +process.env.BUCKET_REFRESH_RATE
            : -1
        // Validate that .env is loading properly
        if (
            this.ttl == -1 ||
            this.bucketSize == -1 ||
            this.bucketRefreshRate == -1
        ) {
            throw new Error('env not loading properly')
        }
        // Instantiate cache
        this.cache = new NodeCache({ stdTTL: this.ttl })
        if (this.cache == null) {
            throw new Error('Cache busted!')
        }
        // Start bucket refiller
        this.refillBucket()
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
                console.log('val: ', this.cache.get(keys[i]))
                const currentVal: number | undefined = this.cache.get(keys[i])
                if (currentVal == null) {
                    continue
                }
                if (currentVal + 1 >= this.bucketSize) {
                    this.cache.del(keys[i])
                    console.log('bucket full, deleting')
                } else {
                    this.cache.set(keys[i], currentVal + 1)
                    console.log('incrementing bucket for key')
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
                console.log('ip is: ', ip)
                if (this.cache.has(ip)) {
                    const reqsMade: number | undefined = this.cache.get(ip)
                    if (reqsMade == null) {
                        console.log('Requests for IP is undefined')
                        return
                    }

                    console.log('len: ', this.cache.keys().length)
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
                    console.log(`We have ${ip}`)
                } else {
                    console.log(`We don't have the IP, Adding`)
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

    private routes(): void {
        this.express.get('/', (req, res, next) => {
            res.send('Typescript App works!!!')
        })

        // request to get all the users
        this.express.get(
            '/tokenBucket',
            this.tokenBucketMiddleware(),
            (req, res, next) => {
                console.log('url:::::::' + req.url)
                res.send('Success')
            }
        )
    }
}

export default new App().express
