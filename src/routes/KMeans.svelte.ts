import { Cluster } from "./Cluster.svelte";

type Color = { r: number, g: number, b: number };

export class KMeans {
    private static MODE_CONTINUOUS = 1;
    private static MODE_ITERATIVE = 2;
    pixels2D: Color[][] = [];


    clusterCount: number = 3;
    clusters: Cluster[] = [];
    pixelsClustered: Color[][] = [];
    mode = KMeans.MODE_CONTINUOUS;


    getStringColors() {
        console.log(this.pixelsClustered)
        return this.pixelsClustered.map(row => row.map(color => this.rgbToHex(color)))
    }

    rgbToHex(color: Color) {
        let red = color.r.toString(16).padStart(2, '0');
        let green = color.g.toString(16).padStart(2, '0');
        let blue = color.b.toString(16).padStart(2, '0');

        return '#' + red + green + blue;
    }

    hexToRgb(hex: string) {
        hex = hex.replace("#", "");
        if (hex.length === 3) {
            hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
        }

        return {
            r: parseInt(hex.substring(0, 2), 16),
            g: parseInt(hex.substring(2, 4), 16),
            b: parseInt(hex.substring(4, 6), 16)
        }
    }

    calculateKMeansClusters() {
        let w = this.pixels2D[0].length;
        let h = this.pixels2D.length;

        console.log("h", h)
        console.log("w", w)

        this.clusters = this.createClusters();
        let lookupTable: number[] = new Array(w * h).fill(-1);

        let pixelChangedCluster = true;
        let loops = 0;

        while (pixelChangedCluster) {
            pixelChangedCluster = false;
            loops++;
            for (let y = 0; y < h; y++) {
                for (let x = 0; x < w; x++) {
                    let pixel = this.pixels2D[y][x];
                    let cluster = this.findMinimalCluster(pixel);
                    if (lookupTable[w * y + x] != cluster.id) {
                        // cluster changed
                        if (this.mode == KMeans.MODE_CONTINUOUS) {
                            if (lookupTable[w * y + x] != -1) {
                                // remove from possible previous
                                // cluster
                                this.clusters[lookupTable[w * y + x]].removePixel(
                                    pixel);
                            }
                            // add pixel to cluster
                            cluster.addPixel(pixel);
                        }
                        // continue looping
                        pixelChangedCluster = true;

                        // update lut
                        lookupTable[w * y + x] = cluster.id;
                    }
                }
            }
            if (this.mode == KMeans.MODE_ITERATIVE) {
                // update clusters
                for (let i = 0; i < this.clusters.length; i++) {
                    this.clusters[i].clear();
                }
                for (let y = 0; y < h; y++) {
                    for (let x = 0; x < w; x++) {
                        let clusterId = lookupTable[w * y + x];
                        // add pixels to cluster
                        this.clusters[clusterId].addPixel(this.pixels2D[y][x]);
                    }
                }
            }

            this.pixelsClustered = this.deepClone2DArray(this.pixels2D);
            for (let y = 0; y < h; y++) {
                for (let x = 0; x < w; x++) {
                    let clusterId = lookupTable[w * y + x];
                    this.pixelsClustered[y][x] = this.clusters[clusterId].getRGB();
                }
            }
        }
    }

    createClusters(): Cluster[] {
        // Here the clusters are taken with specific steps,
        // so the result looks always same with same image.
        // You can randomize the cluster centers, if you like.
        let result: Cluster[] = [];
        let w = this.pixels2D[0].length;
        let h = this.pixels2D.length;
        let x = 0;
        let y = 0;
        let dx = Math.floor(w / this.clusterCount);
        let dy = Math.floor(h / this.clusterCount);
        for (let i = 0; i < this.clusterCount; i++) {
            result[i] = new Cluster(i, this.pixels2D[y][x]);
            x += dx;
            y += dy;
        }
        return result;
    }

    findMinimalCluster(color: Color): Cluster {
        let cluster: Cluster | null = null;
        let min = Number.MAX_SAFE_INTEGER;
        for (let i = 0; i < this.clusters.length; i++) {
            let distance = this.clusters[i].distance(color);
            if (distance < min) {
                min = distance;
                cluster = this.clusters[i];
            }
        }
        return cluster ? cluster : this.clusters[0];
    }

    deepClone2DArray(arr: Color[][]) {
        return arr.map(row => row.map(obj => ({ ...obj })));
    }
}