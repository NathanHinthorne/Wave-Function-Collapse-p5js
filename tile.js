class Tile {
  constructor(img) {
    this.img = img;
    this.index = null;
    this.hash = null;

    // Map of tile indices to their frequency,
    // This rolls adjacency rules and frequency hints into one
    
    // Key: Number, Value: Number (0-100)
    this.up = new Map();
    this.right = new Map();
    this.down = new Map();
    this.left = new Map();
  }

  match(otherTile) {
    return this.hash == otherTile.hash;
  }

  createHash() {
    // NOTE: Hashing is done to allow for easy comparison of tiles
    //       without having to compare the pixel data directly.
    //       This drastically speeds up the comparison process.


    // Load the pixel data
    this.img.loadPixels();

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
