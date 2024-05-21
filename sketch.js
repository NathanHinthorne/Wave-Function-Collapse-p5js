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
let outputIsInitialized = false;
let outputIsGenerating = false;
let outputIsComplete = false;


function preload() {
  inputImage = loadImage('sample_input/demo3.png');
}

function setup() {
  parseImage(); // parse the example image
  setupView();
}

function draw() {
  noSmooth();

  background(255);
  // clear(); // use this instead if you want to make a cool css background in style.css

  displayInputGrid(10, 40, INPUT_IMAGE_DISPLAY_SIZE, INPUT_IMAGE_DISPLAY_SIZE);

  if (imageIsAnalyzed) {
    displayTileVariants(469, 500, 570, 180);
  }

  if (outputIsInitialized) {
    displayOutputGrid(1048, 40, OUTPUT_IMAGE_DISPLAY_SIZE, OUTPUT_IMAGE_DISPLAY_SIZE);
  }

  if (outputIsGenerating) {
    populateOutputGrid();
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
  // for (let tile of tileVariants) {
  //   for (let otherTileIndex = 0; otherTileIndex < tileVariants.length; otherTileIndex++) {
  //     tile.up.set(otherTileIndex, 0);
  //     tile.right.set(otherTileIndex, 0);
  //     tile.down.set(otherTileIndex, 0);
  //     tile.left.set(otherTileIndex, 0);
  //   }
  // }

  // create adjacency rules and frequency hints
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const tile = inputGrid[y][x]; // the tile we're looking at
      const tileVariant = tileVariants[tile.index]; // the tile to modify
      
      if (y > 0) { // there's a tile above us
        const upNeighbor = inputGrid[y - 1][x];
        if (!tileVariant.up.has(upNeighbor.index)) {
          tileVariant.up.set(upNeighbor.index, 1);
        } else {
          const upNeighborFrequency = tileVariant.up.get(upNeighbor.index);
          tileVariant.up.set(upNeighbor.index, upNeighborFrequency + 1);
        }
      }
      if (x < width - 1) { // there's a tile to our right
        const rightNeighbor = inputGrid[y][x + 1];
        if (!tileVariant.right.has(rightNeighbor.index)) {
          tileVariant.right.set(rightNeighbor.index, 1);
        } else {
          const rightNeighborFrequency = tileVariant.right.get(rightNeighbor.index);
          tileVariant.right.set(rightNeighbor.index, rightNeighborFrequency + 1);
        }
      }
      if (y < height - 1) { // there's a tile below us
        const downNeighbor = inputGrid[y + 1][x];
        if (!tileVariant.down.has(downNeighbor.index)) {
          tileVariant.down.set(downNeighbor.index, 1);
        } else {
          const downNeighborFrequency = tileVariant.down.get(downNeighbor.index);
          tileVariant.down.set(downNeighbor.index, downNeighborFrequency + 1);
        }
      }
      if (x > 0) { // there's a tile to our left
        const leftNeighbor = inputGrid[y][x - 1];
        if (!tileVariant.left.has(leftNeighbor.index)) {
          tileVariant.left.set(leftNeighbor.index, 1);
        } else {
          const leftNeighborFrequency = tileVariant.left.get(leftNeighbor.index);
          tileVariant.left.set(leftNeighbor.index, leftNeighborFrequency + 1);
        }
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
      // pass in the indices of the tile variants
      const tileIndices = tileVariants.map(tile => tile.index);
      outputGrid[y][x] = new Cell(tileIndices, x, y);
    }
  }

  outputIsInitialized = true;
}


function populateOutputGrid() {

  /* 
  ========================================================================
  Step 1:  Create a list of cells that have not yet been collapsed.
  ========================================================================
  */
  let uncollapsedCells = outputGrid.flat().filter(cell => !cell.collapsed);

  if (uncollapsedCells.length == 0) {
    console.log("finished generating output grid!");
    outputIsGenerating = false;
    outputIsComplete = true;
    enableDownloadButtons(true);
    return;
  }

  // console.log("uncollapsedCells:", {...uncollapsedCells});



  /*
  ========================================================================
  Step 2: Select the cell with the lowest entropy.
  ========================================================================
  */
  uncollapsedCells = uncollapsedCells.sort((a, b) => a.calculateEntropy() - b.calculateEntropy());

  // break ties in entropy by randomness
  let lowestEntropy = uncollapsedCells[0].calculateEntropy();
  let stopIndex = 0;
  for (let i = 1; i < uncollapsedCells.length; i++) {
    if (uncollapsedCells[i].calculateEntropy() > lowestEntropy) {
      stopIndex = i;
      break;
    }
  }
  if (stopIndex > 0) uncollapsedCells.splice(stopIndex); // cut out all cells with higher entropy
  const cell = random(uncollapsedCells); // pick a random cell that's tied for lowest entropy

  // console.log("Lowest entropy cell:", {...lowestEntropyCell});
  

  /*
  ========================================================================
  Step 3: Collapse the selected cell into a single tile.
  ========================================================================
  */
  if (cell.options.length === 0) {
    // TODO implement a way to backtrack instead of restarting
    startOver();
    return;
  }
  cell.collapse();
  const tile = tileVariants[cell.options[0]]; // only one option when collapsed


  /*
  ========================================================================
  Step 4: Update the options fields of the neighboring cells based on the 
          adjacency rules and frequency hints of the collapsed cell's tile.
  ========================================================================
  */
  if (cell.y > 0) { // there's a tile above us
    const upNeighbor = outputGrid[cell.y - 1][cell.x];

    if (!upNeighbor.collapsed) {
      // Remove tile options in neighbor that not present in this tile's 'up' options.
      // In other words, perform an INTERSECTION between neighbor's options and this tile's 'up' options

      // console.log("upNeighbor before:", {...upNeighbor});
      // console.log("tile.up:", tile.up);
      upNeighbor.options = upNeighbor.options.filter(tileOption => tile.up.has(tileOption));
      // console.log("upNeighbor after:", {...upNeighbor});
    }
  }

  if (cell.x < dim - 1) { // there's a tile to our right
    const rightNeighbor = outputGrid[cell.y][cell.x + 1];

    if (!rightNeighbor.collapsed) {
      rightNeighbor.options = rightNeighbor.options.filter(tileOption => tile.right.has(tileOption));
    }
  }

  if (cell.y < dim - 1) { // there's a tile below us
    const downNeighbor = outputGrid[cell.y + 1][cell.x];

    if (!downNeighbor.collapsed) {
      downNeighbor.options = downNeighbor.options.filter(tileOption => tile.down.has(tileOption));
    }
  }

  if (cell.x > 0) { // there's a tile to our left
    const leftNeighbor = outputGrid[cell.y][cell.x - 1];

    if (!leftNeighbor.collapsed) {
      leftNeighbor.options = leftNeighbor.options.filter(tileOption => tile.left.has(tileOption));
    }
  }
}

