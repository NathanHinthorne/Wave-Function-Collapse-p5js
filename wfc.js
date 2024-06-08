/**
 * This file contains the main logic for the Wave Function Collapse algorithm.
 * 
 * @author Nathan Hinthorne
 */

/** 2D Array. Contains tile objects taken from the input image */
let inputGrid = [];

/** 2D Array. Contains cells that get collapsed into tiles */
let outputGrid = [];

/** The types of tiles that can be used in the output grid */
let tileVariants = [];

const distantNeighborWeight = 0.5;


// Backtracking variables

/** A stack of previous output grid states to allow for backtracking */
let gridStates = [];

/** A stack of cell collapsing decisions made by the program to allow for backtracking */
let decisions = [];


// Analysis variables

/** The number of times the program has backtracked */
let backtrackAttempts = 0;

/** The number of iterations of WFC it takes to fully populate the output grid */
let totalCycleCount = 1;

/** The number of times WFC has backtracked to fully populate the output grid */
let totalBacktracks = 0;

let completionProgress = 0;

let totalProgramExecutions = 1;


const logs = [];
function myLogger(...args) {
  // Call the original console.log function
  console.log.apply(console, args);

  // Add the log to the logs array
  logs.push(args.join(' '));
}



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
  inputImage = loadImage('assets/sample_input/demo8.png');
}

function setup() {
  parseImage(); // parse the example image
  setupView();

  frameRate(60);

  myLogger("Grid size, Backtracks");
}




function draw() {
  noSmooth();

  background(255);
  // clear(); // use this instead if you want to make a cool css background in style.css

  displayInputGrid(10, 10, INPUT_IMAGE_DISPLAY_SIZE, INPUT_IMAGE_DISPLAY_SIZE);

  if (imageIsAnalyzed) {
    displayTileVariants(469, 500, 570, 180);

    // if (optionsIsPressed) {
    displayBehaviors(1048, 550, 450, 130);
    // }
  }

  if (outputIsInitialized) {
    displayOutputGrid(1048, 10, OUTPUT_IMAGE_DISPLAY_SIZE, OUTPUT_IMAGE_DISPLAY_SIZE);
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
  findTileNeighbors();
}

/**
 * Find all the unique tile variants in the input grid
 */
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
        tile.totalFrequencyInGrid = 1;

      } else {
        // If this type of tile has been seen, find the variant and set the index
        for (let variant of tileVariants) {
          if (variant.hash === tile.hash) {
            tile.index = variant.index;
            break;
          }
        }
        tile.totalFrequencyInGrid += 1;
      }
    }
  }
}

/**
 * Analyze the tiles in the input grid to determine adjacency rules and frequency hints
 */
function findTileNeighbors() {
  const height = inputGrid.length;
  const width = inputGrid[0].length;


  const mostCommonTile = tileVariants.reduce((mostCommonTile, tile) => {
    if (tile.totalFrequencyInGrid > mostCommonTile.totalFrequencyInGrid) {
      return tile;
    }
    return mostCommonTile;
  });

  const airTiles = tileVariants.reduce((airTiles, tile) => {
    if (tile.behavior === "air") {
      airTiles.push(tile);
    }
    return airTiles;
  }, []);

  let edgeNeighbors = [];

  // check for tiles categorized as "air". Let those override the most common tile
  if (airTiles.length > 0) {
    edgeNeighbors = airTiles;
  } else {
    edgeNeighbors.push(mostCommonTile);
  }

  // create adjacency rules and frequency hints
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const tile = inputGrid[y][x]; // the tile we're looking at
      const tileVariant = tileVariants[tile.index]; // the tile to modify

      // --- immediate neighbors ---
      if (y > 0) { // there's a tile above us
        const upNeighbor = inputGrid[y - 1][x];
        if (!tileVariant.up.has(upNeighbor.index)) {
          tileVariant.up.set(upNeighbor.index, 1);
        } else {
          const upNeighborFrequency = tileVariant.up.get(upNeighbor.index);
          tileVariant.up.set(upNeighbor.index, upNeighborFrequency + 1);
        }
      }
      else {
        // there's no tile above us, so let's put artificial constraints on the top side
        for (let edgeNeighbor of edgeNeighbors) {
          tileVariant.up.set(edgeNeighbor.index, 1);
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
      else {
        // there's no tile to our right, so let's put artificial constraints on the right side
        for (let edgeNeighbor of edgeNeighbors) {
          tileVariant.right.set(edgeNeighbor.index, 1);
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
      else {
        // there's no tile below us, so let's put artificial constraints on the bottom side
        for (let edgeNeighbor of edgeNeighbors) {
          tileVariant.down.set(edgeNeighbor.index, 1);
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
      else {
        // there's no tile to our left, so let's put artificial constraints on the left side
        for (let edgeNeighbor of edgeNeighbors) {
          tileVariant.left.set(edgeNeighbor.index, 1);
        }
      }




      // --- distant neighbors ---
      if (y > 1) { // there's a tile two above us
        const up2Neighbor = inputGrid[y - 2][x];
        if (!tileVariant.up2.has(up2Neighbor.index)) {
          tileVariant.up2.set(up2Neighbor.index, 1);
        } else {
          const up2NeighborFrequency = tileVariant.up2.get(up2Neighbor.index);
          tileVariant.up2.set(up2Neighbor.index, up2NeighborFrequency + 1);
        }
      } else {
        // there's no tile two above us, so let's put artificial constraints on the top side
        for (let edgeNeighbor of edgeNeighbors) {
          tileVariant.up2.set(edgeNeighbor.index, 1);
        }
      }

      if (x < width - 2) { // there's a tile two to our right
        const right2Neighbor = inputGrid[y][x + 2];
        if (!tileVariant.right2.has(right2Neighbor.index)) {
          tileVariant.right2.set(right2Neighbor.index, 1);
        } else {
          const right2NeighborFrequency = tileVariant.right2.get(right2Neighbor.index);
          tileVariant.right2.set(right2Neighbor.index, right2NeighborFrequency + 1);
        }
      } else {
        // there's no tile two to our right, so let's put artificial constraints on the right side
        for (let edgeNeighbor of edgeNeighbors) {
          tileVariant.right2.set(edgeNeighbor.index, 1);
        }
      }

      if (y < height - 2) { // there's a tile two below us
        const down2Neighbor = inputGrid[y + 2][x];
        if (!tileVariant.down2.has(down2Neighbor.index)) {
          tileVariant.down2.set(down2Neighbor.index, 1);
        } else {
          const down2NeighborFrequency = tileVariant.down2.get(down2Neighbor.index);
          tileVariant.down2.set(down2Neighbor.index, down2NeighborFrequency + 1);
        }
      } else {
        // there's no tile two below us, so let's put artificial constraints on the bottom side
        for (let edgeNeighbor of edgeNeighbors) {
          tileVariant.down2.set(edgeNeighbor.index, 1);
        }
      }

      if (x > 1) { // there's a tile two to our left
        const left2Neighbor = inputGrid[y][x - 2];
        if (!tileVariant.left2.has(left2Neighbor.index)) {
          tileVariant.left2.set(left2Neighbor.index, 1);
        } else {
          const left2NeighborFrequency = tileVariant.left2.get(left2Neighbor.index);
          tileVariant.left2.set(left2Neighbor.index, left2NeighborFrequency + 1);
        }
      } else {
        // there's no tile two to our left, so let's put artificial constraints on the left side
        for (let edgeNeighbor of edgeNeighbors) {
          tileVariant.left2.set(edgeNeighbor.index, 1);
        }
      }

      if (y > 0 && x > 0) { // there's a tile up and to the left
        const upLeftNeighbor = inputGrid[y - 1][x - 1];
        if (!tileVariant.upLeft.has(upLeftNeighbor.index)) {
          tileVariant.upLeft.set(upLeftNeighbor.index, 1);
        } else {
          const upLeftNeighborFrequency = tileVariant.upLeft.get(upLeftNeighbor.index);
          tileVariant.upLeft.set(upLeftNeighbor.index, upLeftNeighborFrequency + 1);
        }
      } else {
        // there's no tile up and to the left, so let's put artificial constraints on the top left side
        for (let edgeNeighbor of edgeNeighbors) {
          tileVariant.upLeft.set(edgeNeighbor.index, 1);
        }
      }

      if (y > 0 && x < width - 1) { // there's a tile up and to the right
        const upRightNeighbor = inputGrid[y - 1][x + 1];
        if (!tileVariant.upRight.has(upRightNeighbor.index)) {
          tileVariant.upRight.set(upRightNeighbor.index, 1);
        } else {
          const upRightNeighborFrequency = tileVariant.upRight.get(upRightNeighbor.index);
          tileVariant.upRight.set(upRightNeighbor.index, upRightNeighborFrequency + 1);
        }
      } else {
        // there's no tile up and to the right, so let's put artificial constraints on the top right side
        for (let edgeNeighbor of edgeNeighbors) {
          tileVariant.upRight.set(edgeNeighbor.index, 1);
        }
      }

      if (y < height - 1 && x > 0) { // there's a tile down and to the left
        const downLeftNeighbor = inputGrid[y + 1][x - 1];
        if (!tileVariant.downLeft.has(downLeftNeighbor.index)) {
          tileVariant.downLeft.set(downLeftNeighbor.index, 1);
        } else {
          const downLeftNeighborFrequency = tileVariant.downLeft.get(downLeftNeighbor.index);
          tileVariant.downLeft.set(downLeftNeighbor.index, downLeftNeighborFrequency + 1);
        }
      } else {
        // there's no tile down and to the left, so let's put artificial constraints on the bottom left side
        for (let edgeNeighbor of edgeNeighbors) {
          tileVariant.downLeft.set(edgeNeighbor.index, 1);
        }
      }

      if (y < height - 1 && x < width - 1) { // there's a tile down and to the right
        const downRightNeighbor = inputGrid[y + 1][x + 1];
        if (!tileVariant.downRight.has(downRightNeighbor.index)) {
          tileVariant.downRight.set(downRightNeighbor.index, 1);
        } else {
          const downRightNeighborFrequency = tileVariant.downRight.get(downRightNeighbor.index);
          tileVariant.downRight.set(downRightNeighbor.index, downRightNeighborFrequency + 1);
        }
      } else {
        // there's no tile down and to the right, so let's put artificial constraints on the bottom right side
        for (let edgeNeighbor of edgeNeighbors) {
          tileVariant.downRight.set(edgeNeighbor.index, 1);
        }
      }
    }
  }
}


/**
 * Clear the output grid and create a new cell for each spot on the grid
 */
function initializeOutputGrid() {
  outputGrid = []; // Clear the output grid

  totalBacktracks = 0;
  totalCycleCount = 1;

  const floorTiles = tileVariants.filter((tile) => tile.behavior == 'floor');

  // Create cell for each spot on the grid
  for (let y = 0; y < dim; y++) { //TODO change this when dims are not equal (not a square grid)
    outputGrid[y] = [];
    for (let x = 0; x < dim; x++) {
      // pass in the indices of the tile variants
      const tileIndices = tileVariants.map(tile => tile.index);
      outputGrid[y][x] = new Cell(tileIndices, x, y);

      // Exclude floor tiles from the options of every cell EXCEPT bottom row
      if (y < dim - 1) {
        for (const floorTile of floorTiles) {
          outputGrid[y][x].exclude(floorTile.index);
        }
      }
    }
  }

  outputIsInitialized = true;
}


function restartOutputGrid() {
  outputGrid = [];

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

/**
 * Collapses a cell into a single tile in a way which respects the local constraints.
 */
function populateOutputGrid() {

  const gridWidth = outputGrid[0].length;
  const gridHeight = outputGrid.length;

  // Before collapsing a cell, push the current state of the grid to the stack
  saveGridState();

  /* 
  ========================================================================
  Step 1:  Create a list of cells that have not yet been collapsed.
  ========================================================================
  */
  let uncollapsedCells = outputGrid.flat().filter(cell => !cell.collapsed);
  completionProgress = 1 - (uncollapsedCells.length / (dim * dim));

  if (uncollapsedCells.length == 0) {
    outputIsGenerating = false;
    outputIsComplete = true;
    enableDownloadButtons(true);
    myLogger((dim * dim) + "," + totalBacktracks);
    totalProgramExecutions++;
    return;
  }

  // playPopSfx();

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


  /*
  ========================================================================
  Step 3: Backtrack if necessary
  ========================================================================
  */
  if (cell.options.size == 0) {
    if (backtrackAttempts < 5) {
      // look one steps back
      backtrack(1);
      backtrackAttempts++;

    } else if (backtrackAttempts >= 5 && backtrackAttempts < 10) {
      // look two steps back
      backtrack(2);
      backtrackAttempts++;

    } else if (backtrackAttempts >= 10 && backtrackAttempts < 20) {
      // look five steps back
      backtrack(5);
      backtrackAttempts++;

    } else { // if we've backtracked 20 times, just start over
      restartOutputGrid();
    }
    return;
  }
  backtrackAttempts = 0; // reset the backtrack counter


  /*
  ========================================================================
  Step 4: Collapse the selected cell into a single tile.
  ========================================================================
  */
  cell.collapse();
  const tile = tileVariants[cell.selectedTile];

  decisions.push(new Decision(cell, tile.index));


  /*
  ========================================================================
  Step 5: Update the options fields of the neighboring cells based on the 
          adjacency rules and frequency hints of the collapsed cell's tile.
  ========================================================================
  */
  if (cell.y > 0) { // there's a tile above us
    const upNeighbor = outputGrid[cell.y - 1][cell.x];

    if (!upNeighbor.collapsed) {
      // Remove tile options in neighbor that are not present in this tile's 'up' options.
      // In other words, perform an INTERSECTION between neighbor's options and this tile's 'up' options

      upNeighbor.options.forEach((optionFrequency, optionTile) => {
        if (!tile.up.has(optionTile)) {
          upNeighbor.options.delete(optionTile);
        } else {
          // Combine the frequencies of the tile options
          const currentTileFrequency = tile.up.get(optionTile);
          upNeighbor.options.set(optionTile, optionFrequency + currentTileFrequency);
        }
      });
    }
  }

  if (cell.x < gridWidth - 1) { // there's a tile to our right
    const rightNeighbor = outputGrid[cell.y][cell.x + 1];

    if (!rightNeighbor.collapsed) {

      rightNeighbor.options.forEach((optionFrequency, optionTile) => {
        if (!tile.right.has(optionTile)) {
          rightNeighbor.options.delete(optionTile);
        } else {
          // Combine the frequencies of the tile options
          const currentTileFrequency = tile.right.get(optionTile);
          rightNeighbor.options.set(optionTile, optionFrequency + currentTileFrequency);
        }
      });
    }
  }

  if (cell.y < gridHeight - 1) { // there's a tile below us
    const downNeighbor = outputGrid[cell.y + 1][cell.x];

    if (!downNeighbor.collapsed) {

      downNeighbor.options.forEach((optionFrequency, optionTile) => {
        if (!tile.down.has(optionTile)) {
          downNeighbor.options.delete(optionTile);
        } else {
          // Combine the frequencies of the tile options
          const currentTileFrequency = tile.down.get(optionTile);
          downNeighbor.options.set(optionTile, optionFrequency + currentTileFrequency);
        }
      });
    }
  }

  if (cell.x > 0) { // there's a tile to our left
    const leftNeighbor = outputGrid[cell.y][cell.x - 1];

    if (!leftNeighbor.collapsed) {

      leftNeighbor.options.forEach((optionFrequency, optionTile) => {
        if (!tile.left.has(optionTile)) {
          leftNeighbor.options.delete(optionTile);
        } else {
          // Combine the frequencies of the tile options
          const currentTileFrequency = tile.left.get(optionTile);
          leftNeighbor.options.set(optionTile, optionFrequency + currentTileFrequency);
        }
      });
    }
  }

  if (cell.y > 1) { // there's a tile two above us
    const up2Neighbor = outputGrid[cell.y - 2][cell.x];

    if (!up2Neighbor.collapsed) {

      up2Neighbor.options.forEach((optionFrequency, optionTile) => {
        if (!tile.up2.has(optionTile)) {
          up2Neighbor.options.delete(optionTile);
        } else {
          // Combine the frequencies of the tile options
          const currentTileFrequency = tile.up2.get(optionTile); // freq of tile two above
          up2Neighbor.options.set(optionTile, optionFrequency + (currentTileFrequency * distantNeighborWeight));
        }
      });
    }
  }

  if (cell.x < gridWidth - 2) { // there's a tile two to our right
    const right2Neighbor = outputGrid[cell.y][cell.x + 2];

    if (!right2Neighbor.collapsed) {

      right2Neighbor.options.forEach((optionFrequency, optionTile) => {
        if (!tile.right2.has(optionTile)) {
          right2Neighbor.options.delete(optionTile);
        } else {
          // Combine the frequencies of the tile options
          const currentTileFrequency = tile.right2.get(optionTile); // freq of tile two to the right
          right2Neighbor.options.set(optionTile, optionFrequency + (currentTileFrequency * distantNeighborWeight));
        }
      });
    }
  }

  if (cell.y < gridHeight - 2) { // there's a tile two below us
    const down2Neighbor = outputGrid[cell.y + 2][cell.x];

    if (!down2Neighbor.collapsed) {

      down2Neighbor.options.forEach((optionFrequency, optionTile) => {
        if (!tile.down2.has(optionTile)) {
          down2Neighbor.options.delete(optionTile);
        } else {
          // Combine the frequencies of the tile options
          const currentTileFrequency = tile.down2.get(optionTile); // freq of tile two below
          down2Neighbor.options.set(optionTile, optionFrequency + (currentTileFrequency * distantNeighborWeight));
        }
      });
    }
  }

  if (cell.x > 1) { // there's a tile two to our left
    const left2Neighbor = outputGrid[cell.y][cell.x - 2];

    if (!left2Neighbor.collapsed) {

      left2Neighbor.options.forEach((optionFrequency, optionTile) => {
        if (!tile.left2.has(optionTile)) {
          left2Neighbor.options.delete(optionTile);
        } else {
          // Combine the frequencies of the tile options
          const currentTileFrequency = tile.left2.get(optionTile); // freq of tile two to the left
          left2Neighbor.options.set(optionTile, optionFrequency + (currentTileFrequency * distantNeighborWeight));
        }
      });
    }
  }

  if (cell.y > 0 && cell.x > 0) { // there's a tile up and to the left
    const upLeftNeighbor = outputGrid[cell.y - 1][cell.x - 1];

    if (!upLeftNeighbor.collapsed) {

      upLeftNeighbor.options.forEach((optionFrequency, optionTile) => {
        if (!tile.upLeft.has(optionTile)) {
          upLeftNeighbor.options.delete(optionTile);
        } else {
          // Combine the frequencies of the tile options
          const currentTileFrequency = tile.upLeft.get(optionTile); // freq of tile up and to the left
          upLeftNeighbor.options.set(optionTile, optionFrequency + (currentTileFrequency * distantNeighborWeight));
        }
      });
    }
  }

  if (cell.y > 0 && cell.x < gridWidth - 1) { // there's a tile up and to the right
    const upRightNeighbor = outputGrid[cell.y - 1][cell.x + 1];

    if (!upRightNeighbor.collapsed) {

      upRightNeighbor.options.forEach((optionFrequency, optionTile) => {
        if (!tile.upRight.has(optionTile)) {
          upRightNeighbor.options.delete(optionTile);
        } else {
          // Combine the frequencies of the tile options
          const currentTileFrequency = tile.upRight.get(optionTile); // freq of tile up and to the right
          upRightNeighbor.options.set(optionTile, optionFrequency + (currentTileFrequency * distantNeighborWeight));
        }
      });
    }
  }

  if (cell.y < gridHeight - 1 && cell.x > 0) { // there's a tile down and to the left
    const downLeftNeighbor = outputGrid[cell.y + 1][cell.x - 1];

    if (!downLeftNeighbor.collapsed) {

      downLeftNeighbor.options.forEach((optionFrequency, optionTile) => {
        if (!tile.downLeft.has(optionTile)) {
          downLeftNeighbor.options.delete(optionTile);
        } else {
          // Combine the frequencies of the tile options
          const currentTileFrequency = tile.downLeft.get(optionTile); // freq of tile down and to the left
          downLeftNeighbor.options.set(optionTile, optionFrequency + (currentTileFrequency * distantNeighborWeight));
        }
      });
    }
  }

  if (cell.y < gridHeight - 1 && cell.x < gridWidth - 1) { // there's a tile down and to the right
    const downRightNeighbor = outputGrid[cell.y + 1][cell.x + 1];

    if (!downRightNeighbor.collapsed) {

      downRightNeighbor.options.forEach((optionFrequency, optionTile) => {
        if (!tile.downRight.has(optionTile)) {
          downRightNeighbor.options.delete(optionTile);
        } else {
          // Combine the frequencies of the tile options
          const currentTileFrequency = tile.downRight.get(optionTile); // freq of tile down and to the right
          downRightNeighbor.options.set(optionTile, optionFrequency + (currentTileFrequency * distantNeighborWeight));
        }
      });
    }
  }

  totalCycleCount++;
}

// When we backtrack, we restore the state and exclude the previous decision
function backtrack(steps) {
  const poppedDecisions = [];

  for (let i = 0; i < steps; i++) {
    const decision = decisions.pop();
    poppedDecisions.push(decision);

    gridStates.pop();
  }

  // restore the grid state
  const prevGridState = gridStates[gridStates.length - 1];
  outputGrid = prevGridState.map(row => row.map(cellObj => {
    const cell = Cell.fromObject(cellObj);
    cell.options = new Map(cell.options);
    return cell;
  }));

  // exclude the tile options in the restored grid state
  for (const decision of poppedDecisions) {
    const cell = outputGrid[decision.cell.y][decision.cell.x];
    if (!cell.collapsed) {
      cell.exclude(decision.tileIndex);
    } else {
      initializeOutputGrid();
      break;
    }
  }

  totalBacktracks++;
}

/**
 * Save a deep copy of the current grid state to the stack
 */
function saveGridState() {
  gridStates.push(outputGrid.map(row => row.map(cell => {
    let cellCopy = Object.assign({}, cell);
    cellCopy.options = Array.from(cell.options);
    return cellCopy;
  })));
}