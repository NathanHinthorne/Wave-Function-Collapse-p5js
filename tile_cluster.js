/**
 * Tile clusters (composed of 2x2 tiles) have their own local constraints relative to other nearby tile clusters. 
 * This facilitates the formation of larger patterns in the output image.
 * One way to think of this is that it gives each cell the ability to "see" farther away than just its immediate neighbors before collapsing.
 * This fixes the issue where generated ground tiles don't leave room for player to move. For cave generation, this helps tunnels connect.
 */
class TileCluster {
    /**
     * @param {Tile} topLeft The top left tile of the cluster
     * @param {Tile} topRight The top right tile of the cluster
     * @param {Tile} bottomLeft The bottom left tile of the cluster
     * @param {Tile} bottomRight The bottom right tile of the cluster
     */
    constructor(topLeft, topRight, bottomLeft, bottomRight) {
        this.topLeft = topLeft;
        this.topRight = topRight;
        this.bottomLeft = bottomLeft;
        this.bottomRight = bottomRight;

        const [dominateTileIndex, uniformityPercentage] = this.findDominantTileIndex();

        /** The index of the dominant tile in the cluster */
        this.dominantTileIndex = dominateTileIndex;

        /** The percentage of the cluster that is composed of the dominant tile */
        this.uniformityPercentage = uniformityPercentage;
    }

    /**
     * @returns {[Tile, Tile, Tile, Tile]} The tiles in the cluster in the order [topLeft, topRight, bottomLeft, bottomRight]
     */
    getComposition() {
        return [this.topLeft, this.topRight, this.bottomLeft, this.bottomRight];
    }

    /**
     * @returns {[number, number]} The index of the dominant tile in the cluster and the number of times it appears in the order [index, count]
     */
    findDominantTileIndex() {
        const tiles = this.getComposition();
        const counts = [] // Array of 0s

        for (const tile of tiles) {
            if (tile !== null) {
                if (counts[tile.index] === undefined) {
                    counts[tile.index] = 0;
                }

                counts[tile.index]++;
            }
        }

        const highestCount = Math.max(...counts);
        const dominantTileIndex = counts.indexOf(highestCount);

        const uniformityPercentage = Math.ceil(highestCount / tiles.length);

        return [dominantTileIndex, uniformityPercentage];
    }

    /**
     * Checks the uniformity percentage. If it's above a certain threshold, 
     * it will be trusted as an accurate measurement of the cluster's composition.
     * 
     * @returns {boolean} Whether or not the cluster is solid (75% uniformity between tiles)
     */
    isSolid() {
        return this.uniformityPercentage >= 0.75;
    }
}