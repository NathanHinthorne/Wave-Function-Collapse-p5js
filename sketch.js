/** The types of tiles that can be used in the output grid */
let tileVariants = [];

/** 2D Array. Contains tile objects taken from the input image */
let inputGrid = [];

/** 2D Array. Contains cells that get collapsed into tiles */
let outputGrid = [];

let dim = 10;
let tilePixelSize = 22; 
const INPUT_IMAGE_DISPLAY_SIZE = 450;
const OUTPUT_IMAGE_DISPLAY_SIZE = 450;

let inputImage = null;

// Flags to keep track of the state of the program
let imageIsAnalyzed = false;
let isPlaying = false;
let outputIsPrepared = false;


function preload() {
  inputImage = loadImage('sample_input/demo2.png');
}

function setup() {
  parseImage(); // parse the example image
  setupView();
}

function draw() {
  noSmooth();

  background(255);
  // clear(); // use this instead if you want to make a cool css background in style.css

  displayInputGrid(10, 10, INPUT_IMAGE_DISPLAY_SIZE, INPUT_IMAGE_DISPLAY_SIZE);

  if (imageIsAnalyzed) {
    displayTileVariants(450, 500, 500, 180);
  }

  if (isPlaying) {
    // populateOutputGrid();
  }

  if (outputIsPrepared) {
    displayOutputGrid(1050, 10, OUTPUT_IMAGE_DISPLAY_SIZE, OUTPUT_IMAGE_DISPLAY_SIZE);
  }

}



/**
 * Separate the tiles from the input image into individual 
 * tile objects and store them in the input grid
 */
function parseImage() {
  inputGrid = [];

  for (let y = 0, row = 0; y < inputImage.height; y += tilePixelSize, row++) {
    inputGrid[row] = [];
    for (let x = 0, col = 0; x < inputImage.width; x += tilePixelSize, col++) {
      // Extract the portion of the image at the given x and y coordinates
      const tileImage = inputImage.get(x, y, tilePixelSize, tilePixelSize);
      const tile = new Tile(tileImage);
      
      // Add the tile to the input grid
      inputGrid[row][col] = tile;
    }
  }
}

function analyzeTiles() {
  findTileVariants();
  findNeighbors();

  console.log("Tile analysis complete");
  console.log("Tile connections found:", tileVariants);
}

function findTileVariants() {
  tileVariants = [];

  /** A set of hashes of tiles that have already been seen by the image parser */
  let scannedTiles = new Set();

  const width = inputGrid[0].length;
  const height = inputGrid.length;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const tile = inputGrid[y][x];
      tile.hash = tile.createHash();

      // If this type of tile hasn't been seen, make a new variant
      if (!scannedTiles.has(tile.hash)) {
        scannedTiles.add(tile.hash);
        tileVariants.push(tile);
        tile.index = tileVariants.length - 1;

      } else {
        // If this type of tile has been seen, find the variant and set the index
        for (let variant of tileVariants) {
          if (variant.hash === tile.hash) {
            tile.index = variant.index;
            break;
          }
        }
      }
    }
  }
}

/**
 * Analyze the tiles in the input grid to determine adjacency rules and frequency hints
 */
function findNeighbors() {
  const height = inputGrid.length;
  const width = inputGrid[0].length;

  // initialize adjacency rules and frequency hints
  for (let tile of tileVariants) {
    for (let otherTileIndex = 0; otherTileIndex < tileVariants.length; otherTileIndex++) {
      tile.up.set(otherTileIndex, 0);
      tile.right.set(otherTileIndex, 0);
      tile.down.set(otherTileIndex, 0);
      tile.left.set(otherTileIndex, 0);
    }
  }

  // create adjacency rules and frequency hints
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const tile = inputGrid[y][x]; // the tile we're looking at
      const tileVariant = tileVariants[tile.index]; // the tile to modify
      
      if (y > 0) { // there's a tile above us
        const upNeighbor = inputGrid[y - 1][x];
        const upNeighborFrequency = tileVariant.up.get(upNeighbor.index);
        tileVariant.up.set(upNeighbor.index, upNeighborFrequency + 1);
      }
      if (x < width - 1) { // there's a tile to our right
        const rightNeighbor = inputGrid[y][x + 1];
        const rightNeighborFrequency = tileVariant.right.get(rightNeighbor.index);
        tileVariant.right.set(rightNeighbor.index, rightNeighborFrequency + 1);
      }
      if (y < height - 1) { // there's a tile below us
        const downNeighbor = inputGrid[y + 1][x];
        const downNeighborFrequency = tileVariant.down.get(downNeighbor.index);
        tileVariant.down.set(downNeighbor.index, downNeighborFrequency + 1);
      }
      if (x > 0) { // there's a tile to our left
        const leftNeighbor = inputGrid[y][x - 1];
        const leftNeighborFrequency = tileVariant.left.get(leftNeighbor.index);
        tileVariant.left.set(leftNeighbor.index, leftNeighborFrequency + 1);
      }
    }
  }
}


/**
 * Clear the output grid and create a new cell for each spot on the grid
 */
function startOver() {
  outputGrid = []; // Clear the output grid
  
  // Create cell for each spot on the grid
  for (let y = 0; y < dim; y++) { //TODO change this when dims are not equal (not a square grid)
    outputGrid[y] = [];
    for (let x = 0; x < dim; x++) {
      outputGrid[y][x] = new Cell(tileVariants);
    }
  }

  outputIsPrepared = true;
}


function populateOutputGrid() {
  // 1.  Create a list of cells that have not yet been collapsed.
  const uncollapsedCells = outputGrid.flat().filter(cell => !cell.collapsed);

  // 2. From this list, select the cell with the lowest entropy.
  // The entropy of a cell is calculated in the calculateEntropy method in the Cell class.
  const sortedCells = uncollapsedCells.sort((a, b) => a.calculateEntropy() - b.calculateEntropy());
  const lowestEntropyCell = sortedCells[0];

  // 3. Collapse the selected cell. This is done by choosing a random tile index 
  // from its options field. Once a tile index is chosen, the cell's collapsed field 
  // is set to true and its options field is updated to contain only the chosen tile index.
  if (lowestEntropyCell.options.length === 0) {
    // TODO implement a way to backtrack instead of restarting
    startOver();
    return;
  }
  lowestEntropyCell.collapse();

  // 4. Update the options fields of the neighboring cells based on the adjacency rules 
  // and frequency hints of the collapsed cell's tile. The adjacency rules and 
  // frequency hints are determined in the findNeighbors function in sketch.js.
  // The adjacency rules are stored in the up, right, down, and left fields of each tile, 
  // where each field is a map of valid neighboring tile indices to their frequencies.

  // 5. Repeat steps 2 - 4 until all cells in the outputGrid have been collapsed.

}

