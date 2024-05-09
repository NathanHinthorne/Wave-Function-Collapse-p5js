# Wave Function Collapse

## Description

This is a JavaScript implementation of the Wave Function Collapse (WFC) algorithm. The algorithm is used to generate terrain based on patterns from an input image.

The algorithm works in the following way:

1. Takes in an input image and breaks it down into tiles.

2. Analyzes how the tiles are placed in relation to each other and creates a list of **adjacency rules** and **frequency hints**.

    a. **Adjacency rules** describe which tiles may appear next to other tiles in each cardinal direction (the possible neighboring tiles).

    b. **Frequency hints** are a mapping from each tile to a number indicating how frequently the tile should appear in the output, relative to other tiles.

3. Creates a grid of cells for the output.

4. Populates the grid by collapsing cells into tiles in a way which *completely* respects **adjacency rules**, and *probabilistically* respects **frequency hints**.

    a. The propagation of tiles is done by choosing the cell with the lowest entropy (the cell with the fewest possible neighbors), then collapsing it into a tile. This process is repeated until the grid is filled.

## Plans

- [ ] Parse input image to collect unique tiles
- [ ] Create adjacency rules from connected tiles
- [ ] Create frequency hints from connected tiles
- [ ] Let frequency hints play a role in tile selection
- [ ] Create a simple GUI for the user to adjust algorithm parameters

## How to use

Visit the [live demo](https://nathanhinthorne.github.io/Wave-Function-Collapse/) to see the algorithm in action.

## Acknowledgements

Daniel Shiffman's implementation of WFC was used as a reference for this project. His implementation can be found [here](https://github.com/CodingTrain/Wave-Function-Collapse).
