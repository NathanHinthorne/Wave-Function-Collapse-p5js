class Cell {

  constructor(tileIndices, x, y) {
    /** Whether or not the cell has collapsed into a tile */
    this.collapsed = false;

    /** The available tiles to choose from */
    this.options = tileIndices; // start off with every tile as an option

    this.maxEntropy = tileIndices.length;

    /** This cell's x position in the output grid */
    this.x  = x;

    /** This cell's y position in the output grid */
    this.y = y
  }

  calculateEntropy() {
    if (this.collapsed) {
      return 0;
    }

    return this.options.length;

    // TODO to find probability, find the total frequency that every tile variant maps to each tile option in this cell
    // let totalFrequency = 0;
    

    // let entropy = 0;
    // for (let option of this.options) {
    //   const probability = ;
      
    //   // Shannon entropy
    //   entropy -= probability * Math.log2(probability);
    // }
    // return entropy;
  }

  collapse() {
    if (this.collapsed) {
      throw new Error('Cell has already been collapsed');
    }

    if (this.options.length === 0) {
      throw new Error('Tried to collapse, but no tile options were available')
    }

    // TODO let the frequencies play a role in tile selection

    const pick = random(this.options);
    this.options = [pick];

    this.collapsed = true;

    return pick;
  }
}
