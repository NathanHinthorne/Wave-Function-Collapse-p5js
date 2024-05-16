class Cell {

  constructor(tileIndices) {
    /** Whether or not the cell has collapsed into a tile */
    this.collapsed = false;

    /** The available tiles to choose from */
    this.options = tileIndices; // start off with every tile as an option
  }

  calculateEntropy() {
    if (this.collapsed) {
      return 0;
    }

    return this.options.length; //! TEMPORARY

    // // TODO to find probability, find the total frequency that every tile variant maps to each tile option in this cell
    // let totalFrequency = 0;
    

    // let entropy = 0;
    // for (let option of this.options) {
    //   const probability = ;
      
    //   // Shannon entropy
    //   entropy -= probability * Math.log2(probability);
    // }
    // return entropy;
  }
}
