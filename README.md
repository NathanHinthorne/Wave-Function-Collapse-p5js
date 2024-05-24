# Wave Function Collapse

## Description

This is a JavaScript implementation of the Wave Function Collapse (WFC) algorithm. The algorithm is used to generate terrain based on patterns identified from a single input image.

The algorithm works in the following way:

1. Takes in an input image and breaks it down into tiles.

2. Identifies the unique tiles, known as **tile variants** and gives each tile variant a unique ID.

3. Analyzes how the tiles are placed in relation to each other, creating a list of **adjacency rules** and **frequency hints**.

    a. **Adjacency rules** describe which tiles may appear next to other tiles in each cardinal direction (the possible neighboring tiles).

    b. **Frequency hints** are a mapping from each tile to a number indicating how frequently the tile should appear in the output, relative to other tiles.

4. Creates a grid of cells for the output.

5. Populates the grid by collapsing cells into tiles in a way which *completely* respects **adjacency rules**, and *probabilistically* respects **frequency hints**.

    a. The propagation of tiles is done by choosing the cell with the lowest entropy (the cell with the fewest tile options), then collapsing it into a single tile. This process is repeated until the grid is filled.

For a more detailed explanation how the algorithm works and how it produces the desired results, see the [paper](https://nothinHereYet) I wrote on the subject.

## Plans

NOTE: Anything preceeded by "???" is a feature that I'm not sure if I want to implement yet. I'm still thinking about it.

- Finish a basic, custom implementation of WFC:
  - [x] Parse input image to collect unique tiles
  - [x] Create adjacency rules from connected tiles
  - [x] Create frequency hints from connected tiles
  - [x] Let adjacency rules play a role in tile selection
  - [x] Let frequency hints play a role in tile selection
  - [x] Create a simple GUI for the user to adjust algorithm parameters

- Perform analysis on different implementations of WFC to see how they affect the output:
  - [ ] Setup a way to gather appropriate data for different implementations, like operation counts or running time, and plot these results in an appropriate way (e.g. a line graph).
  - [ ] Test frequency hints vs no frequency hints.
  - [ ] Test memoization for entropies vs re-calculation of all entropies.

- Tweak algorithm propagation rules to achieve better output:
  - [x] For edge tiles analyzed in the input grid, because some of their neighbors don't exist, let the **most common** tile found in the input grid be the only tile that can be placed next to the edge tile. Best case scenario, the most common tile is "air" or "empty" so it will probably fit well.
  - [x] Implement a "backtracking" feature that allows the algorithm to backtrack and try a different tile if it gets stuck (i.e. no tiles can be placed in a cell). Utilize use a stack of previous states to accomplish this.
  - [ ] Implement Shannon Entropy as a more accurate form of entropy. Shannon Entropy accounts for weighted probabilities of tiles.
  - [ ] As an *optional* form of tile generation, geared more towards terrain for 2D platformers, have some **pre-collapsed** tiles around the border (specifically thinking of a layer of ground tiles). This would fix issue where ground tiles can be connected to air beneath.
  - [ ] Have "tile clusters" (composed of 2x2 tiles) which have their own frequency hints and adjacency rules. This would allow for input image patterns to be followed closer. One benefit is that this would fix the issue where blocks are placed too close together in the output.
- [ ] ??? Allow the user to upload the tile variant images in *addition* to the input image. The file names from the tile variant images will be used to determine the tile type, which can be used in an exported tilemap for easier use in game development

consider a game mechanic where the user can influence WHEN and WHICH cells collapse.

my end goal for this project is to allow for easy creation of tile connections rules where you don't need to hardcode anything. Those rules could be exported and be used for proceedurally generated levels in games.


## How to use

Visit the [live demo](https://nathanhinthorne.github.io/Wave-Function-Collapse/) to see the algorithm in action and generate your own images!

## Acknowledgements

The original Wave Function Collapse algorithm was created by Maxim Gumin. His GitHub repository can be found [here](https://github.com/mxgmn/WaveFunctionCollapse).

Daniel Shiffman's implementation of WFC was used as a reference for this project. His implementation can be found [here](https://github.com/CodingTrain/Wave-Function-Collapse).
