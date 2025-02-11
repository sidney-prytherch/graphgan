type Color = { r: number, g: number, b: number };

export class PixelGroup {
    pixels: Color[] = [];
    averagePixelColor: Color = { r: 0, g: 0, b: 0 }
    averageColorAsHex: string = "#000000"

    targetColorsAsHex: string[] = [];
    targetColors: Color[] = [];
    targetColorsProximity: number[] = [];
    closestColorAsHex: string = "#000000";

    calculateAverageColor() {
        let pixelColorSums = this.pixels.reduce(((colorSums, currentPixel) => {
            return {
                r: colorSums.r + currentPixel.r,
                g: colorSums.g + currentPixel.g,
                b: colorSums.b + currentPixel.b
            }
        }),
            { r: 0, g: 0, b: 0 });
        this.averagePixelColor = {
            r: Math.round((pixelColorSums.r) / this.pixels.length),
            g: Math.round((pixelColorSums.g) / this.pixels.length),
            b: Math.round((pixelColorSums.b) / this.pixels.length)
        }
        this.averageColorAsHex = this.rgbToHex(this.averagePixelColor)
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

    getColorProximity(color1: Color, color2: Color) {
        return Math.sqrt(
            Math.pow(color1.r - color2.r, 2) +
            Math.pow(color1.g - color2.g, 2) +
            Math.pow(color1.b - color2.b, 2));
    }

    setColors(colors: string[]) {
        this.targetColorsAsHex = colors.map(it => it);
        this.targetColors = this.targetColorsAsHex.map(hexColor => this.hexToRgb(hexColor));
    }

    distance(color1:{r: number, g: number, b:number}, color2:{r: number, g: number, b:number} ) {
        let rx = Math.abs(color1.r - color2.r);
        let gx = Math.abs(color1.g - color2.g);
        let bx = Math.abs(color1.b - color2.b);
        let d = (rx + gx + bx) / 3;
        return d;
    }

    calculateTargetColorProximities() {
        this.targetColorsProximity = this.targetColors.map(targetColor => {
            let colorProximities = this.pixels.map(pixelColor => this.distance(pixelColor, targetColor))
            let colorProximitySum = colorProximities.reduce((proximitySum, currentProximity) => proximitySum + currentProximity, 0)
            return colorProximitySum / this.pixels.length;
        });

        let closestColorIndex = this.targetColorsProximity.reduce((closestIndex, currentProximity, currentIndex) =>
            this.targetColorsProximity[closestIndex] > currentProximity ? currentIndex : closestIndex
            , 0)

        this.closestColorAsHex = this.targetColorsAsHex[closestColorIndex]

    }
}