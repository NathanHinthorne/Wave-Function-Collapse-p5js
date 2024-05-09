class Cell {

  constructor(value) {
    /** Whether or not the cell has collapsed into a tile */
    this.collapsed = false;

    /** The available tiles to choose from */
    this.options = [];
    
    if (value instanceof Array) {
      this.options = value;
    } else {
      this.options = [];
      for (let i = 0; i < value; i++) {
        this.options[i] = i;
      }
    }
  }

  calculateEntropy() {
    if (this.collapsed) {
      return 0;
    }

    // Shannon entropy
    // let entropy = 0;
    // for (let option of this.options) {
    //   const probability = ;
    //   entropy -= probability * Math.log2(probability);
    // }
    // return entropy;
  }
}
