// Create node
const Node = function (item, value) {
  this.value = value; // This will be the cache itself
  // console.log(item);
  // console.log(typeof item);
  this.item = item;
  // console.log("this.item: ", typeof this.item, this.item);
  this.height = 1;
  this.left = null;
  this.right = null;
  this.parent = null;
};

//AVL Tree
export class AVLTree {
  root;
  constructor() {
    this.root = null;
  }

  //return height of the node
  height = (N) => {
    if (N === null) {
      return 0;
    }

    return N.height;
  };

  //right rotate
  rightRotate = (y) => {
    let x = y.left;
    let T2 = x.right;
    x.right = y;
    if (y != null) {
      y.parent = x;
    }
    y.left = T2;
    if (T2 != null) {
      T2.parent = y;
    }
    y.height = Math.max(this.height(y.left), this.height(y.right)) + 1;
    x.height = Math.max(this.height(x.left), this.height(x.right)) + 1;
    return x;
  };

  //left rotate
  leftRotate = (x) => {
    let y = x.right;
    let T2 = y.left;
    y.left = x;
    if (x != null) {
      x.parent = y;
    }
    x.right = T2;
    if (T2 != null) {
      T2.parent = x;
    }
    x.height = Math.max(this.height(x.left), this.height(x.right)) + 1;
    y.height = Math.max(this.height(y.left), this.height(y.right)) + 1;
    return y;
  };

  // get balance factor of a node
  getBalanceFactor = (N) => {
    if (N == null) {
      return 0;
    }

    return this.height(N.left) - this.height(N.right);
  };

  // helper function to insert a node
  insertNodeHelper = (node, item, value) => {
    // find the position and insert the node
    // console.log("insert helper called!");
    // console.log("node undefined: ", node == null);
    if (node == null) {
      // console.log("node is null new Node!");
      return new Node(item, value);
    }
    // console.log("item: ", item);
    // console.log("node.item: ", node.item);
    if (item < node.item) {
      // console.log("insirting on left");
      node.left = this.insertNodeHelper(node.left, item, value);
      if (node.left != null) {
        node.left.parent = node;
      }
    } else if (item > node.item) {
      // console.log("inserting on right");
      node.right = this.insertNodeHelper(node.right, item, value);
      if (node.right != null) {
        node.right.parent = node;
      }
    } else {
      // console.log("item == key");
      return node;
    }

    // update the balance factor of each node
    // and, balance the tree
    node.height = 1 + Math.max(this.height(node.left), this.height(node.right));

    let balanceFactor = this.getBalanceFactor(node);

    if (balanceFactor > 1) {
      if (item < node.left.item) {
        return this.rightRotate(node);
      } else if (item > node.left.item) {
        node.left = this.leftRotate(node.left);
        return this.rightRotate(node);
      }
    }

    if (balanceFactor < -1) {
      if (item > node.right.item) {
        return this.leftRotate(node);
      } else if (item < node.right.item) {
        node.right = this.rightRotate(node.right);
        return this.leftRotate(node);
      }
    }

    return node;
  };

  // insert a node
  insertNode = (item, value) => {
    // console.log("Adding ", item);
    // console.log(root);
    const itemInt = parseInt(item, 16);
    // console.log("itemInt: ", typeof itemInt, itemInt);
    this.root = this.insertNodeHelper(this.root, itemInt, value);
    // console.log("new root: ", this.root);
  };

  //get node with minimum value
  nodeWithMimumValue = (node) => {
    let current = node;
    while (current.left !== null) {
      current = current.left;
    }
    return current;
  };

  find = (key) => {
    // console.log("find: ", this.root);
    const foundNode = this.findHelper(this.root, +key);
    // console.log("find found ", foundNode.item);
    return foundNode;
  };
  findHelper = (node, key) => {
    // console.log("findHelper!");
    if (key < node.item) {
      return this.findHelper(node.left, key);
    } else if (+key > +node.item) {
      return this.findHelper(node.right, key);
    } else {
      // console.log("returning", node.item);
      return node;
    }
  };

  findSuccessor = (key) => {
    key = parseInt(key, 16);
    // console.log("key to find: ", key);
    const foundNode = this.find(+key);
    // console.log("found Node: ", foundNode);
    const node = this.successor(foundNode);
    if (node == null) {
      // console.log("couldn't find node");
    }
    // console.log("found ", node.item);
    return node;
  };

  successor = (node) => {
    if (node.right != null) {
      // console.log("right not null");
      return node;
    }
    let parent = node.parent;
    // console.log("parent: ", parent.item);
    // console.log("node: ", node.item);
    while (parent != null && node === parent.right) {
      // console.log("node: ", node);
      // console.log("parent: ", parent);
      node = parent;
      parent = parent.parent;
    }
    return parent;
  };

  // delete helper
  deleteNodeHelper = (root, item) => {
    // console.log("deleting");
    // find the node to be deleted and remove it
    if (root == null) {
      return root;
    }
    if (item < root.item) {
      root.left = this.deleteNodeHelper(root.left, item);
    } else if (item > root.item) {
      root.right = this.deleteNodeHelper(root.right, item);
    } else {
      if (root.left === null || root.right === null) {
        let temp = null;
        if (temp == root.left) {
          temp = root.right;
        } else {
          temp = root.left;
        }

        if (temp == null) {
          temp = root;
          root = null;
        } else {
          root = temp;
        }
      } else {
        let temp = this.nodeWithMimumValue(root.right);
        root.item = temp.item;
        root.right = this.deleteNodeHelper(root.right, temp.item);
      }
    }
    if (root == null) {
      // console.log("root null in deleting");
      return root;
    }

    // Update the balance factor of each node and balance the tree
    root.height = Math.max(this.height(root.left), this.height(root.right)) + 1;

    let balanceFactor = this.getBalanceFactor(root);
    // console.log("still deleting");
    if (balanceFactor > 1) {
      if (this.getBalanceFactor(root.left) >= 0) {
        return this.rightRotate(root);
      } else {
        root.left = this.leftRotate(root.left);
        return this.rightRotate(root);
      }
    }
    if (balanceFactor < -1) {
      if (this.getBalanceFactor(root.right) <= 0) {
        return this.leftRotate(root);
      } else {
        root.right = this.rightRotate(root.right);
        return this.leftRotate(root);
      }
    }
    return root;
  };

  //delete a node
  deleteNode = (item) => {
    this.root = this.deleteNodeHelper(this.root, item);
  };

  // print the tree in pre - order
  preOrder = () => {
    this.preOrderHelper(this.root);
  };

  preOrderHelper = (node) => {
    if (node) {
      console.log(node.item);
      this.preOrderHelper(node.left);
      this.preOrderHelper(node.right);
    }
  };
}
const tree = new AVLTree();
tree.insertNode(33, 33);
tree.insertNode(13, 13);
tree.insertNode(53, 53);
tree.insertNode(9, 9);
tree.insertNode(21, 21);
tree.insertNode(61, 61);
tree.insertNode(8, 8);
tree.insertNode(11, 11);
tree.preOrder();
tree.deleteNode(13);
console.log("After Deletion: ");
tree.preOrder();
console.log("sucessor");
console.log(tree.findSuccessor(8).item);
// console.log(tree.findSuccessor(100).item);
