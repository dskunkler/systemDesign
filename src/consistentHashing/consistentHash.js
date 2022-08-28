import NodeCache from "node-cache";
import { stringify } from "flatted";
import { AVLTree } from "./bst.js";
import { createHash } from "crypto";

// Add cache
// Remove cache
// search

class consistentHash {
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
      const hash = createHash("sha256");
      hash.update(stringify(cache) + i.toString());
      this.tree.insertNode(hash.digest("hex"), cache);
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
// ch.tree.preOrder();

ch.tree.preOrder();
