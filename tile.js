/**
 * Tiles refer to the individual images that make up the grid. 
 * They contain information about their possible neighboring tiles.
 * 
 * @author Nathan Hinthorne
 */
class Tile {
  constructor(img) {

    /** The image of the tile */
    this.img = img;

    /** The index of the tile in the tileset */
    this.index = null;

    /** The hash of the tile's pixel data */
    this.hash = null;

    /** Optional field. Tile is treated in a special way depending on the behavior. */
    this.behavior = null;


    // Maps of tile indices to their frequency.
    // This rolls adjacency rules and frequency hints into one

    // Immediate neighbors: 1 tile away
    this.up = new Map();
    this.right = new Map();
    this.down = new Map();
    this.left = new Map();

    // Distance neighbors: 2 tiles away
    this.up2 = new Map();
    this.right2 = new Map();
    this.down2 = new Map();
    this.left2 = new Map();
    this.upLeft = new Map();
    this.upRight = new Map();
    this.downLeft = new Map();
    this.downRight = new Map();
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
