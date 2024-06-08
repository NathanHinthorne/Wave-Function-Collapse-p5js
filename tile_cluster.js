/**
 * Tile clusters (composed of 3x3 tiles) have their own local constraints relative to other nearby tile clusters. 
 * This facilitates the formation of larger patterns in the output image.
 * One way to think of this is that it gives each cell the ability to "see" farther away than just its immediate neighbors before collapsing.
 * This fixes the issue where generated ground tiles don't leave room for player to move. For cave generation, this helps tunnels connect.
 */
class TileCluster {
    /**
     * @param {Tile[][]} tileComposition A 3x3 array of tiles
     */
    constructor(tileComposition) {
        this.tileComposition = tileComposition;

        const [dominateTileIndex, uniformityPercentage] = this.findDominantTileIndex();

        /** The index of the dominant tile in the cluster */
        this.dominantTileIndex = dominateTileIndex;

        /** The percentage of the cluster that is composed of the dominant tile */
        this.uniformityPercentage = uniformityPercentage;


        /** A Map where the keys are the indices of available clusters to appear above this one, and the values are their corresponding frequencies */
        this.up = new Map();

        /** A Map where the keys are the indices of available clusters to appear to the right of this one, and the values are their corresponding frequencies */
        this.right = new Map();

        /** A Map where the keys are the indices of available clusters to appear below this one, and the values are their corresponding frequencies */
        this.down = new Map();

        /** A Map where the keys are the indices of available clusters to appear to the left of this one, and the values are their corresponding frequencies */
        this.left = new Map();
    }

    /**
     * @returns {[number, number]} The index of the dominant tile in the cluster and the number of times it appears in the order [index, count]
     */
    findDominantTileIndex() {
        const counts = [] // Array of 0s

        for (const row of this.tileComposition) {
            for (const tile of row) {

                if (tile !== null) {
                    if (counts[tile.index] === undefined) {
                        counts[tile.index] = 0;
                    }

                    counts[tile.index]++;
                }
            }
        }

        const highestCount = Math.max(...counts);
        const dominantTileIndex = counts.indexOf(highestCount);

        const numTiles = this.tileComposition.length * this.tileComposition[0].length;
        const uniformityPercentage = Math.ceil(highestCount / numTiles);

        return [dominantTileIndex, uniformityPercentage];
    }

    /**
     * Checks the uniformity percentage. If it's above a certain threshold, 
     * it will be trusted as an accurate measurement of the cluster's composition.
     * 
     * Clusters should be thrown out if they are not solid.
     * 
     * @param {number} threshold The minimum uniformity percentage threshold for the cluster to be considered solid
     * @returns {boolean} Whether or not the cluster is solid
     */
    isSolid(threshold = 0.6) {
        return this.uniformityPercentage >= threshold;
    }
}