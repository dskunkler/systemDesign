const LEFT = 0;
const RIGHT = 1;

class TreeNode {
  constructor(key, value) {
    this.value = value;
    this.key = key;
    this.descendents = [];
    this.parent = null;
    this.meta = { multiplicity: 1 };
  }

  get left() {
    return this.descendents[LEFT];
  }
  get right() {
    return this.descendents[RIGHT];
  }
  set left(node) {
    this.descendents[LEFT] = node;
    if (node) {
      node.parent = this;
    }
  }
  set right(node) {
    this.descendents[RIGHT] = node;
    if (node) {
      node.parent = this;
    }
  }
  get height() {
    console.log("left height:", this.leftSubtreeHeight);
    console.log("right height:", this.rightSubtreeHeight);
    return Math.max(this.leftSubtreeHeight, this.rightSubtreeHeight);
  }

  get leftSubtreeHeight() {
    console.log("lsh: ", this.left ? this.left : "no left");
    return this.left ? this.left.height + 1 : 0;
  }

  get rightSubtreeHeight() {
    console.log("rsh: ", this.right ? this.right : "no right");
    return this.right ? this.right.height + 1 : 0;
  }

  get balanceFactor() {
    console.log("bf: ", this.leftSubtreeHeight - this.rightSubtreeHeight);
    return this.leftSubtreeHeight - this.rightSubtreeHeight;
  }
}

export default TreeNode;
