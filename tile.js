/**
 * Tiles refer to the individual images that make up the grid. 
 * They contain information about their possible neighboring tiles.
 * 
 * @author Nathan Hinthorne
 */
class Tile {
  constructor(img) {
    this.img = img;
    this.index = null;
    this.hash = null;

    // Maps of tile indices to their frequency,
    // This rolls adjacency rules and frequency hints into one
    
    /** A Map where the keys are the indices of available tiles to appear above this one, and the values are their corresponding frequencies */
    this.up = new Map();

    /** A Map where the keys are the indices of available tiles to appear to the right of this one, and the values are their corresponding frequencies */
    this.right = new Map();

    /** A Map where the keys are the indices of available tiles to appear below this one, and the values are their corresponding frequencies */
    this.down = new Map();

    /** A Map where the keys are the indices of available tiles to appear to the left of this one, and the values are their corresponding frequencies */
    this.left = new Map();
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
