const tileVariants = [];
const scannedTiles = new Set();

let inputImage = null;


/** 2D Array. Contains tile objects taken from the input image */
let inputGrid = [];
/** 2D Array. Contains cells that get collapsed into tiles */
let outputGrid = [];

/** output image size in tiles */
let dim = 25; //TODO grab from user input
/** tile size in pixels*/
let tilePixelSize = 22; //TODO grab from user input
let tileDisplaySize = 0; // TODO should depend on size of input image (smaller images should have larger tiles)
const INPUT_IMAGE_DISPLAY_SIZE = 400;



/**
 * Separate the tiles from the input image into individual 
 * tile objects and store them in the input grid
 */
function parseImage() {
  // Clear the input grid
  inputGrid = [];

  for (let y = 0, row = 0; y < inputImage.height; y += tilePixelSize, row++) {
    inputGrid[row] = [];
    for (let x = 0, col = 0; x < inputImage.width; x += tilePixelSize, col++) {
      // Extract the portion of the image at the given x and y coordinates
      const tileImage = inputImage.get(x, y, tilePixelSize, tilePixelSize);
      const tile = new Tile(tileImage);
      
      // Add the tile to the input grid
      inputGrid[row][col] = tile;
      
      // If this type of tile hasn't been seen, make a new variant
      if (!scannedTiles.has(tile.hash)) {
        scannedTiles.add(tile.hash);
        tileVariants.push(tile);
      }
    }
  }

  const gridWidth = inputGrid[0].length;
  tileDisplaySize = INPUT_IMAGE_DISPLAY_SIZE / gridWidth;
}

/**
 * Analyze the tiles in the input grid to determine adjacency rules and frequency hints
 */
function analyzeTiles() {
  // Create adjacency rules and frequency hints for each unique tile
  const height = inputGrid.length;
  const width = inputGrid[0].length;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const tile = inputGrid[y][x];
      
      if (y > 0) { // there's a tile above us
        // put the tile above us in the adjacency rules
        tile.up.push(inputGrid[y - 1][x])
        
        // update frequency hints to factor in the tile above us

      }
      if (x < width - 1) { // there's a tile to our right
        tile.up.push(inputGrid[y][x + 1])
        

      }
      if (y < height - 1) { // there's a tile below us
        tile.up.push(inputGrid[y + 1][x])
        

      }
      if (x > 0) { // there's a tile to our left
        tile.up.push(inputGrid[y][x - 1])
        

      }
    }
  }
}

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

  const margin = 10;
  const spacing = tilePixelSize / 5 + 1;

  for (let y = 0; y < inputGrid.length; y++) {
    for (let x = 0; x < inputGrid[y].length; x++) {
      const tile = inputGrid[y][x];
      const xPos = x * (tileDisplaySize + spacing) + margin;
      const yPos = y * (tileDisplaySize + spacing) + margin;
      image(tile.img, xPos, yPos, tileDisplaySize, tileDisplaySize);

      // Draw black lines around the tile
      stroke(0);
      strokeWeight(1);
      noFill();
      rect(xPos, yPos, tileDisplaySize, tileDisplaySize);
    }
  }
}

function startOver() {
  // Create cell for each spot on the grid
  for (let i = 0; i < dim * dim; i++) {
    outputGrid[i] = new Cell(tileVariants.length);
  }
}

function checkValid(arr, valid) {
  //console.log(arr, valid);
  for (let i = arr.length - 1; i >= 0; i--) {
    // VALID: [BLANK, RIGHT]
    // ARR: [BLANK, UP, RIGHT, DOWN, LEFT]
    // result in removing UP, DOWN, LEFT
    let element = arr[i];
    // console.log(element, valid.includes(element));
    if (!valid.includes(element)) {
      arr.splice(i, 1);
    }
  }
  // console.log(arr);
  // console.log("----------");
}

function mousePressed() {
  redraw();
}
/*
function draw() {
  background(0);

  const w = width / OUTPUT_SIZE;
  const h = height / OUTPUT_SIZE;
  for (let j = 0; j < OUTPUT_SIZE; j++) {
    for (let i = 0; i < OUTPUT_SIZE; i++) {
      let cell = output_grid[i + j * OUTPUT_SIZE];
      if (cell.collapsed) {
        let index = cell.options[0];
        image(tileVariants[index].img, i * w, j * h, w, h);
      } else {
        noFill();
        stroke(51);
        rect(i * w, j * h, w, h);
      }
    }
  }

  // Pick cell with least entropy
  let gridCopy = output_grid.slice();
  gridCopy = gridCopy.filter((a) => !a.collapsed);
  // console.table(grid);
  // console.table(gridCopy);

  if (gridCopy.length == 0) {
    return;
  }
  gridCopy.sort((a, b) => {
    // return a.calculateEntropy() - b.calculateEntropy();
    return a.options.length - b.options.length;
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
  for (let j = 0; j < OUTPUT_SIZE; j++) {
    for (let i = 0; i < OUTPUT_SIZE; i++) {
      let index = i + j * OUTPUT_SIZE;
      if (output_grid[index].collapsed) {
        nextGrid[index] = output_grid[index];
      } else {
        let options = new Array(tileVariants.length).fill(0).map((x, i) => i);
        // Look up
        if (j > 0) {
          let up = output_grid[i + (j - 1) * OUTPUT_SIZE];
          let validOptions = [];
          for (let option of up.options) {
            let valid = tileVariants[option].down;
            validOptions = validOptions.concat(valid);
          }
          checkValid(options, validOptions);
        }
        // Look right
        if (i < OUTPUT_SIZE - 1) {
          let right = output_grid[i + 1 + j * OUTPUT_SIZE];
          let validOptions = [];
          for (let option of right.options) {
            let valid = tileVariants[option].left;
            validOptions = validOptions.concat(valid);
          }
          checkValid(options, validOptions);
        }
        // Look down
        if (j < OUTPUT_SIZE - 1) {
          let down = output_grid[i + (j + 1) * OUTPUT_SIZE];
          let validOptions = [];
          for (let option of down.options) {
            let valid = tileVariants[option].up;
            validOptions = validOptions.concat(valid);
          }
          checkValid(options, validOptions);
        }
        // Look left
        if (i > 0) {
          let left = output_grid[i - 1 + j * OUTPUT_SIZE];
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

  output_grid = nextGrid;
}
*/

