import express from "express";
import NodeCache from "node-cache";
import { checkIP, refillBucket } from "../helpers";

try {
  // Load environments and validate
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

  // Create cache
  const cache = new NodeCache({ stdTTL: ttl }); // This could be a redis cache for a distributed system

  // Start bucket refiller
  refillBucket(cache, bucketSize, bucketRefreshRate);

  // Add checkIP middleware to route
  app.get("/", checkIP(cache, bucketSize, bucketRefreshRate), (req, res) => {
    // console.log(req.ip);
    res.send("Success!");
  });

  app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
  });
} catch (e) {
  console.log(e);
}
