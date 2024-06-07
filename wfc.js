/**
 * This file contains the main logic for the Wave Function Collapse algorithm.
 * 
 * @author Nathan Hinthorne
 */

/** The types of tiles that can be used in the output grid */
let tileVariants = [];

/** 2D Array. Contains tile objects taken from the input image */
let inputGrid = [];

/** 2D Array. Contains cells that get collapsed into tiles */
let outputGrid = [];


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

  // if (outputIsComplete) {
  //   setup(); // restart setup for next test
  //   startOver(); // place cells back in the grid
  //   outputIsComplete = false;

  //   totalProgramExecutions++;
  //   if (totalProgramExecutions % 10 == 0) {
  //     dim++;
  //   }
  // }
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

  findClusterNeighbors();
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
    console.log("Air tiles found:", airTiles);
    edgeNeighbors = airTiles;
  } else {
    console.log("No air tiles found. Using most common tile as edge neighbor.");
    edgeNeighbors.push(mostCommonTile);
  }

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
    }
  }
}

/**
 * 
 */
function findClusterNeighbors() {

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
 * Collapsing a cell into a single tile in a way which respects the local constraints.
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
      // Remove tile options in neighbor that are not present in this tile's 'right' options.
      // In other words, perform an INTERSECTION between neighbor's options and this tile's 'right' options

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
      // Remove tile options in neighbor that are not present in this tile's 'down' options.
      // In other words, perform an INTERSECTION between neighbor's options and this tile's 'down' options

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
      // Remove tile options in neighbor that are not present in this tile's 'left' options.
      // In other words, perform an INTERSECTION between neighbor's options and this tile's 'left' options

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