class Tile {
  constructor(img) {
    this.img = img;
    this.hash = this.createHash();

    // Map of tile indices to their frequency, 
    // rolling adjacency rules and frequency hints into one
    this.up = new Map();
    this.right = new Map();
    this.down = new Map();
    this.left = new Map();
  }

  // analyze(tiles) {
  //   for (let i = 0; i < tiles.length; i++) {
  //     let tile = tiles[i];

  //     // Tile 5 can't match itself
  //     if (tile.index == 5 && this.index == 5) continue;

  //     // UP
  //     if (compareEdge(tile.edges[2], this.edges[0])) {
  //       this.up.push(i);
  //     }
  //     // RIGHT
  //     if (compareEdge(tile.edges[3], this.edges[1])) {
  //       this.right.push(i);
  //     }
  //     // DOWN
  //     if (compareEdge(tile.edges[0], this.edges[2])) {
  //       this.down.push(i);
  //     }
  //     // LEFT
  //     if (compareEdge(tile.edges[1], this.edges[3])) {
  //       this.left.push(i);
  //     }
  //   }
  // }

  match(otherTile) {
    return this.hash == otherTile.hash;
  }

  createHash() {
    // NOTE: Hashing is done to allow for easy comparison of tiles
    //       without having to compare the pixel data directly.
    //       This drastically speeds up the comparison process.

    // Convert the pixel data to a string
    const pixelDataString = this.img.pixels.join(',');

    // Create a hash of the pixel data string
    let hash = 0;
    for (let i = 0; i < pixelDataString.length; i++) {
      const char = pixelDataString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0; // Convert to 32bit integer
    }

    return hash;
  }
}
