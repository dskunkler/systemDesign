import express from "express";
import NodeCache from "node-cache";

try {
  const port = process.env.PORT;
  const app = express();
  const ttl = process.env.TTL ? +process.env.TTL : null;
  const bucketSize = process.env.BUCKET_SIZE ? +process.env.BUCKET_SIZE : null;
  const bucketRefreshRate = process.env.BUCKET_REFRESH_RATE
    ? +process.env.BUCKET_REFRESH_RATE
    : null;
  if (ttl == null || bucketSize == null || bucketRefreshRate == null) {
    throw new Error("env not loading properly");
  }

  const cache = new NodeCache({ stdTTL: ttl }); // This could be a redis cache for a distributed system

  const refillBucket = () => {
    try {
      setTimeout(() => {
        refillBucket();
        // console.log("bucket Refresh called");
      }, 1000);

      const keys = cache.keys();
      for (let i = 0; i < keys.length; i++) {
        console.log("val: ", cache.get(keys[i]));
        const currentVal: number | undefined = cache.get(keys[i]);
        if (currentVal == null) {
          continue;
        }
        if (currentVal + 1 >= bucketSize) {
          cache.del(keys[i]);
          console.log("bucket full, deleting");
        } else {
          cache.set(keys[i], currentVal + 1);
          console.log("incrementing bucket for key");
        }
      }
    } catch (e) {
      console.log(e);
    }
  };

  refillBucket();

  const checkIP = (req, res, next) => {
    try {
      const { ip } = req;
      if (cache.has(ip)) {
        const reqsMade: number | undefined = cache.get(ip);
        if (reqsMade == null) {
          console.log("Requests for IP is undefined");
          return;
        }

        console.log("len: ", cache.keys().length);
        if (reqsMade - 1 >= 0) {
          res.set({
            "x-ratelimit-remaining": reqsMade - 1,
            "x-ratelimit-limit": bucketSize,
          });
          cache.set(ip, reqsMade - 1);
          next();
        } else {
          res.set({
            "x-ratelimit-remaining": 0,
            "x-ratelimit-limit": bucketSize,
            "x-ratelimit-retry-after": bucketRefreshRate,
          });
          res.sendStatus(429);
        }
        console.log(`We have ${ip}`);
      } else {
        cache.set(ip, bucketSize - 1);
        res.set({
          "x-ratelimit-remaining": bucketSize - 1,
          "x-ratelimit-limit": bucketSize,
        });
        next();
        console.log(`We don't have the IP`);
      }
    } catch (err) {
      throw new Error(err);
    }
  };

  app.get("/", checkIP, (req, res) => {
    // console.log(req.ip);
    res.send("Success!");
  });

  app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
  });
} catch (e) {
  console.log(e);
}
