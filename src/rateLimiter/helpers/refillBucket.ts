import NodeCache from "node-cache";

export const refillBucket = (
  cache: NodeCache,
  bucketSize: number,
  bucketRefreshRate: number
) => {
  try {
    setTimeout(() => {
      refillBucket(cache, bucketSize, bucketRefreshRate);
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
