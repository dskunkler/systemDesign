import NodeCache from "node-cache";

export const checkIP = (
  cache: NodeCache,
  bucketSize: number,
  bucketRefreshRate: number
) => {
  return (req, res, next) => {
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
};
