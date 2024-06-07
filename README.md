# Wave Function Collapse

## Description

This is a JavaScript implementation of the Wave Function Collapse (WFC) algorithm. The algorithm is used to generate terrain based on patterns identified from a single input image.

## Purpose

Ultimately, my hope for this project is that it would facilitate easy map creation for game devs, where they wouldn't need to spend time hardcoding tile connection rules, and can simply supply an input image that fits their expectations. Further, the **tile rules** themselves could be exported and used for proceedurally generated maps.

Here are some more specific ideas that support the statement above:

- A open-world 2D game (like Terraria, but with very different terrain) that is procedurally generated using WFC (off screen, so players can't see world being made).
  - An input image would be run through this WFC demo. This would provide tile rules for a form of WFC built within the game.
  - World would be generated in chunks, with a "stitching" algorithm that ensures chunks connect properly. This would avoid restarts caused by backtracking and would provide the opportunity to run WFC in parallel.
  - WFC would be used to generate the **basic terrain**, but another algorithm with simple randomization could add **variation** by swapping these out with appropriate tile variations. This technique would be used for things like trees, rocks, or other decorations that are placed on the terrain.
  
- A game mechanic where the world is created slowly as you progress and in clear view of the player. The player can influence WHICH cells collapse.

## Algorithm

The algorithm works in the following way:

1. Takes in an input image and breaks it down into tiles.

2. Identifies the unique tiles, known as **tile variants** and gives each tile variant a unique ID.

3. Analyzes how the tiles are placed in relation to each other, creating a list of **adjacency rules** and **frequency hints**.

    a. **Adjacency rules** describe which tiles may appear next to other tiles in each cardinal direction (the possible neighboring tiles).

    b. **Frequency hints** are a mapping from each tile to a number indicating how frequently the tile should appear in the output, relative to other tiles.

4. Creates a grid of cells for the output.

5. Populates the grid by collapsing cells into tiles in a way which *completely* respects **adjacency rules**, and *probabilistically* respects **frequency hints**.

    a. The propagation of tiles is done by choosing the cell with the lowest entropy (the cell with the fewest tile options), then collapsing it into a single tile. This process is repeated until the grid is filled.

For a more detailed explanation how the algorithm works, you may read [this paper I wrote on the subject.](https://drive.google.com/file/d/1-WoEQ621dulmirr-kJOZsOoEZSxZ8T0e/view?usp=sharing)

## Plans

- Finish a basic implementation of WFC:
  - [x] Parse input image to collect unique tiles
  - [x] Create adjacency rules from connected tiles
  - [x] Create frequency hints from connected tiles
  - [x] Let adjacency rules play a role in tile selection
  - [x] Let frequency hints play a role in tile selection
  - [x] Create a simple GUI for the user to adjust algorithm parameters

- Tweak algorithm propagation rules to achieve better output:
  - [x] For edge tiles analyzed in the input grid, because some of their neighbors don't exist, let the **most common** tile found in the input grid be the only tile that can be placed next to the edge tile. Best case scenario, the most common tile is "air" or "empty" so it will probably fit well.
  - [x] Implement a "backtracking" feature that allows the algorithm to backtrack and try a different tile if it gets stuck (i.e. no tiles can be placed in a cell). Utilize use a stack of previous states to accomplish this.
  - [x] Implement Shannon Entropy as a more accurate form of entropy. Shannon Entropy accounts for weighted probabilities of tiles.
  - [ ] Have **tile clusters** (composed of 2x2 tiles) which have their own local constraints relative to other nearby tile clusters. This would allow for input image patterns to be followed more closely. Among other benefits, this would fix the issue where blocks are placed too close together in the output.
  - [x] Since this version of WFC is geared towards terrain generation, it's probably okay to add some global contraints in addition to the local constraints that already exist between tile variants. Therefore, let the user specify a **behavior** for any tile variant they choose (e.g. "floor" and "empty"). Ensure these categories have global constraints that must be followed. For example:
    - **floor** tiles must be connected to the bottom row of the output.
    - **empty** tiles are artifically added as neighbors to the edge tiles.

- Perform analysis on different implementations of WFC to see how they affect the output:
  - [x] Setup a way to gather appropriate data for different implementations, like operation counts or running time, and plot these results in an appropriate way (e.g. a line graph).
  - [x] Test Shannon entropy vs rough entropy (entropy that's not weighted by tile frequency)

- [ ] Design a web API which takes an input image as a request and gives an output image as its response.

- [x] Create a button to export the tile connection rules so they can be used in a game engine.
  
## How to use

Visit the [live demo](https://nathanhinthorne.github.io/Wave-Function-Collapse/) to see the algorithm in action and generate your own images!

:warning: Keep in mind that if you want the algorithm to pick up patterns between tiles, ensure you have some **duplicate tiles** in the image (i.e. tiles composed of the exact same pixels).

Also, please be aware that your input image size might be too small for the algorithm to generate realistic terrain. With a larger sample size, the algorithm produces better tile connection rules, which results in output images that are closer to your expectations.

## Acknowledgements

The original Wave Function Collapse algorithm was created by Maxim Gumin. His GitHub repository can be found [here](https://github.com/mxgmn/WaveFunctionCollapse).
