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

/** Every unique cluster found in the input grid. Clusters are considered the same if they have the same dominant tile. 
 * Note: Not all tile variants will be represented in the list of clusters. */
let uniqueClusters = []

/** 2D Array. Contains all clusters in the input grid */
let inputClusters = [];

const clusterWeight = 1;

/*
 When two clusters composed of the same dominant tile are found next to each other, we've identified a pattern.

 To make use of this pattern, look at all tiles in cluster radius of the current cell (this becomes a new cluster).
 If new cluster is solid, take its dominant tile and find the frequency of which neighbors it can have. Let this 
 frequency be a factor in the current cell's tile options.

 This is different than having distant neighbors because tile clusters don't care about DIRECTION (i.e. they won't cause 
  a cell to be constrained to a specific tile in a specific direction). Instead, they care about the tile itself and its
  frequency in the cluster.

  Reasons to have clusters:
  So a cell can "see" multiple tiles that were previously placed before it collapses.
  To "go with the flow". If WFC begins collapsing cells in a certain way, it should
  stick to that pattern for a little bit. This is especially useful for generating tunnels in caves.


 when collapsing a cell: need a way to decide which should overrule the other, cluster patterns or tile patterns? 
                        should they combine like with frequencies to result in a decision?
 */



/* ChatGPT reponse on above:

The idea of using tile clusters to identify patterns and 
influence the tile selection process seems like a good approach 
to enhance the Wave Function Collapse algorithm. It can 
potentially improve the output by making it more closely 
resemble the input patterns.

Here are some thoughts on the comments in your code:

Identifying Patterns: The idea of identifying patterns 
based on dominant tiles in clusters is a good one. This 
can help to capture larger structures in the input 
pattern that might be missed when looking at individual tiles.

Cluster Influence: Using the frequency of neighboring 
tiles of the dominant tile in a solid cluster to influence 
the tile options for a cell is a good way to incorporate 
the cluster information into the tile selection process. 
This can help to ensure that the output pattern follows 
the input pattern more closely.

Direction vs Frequency: The distinction between distant 
neighbors (which care about direction) and clusters (which 
care about tile frequency) is an important one. This 
can allow the algorithm to capture different types of 
patterns in the input.

Collapsing a Cell: The question of how to combine the 
influence of cluster patterns and tile patterns when 
collapsing a cell is a key one. One approach could be 
to combine them like frequencies, as you suggested. 
Another approach could be to use a weighting system, 
where you assign different weights to the cluster 
pattern and the tile pattern based on their importance.
*/


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

  findUniqueClusters();
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
    edgeNeighbors = airTiles;
  } else {
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
 * Find all unique tile clusters in the input grid.
 */
function findUniqueClusters() {
  inputClusters = [];
  uniqueClusters = [];

  const scannedClusters = new Set();

  const width = inputGrid[0].length;
  const height = inputGrid.length;

  for (let y = 1; y < height - 1; y++) {
    inputClusters[y] = [];
    for (let x = 1; x < width - 1; x++) {

      const cluster = new TileCluster([
        [inputGrid[y - 1][x - 1], inputGrid[y - 1][x], inputGrid[y - 1][x + 1]],
        [inputGrid[y][x - 1], inputGrid[y][x], inputGrid[y][x + 1]],
        [inputGrid[y + 1][x - 1], inputGrid[y + 1][x], inputGrid[y + 1][x + 1]]
      ]);

      inputClusters[y][x] = cluster;

      if (cluster.isSolid()) { // throw out clusters that are not solid
        if (!scannedClusters.has(cluster.dominantTileIndex)) {
          scannedClusters.add(cluster.dominantTileIndex);
          uniqueClusters[cluster.dominantTileIndex] = cluster;
        }
      }
    }
  }
  console.log(inputClusters);

}

/**
 * Find the neighboring clusters of a cluster at a given x and y coordinate
 */
function findClusterNeighbors() {
  const width = inputGrid[0].length;
  const height = inputGrid.length;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const cluster = inputClusters[y][x]; // the cluster we're looking at

      if (!cluster.isSolid()) {
        continue;
      }

      // we have a solid cluster, so let's modify it
      const uniqueCluster = uniqueClusters[cluster.dominantTileIndex]; // the cluster to modify

      if (y > 2) { // there's a cluster above us
        const upNeighbor = inputClusters[y - 1][x];

        if (upNeighbor.isSolid()) {
          if (!uniqueCluster.up.has(upNeighbor.dominantTileIndex)) {
            uniqueCluster.up.set(upNeighbor.dominantTileIndex, 1);
          } else {
            const upNeighborFrequency = uniqueCluster.up.get(upNeighbor.dominantTileIndex);
            uniqueCluster.up.set(upNeighbor.dominantTileIndex, upNeighborFrequency + 1);
          }
        }
      }

      if (x < width - 3) { // there's a cluster to our right
        const rightNeighbor = inputClusters[y][x + 1];

        if (rightNeighbor.isSolid()) {
          if (!uniqueCluster.right.has(rightNeighbor.dominantTileIndex)) {
            uniqueCluster.right.set(rightNeighbor.dominantTileIndex, 1);
          } else {
            const rightNeighborFrequency = uniqueCluster.right.get(rightNeighbor.dominantTileIndex);
            uniqueCluster.right.set(rightNeighbor.dominantTileIndex, rightNeighborFrequency + 1);
          }
        }
      }

      if (y < height - 3) { // there's a cluster below us
        const downNeighbor = inputClusters[y + 1][x];

        if (downNeighbor.isSolid()) {
          if (!uniqueCluster.down.has(downNeighbor.dominantTileIndex)) {
            uniqueCluster.down.set(downNeighbor.dominantTileIndex, 1);
          } else {
            const downNeighborFrequency = uniqueCluster.down.get(downNeighbor.dominantTileIndex);
            uniqueCluster.down.set(downNeighbor.dominantTileIndex, downNeighborFrequency + 1);
          }
        }
      }

      if (x > 2) { // there's a cluster to our left
        const leftNeighbor = inputClusters[y][x - 1];

        if (leftNeighbor.isSolid()) {
          if (!uniqueCluster.left.has(leftNeighbor.dominantTileIndex)) {
            uniqueCluster.left.set(leftNeighbor.dominantTileIndex, 1);
          } else {
            const leftNeighborFrequency = uniqueCluster.left.get(leftNeighbor.dominantTileIndex);
            uniqueCluster.left.set(leftNeighbor.dominantTileIndex, leftNeighborFrequency + 1);
          }
        }
      }

    }
  }

  console.log(uniqueClusters);
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
  Step 3.5: Influence the cell's tile options based on the cluster patterns
  ========================================================================
  */
  if (cell.y > 0 && cell.x > 0 && cell.y < dim - 1 && cell.x < dim - 1) {
    const cluster = inputClusters[cell.y][cell.x];

    if (cluster.isSolid()) {
      console.log("Influencing cell options", cell.options)
      const uniqueCluster = uniqueClusters[cluster.dominantTileIndex];

      // combine the frequencies of the tile options
      for (const [tileIndex, frequency] of uniqueCluster.up) {
        if (cell.options.has(tileIndex)) {
          const currentFrequency = cell.options.get(tileIndex);
          cell.options.set(tileIndex, currentFrequency + (frequency * clusterWeight));
        }
      }

      for (const [tileIndex, frequency] of uniqueCluster.right) {
        if (cell.options.has(tileIndex)) {
          const currentFrequency = cell.options.get(tileIndex);
          cell.options.set(tileIndex, currentFrequency + (frequency * clusterWeight));
        }
      }

      for (const [tileIndex, frequency] of uniqueCluster.down) {
        if (cell.options.has(tileIndex)) {
          const currentFrequency = cell.options.get(tileIndex);
          cell.options.set(tileIndex, currentFrequency + (frequency * clusterWeight));
        }
      }

      for (const [tileIndex, frequency] of uniqueCluster.left) {
        if (cell.options.has(tileIndex)) {
          const currentFrequency = cell.options.get(tileIndex);
          cell.options.set(tileIndex, currentFrequency + (frequency * clusterWeight));
        }
      }

      console.log("new options", cell.options);
    }
  }


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