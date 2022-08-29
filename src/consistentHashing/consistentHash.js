import NodeCache from "node-cache";
import { stringify } from "flatted";
import { AVLTree } from "./bst.js";
import { createHash } from "crypto";

// Add cache
// Remove cache
// search

export class consistentHash {
  tree;
  numberOfReplicas;
  constructor(numReplicas) {
    // console.log("constructor called");
    this.tree = new AVLTree();
    this.numberOfReplicas = numReplicas;
  }

  add = (cache) => {
    // console.log("Add called");
    for (let i = 0; i < this.numberOfReplicas; i++) {
      // console.log(i);
      const hash = createHash("sha256");
      const stringified = stringify(cache) + i.toString();
      // console.log(stringified);
      hash.update(stringified);
      const hashed = hash.digest("hex");
      // console.log("Hashed: ", hashed);
      this.tree.insertNode(hashed, cache);
    }
  };

  remote = (cache) => {
    for (let i = 0; i < this.numberOfReplicas; i++) {
      const hash = createHash("sha256");
      hash.update(stringify(cache) + i.toString());
      this.tree.deleteNode(hash.digest("hex"));
    }
  };

  get = (url) => {
    const hash = createHash("sha256");
    hash.update(url);
    const hashedUrl = hash.digest("hex");
    this.tree.insertNode(hashedUrl, null);
    const node = this.tree.findSuccessor(hashedUrl);
    this.tree.deleteNode(hashedUrl);
    if (node == null) {
      console.log("node is null");
      return this.tree.nodeWithMimumValue(this.tree.root);
    }
    return node;
  };
}

const ch = new consistentHash(4);
const node1 = new NodeCache({ stdTTL: 15 });
const node2 = new NodeCache({ stdTTL: 15 });
ch.add(node1);
console.log("new");
ch.add(node2);
ch.tree.preOrder();

const cacheNode = ch.get("www.amazon.com");
if (cacheNode.value == node1) {
  console.log("first cache");
} else if (cacheNode.value == node2) {
  console.log("second cache");
} else {
  console.log("neither");
}
console.log("help");
const cacheNode1 = ch.get("www.amazon.com/help");
if (cacheNode1.value == node1) {
  console.log("first cache");
} else if (cacheNode1.value == node2) {
  console.log("second cache");
} else {
  console.log("neither");
}
console.log("banana");
const cacheNode2 = ch.get("www.banana.com");
if (cacheNode2.value == node1) {
  console.log("first cache");
} else if (cacheNode2.value == node2) {
  console.log("second cache");
} else {
  console.log("neither");
}
ch.tree.preOrder();
