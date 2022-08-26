import TreeNode from "./treeNode.js";
class BinarySearchTree {
  constructor() {
    this.root = null;
    this.size = 0;
  }
  add(key, value) {
    const newNode = new TreeNode(key, value);
    if (this.root) {
      const { found, parent } = this.findNodeAndParent(key);
      console.log("~~parent: ", parent);
      if (found) {
        // duplicated: value already exist on the tree
        found.meta.multiplicity =
          (found.meta && found.meta.multiplicity
            ? found.meta.multiplicity
            : 1) + 1;
      } else if (key < parent.key) {
        parent.left = newNode;
      } else {
        parent.right = newNode;
      }
    } else {
      this.root = newNode;
    }

    this.size += 1;
    return newNode;
  }
  findNodeAndParent(key) {
    let node = this.root;
    let parent;

    while (node) {
      if (node.key === key) {
        break;
      }
      parent = node;
      node = key >= node.key ? node.right : node.left;
    }

    return { found: node, parent };
  }
  leftRotation(node) {
    const newParent = node.right; // e.g. 3
    const grandparent = node.parent; // e.g. 1

    // make 1 the parent of 3 (previously was the parent of 2)
    this.swapParentChild(node, newParent, grandparent);

    // do LL rotation
    newParent.left = node; // makes 2 the left child of 3
    node.right = undefined; // clean 2's right child

    return newParent; // 3 is the new parent (previously was 2)
  }
  swapParentChild(oldChild, newChild, parent) {
    if (parent) {
      const side = oldChild.isParentRightChild ? "right" : "left";
      // this set parent child AND also
      parent[side] = newChild;
    } else {
      // no parent? so set it to null
      newChild.parent = null;
    }
  }
  rightRotation(node) {
    const newParent = node.left;
    const grandparent = node.parent;

    this.swapParentChild(node, newParent, grandparent);

    // do RR rotation
    newParent.right = node;
    node.left = undefined;

    return newParent;
  }
  leftRightRotation(node) {
    this.leftRotation(node.left);
    return this.rightRotation(node);
  }
  rightLeftRotation(node) {
    this.rightRotation(node.right);
    return this.leftRotation(node);
  }
  balance(node) {
    console.log("bal");
    if (node.balanceFactor > 1) {
      console.log("balancing right side");
      // left subtree is higher than right subtree
      if (node.left.balanceFactor > 0) {
        this.rightRotation(node);
      } else if (node.left.balanceFactor < 0) {
        this.leftRightRotation(node);
      }
    } else if (node.balanceFactor < -1) {
      console.log("balancing left");
      // right subtree is higher than left subtree
      if (node.right.balanceFactor < 0) {
        this.leftRotation(node);
      } else if (node.right.balanceFactor > 0) {
        this.rightLeftRotation(node);
      }
    }
  }
}

class AvlTree extends BinarySearchTree {
  balanceUpstream(node) {
    let current = node;
    let newParent;
    while (current) {
      newParent = super.balance(current);
      current = current.parent;
    }
    return newParent;
  }
  add(key, value) {
    const node = super.add(key, value);
    this.balanceUpstream(node);
    return node;
  }
  remove(value) {
    const node = super.find(value);
    if (node) {
      const found = super.remove(value);
      this.balanceUpstream(node.parent);
      return found;
    }
    return false;
  }
}

let bst = new AvlTree();
bst.add(3, "hi");
bst.add(4, "you");
bst.add(5, "fuckl");
// bst.add(2, "f2");
bst.add(6, "6");
bst.add(7, "7");
bst.add(8, "8");
bst.add(9, "9");

let x = bst.findNodeAndParent(3);
console.log("found x", x);
console.log("root: ", bst.root.key);
// let avl = new AvlTree();
// avl.add(3, "hi");
