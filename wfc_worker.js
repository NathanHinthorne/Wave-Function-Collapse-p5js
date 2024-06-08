//! 
/*
    This web worker is not currently being used in the project. 
    It was an attempt to offload the WFC algorithm to a separate thread to 
    prevent the main thread from freezing. However, the worker was not able 
    to access the necessary classes and functions from the main thread, so 
    it was abandoned. The WFC algorithm is currently running on the main thread.
*/




self.onmessage = function (event) {
    // Run populateOutputGrid() with the data received from the main script
    const { outputIsGenerating, /* any other data the worker needs */ } = event.data;
    if (outputIsGenerating) {
        populateOutputGrid();
        // Send the updated outputGrid back to the main script
        self.postMessage(outputGrid);
    }
};




/** 2D Array. Contains cells that get collapsed into tiles */
let outputGrid = [];

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
