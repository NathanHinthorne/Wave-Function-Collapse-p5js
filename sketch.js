/** The types of tiles that can be used in the output grid */
let tileVariants = [];

/** A set of hashes of tiles that have already been seen by the image parser*/
let scannedTiles = new Set();

/** 2D Array. Contains tile objects taken from the input image */
let inputGrid = [];

/** 2D Array. Contains cells that get collapsed into tiles */
let outputGrid = [];

let dim = 50; //TODO grab from user input
let tilePixelSize = 22; 
let tileDisplaySize = 0;
const INPUT_IMAGE_DISPLAY_SIZE = 450;
const OUTPUT_IMAGE_DISPLAY_SIZE = 400;

let inputImage = null;

// Flags to keep track of the state of the program
let imageIsAnalyzed = false;
let outputIsGenerated = false;


function preload() {
  inputImage = loadImage('sample_input/demo.png'); //TODO grab path from user input
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
    displayTileVariants(450, 500, 400, 180);
  }

  if (outputIsGenerated) {
    displayOutputGrid();
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
  scannedTiles.clear();

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
}

function populateOutputGrid() {

}

/*
function draw() {



  // Pick cell with least entropy
  let gridCopy = outputGrid.slice();
  gridCopy = gridCopy.filter((a) => !a.collapsed);
  // console.table(grid);
  // console.table(gridCopy);

  if (gridCopy.length == 0) {
    return;
  }
  gridCopy.sort((a, b) => {
    return a.calculateEntropy() - b.calculateEntropy();
  });

  let len = gridCopy[0].options.length;
  let stopIndex = 0;
  for (let i = 1; i < gridCopy.length; i++) {
    if (gridCopy[i].options.length > len) {
      stopIndex = i;
      break;
    }
  }

  if (stopIndex > 0) gridCopy.splice(stopIndex);
  const cell = random(gridCopy);
  cell.collapsed = true;
  const pick = random(cell.options);
  if (pick === undefined) {
    startOver();
    return;
  }
  cell.options = [pick];

  const nextGrid = [];
  for (let j = 0; j < dim; j++) {
    for (let i = 0; i < dim; i++) {
      let index = i + j * dim;
      if (outputGrid[index].collapsed) {
        nextGrid[index] = outputGrid[index];
      } else {
        let options = new Array(tileVariants.length).fill(0).map((x, i) => i);
        // Look up
        if (j > 0) {
          let up = outputGrid[i + (j - 1) * dim];
          let validOptions = [];
          for (let option of up.options) {
            let valid = tileVariants[option].down;
            validOptions = validOptions.concat(valid);
          }
          checkValid(options, validOptions);
        }
        // Look right
        if (i < dim - 1) {
          let right = outputGrid[i + 1 + j * dim];
          let validOptions = [];
          for (let option of right.options) {
            let valid = tileVariants[option].left;
            validOptions = validOptions.concat(valid);
          }
          checkValid(options, validOptions);
        }
        // Look down
        if (j < dim - 1) {
          let down = outputGrid[i + (j + 1) * dim];
          let validOptions = [];
          for (let option of down.options) {
            let valid = tileVariants[option].up;
            validOptions = validOptions.concat(valid);
          }
          checkValid(options, validOptions);
        }
        // Look left
        if (i > 0) {
          let left = outputGrid[i - 1 + j * dim];
          let validOptions = [];
          for (let option of left.options) {
            let valid = tileVariants[option].right;
            validOptions = validOptions.concat(valid);
          }
          checkValid(options, validOptions);
        }

        // I could immediately collapse if only one option left?
        nextGrid[index] = new Cell(options);
      }
    }
  }

  outputGrid = nextGrid;
}

*/