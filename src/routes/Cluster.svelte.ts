export class Cluster {
    id: number;
    pixelCount: number = 0;
    red: number;
    blue: number;
    green: number;
    reds: number = 0;
    blues: number = 0;
    greens: number = 0;

    constructor(id: number, color:{r: number, g: number, b:number}) {
        this.id = id;
        this.red = color.r;
        this.blue = color.b;
        this.green = color.g;
        this.addPixel(color)
    }

    clear() {
        this.red = 0;
        this.green = 0;
        this.blue = 0;
        this.reds = 0;
        this.greens = 0;
        this.blues = 0;
        this.pixelCount = 0;
    }

    getRGB() {
        let r = Math.round(this.reds / this.pixelCount);
        let g = Math.round(this.greens / this.pixelCount);
        let b = Math.round(this.blues / this.pixelCount);
        return {r, g, b};
    }

    addPixel(color:{r: number, g: number, b:number}) {
        this.reds += color.r;
        this.greens += color.g;
        this.blues += color.b;
        this.pixelCount++;
        this.red = Math.round(this.reds / this.pixelCount);
        this.green = Math.round(this.greens / this.pixelCount);
        this.blue = Math.round(this.blues / this.pixelCount);
    }

    removePixel(color:{r: number, g: number, b:number}) {
        this.reds -= color.r;
        this.greens -= color.g;
        this.blues -= color.b;
        this.pixelCount--;
        this.red = Math.round(this.reds / this.pixelCount);
        this.green = Math.round(this.greens / this.pixelCount);
        this.blue = Math.round(this.blues / this.pixelCount);
    }

    distance(color:{r: number, g: number, b:number}) {
        let rx = Math.abs(this.red - color.r);
        let gx = Math.abs(this.green - color.g);
        let bx = Math.abs(this.blue - color.b);
        let d = (rx + gx + bx) / 3;
        return d;
    }
}