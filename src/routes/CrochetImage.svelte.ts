import type { PixelGroup } from "./PixelGroup.svelte";

export class CrochetImage {
    gaugeRows = $state(10);
    gaugeStitches = $state(10);
    gaugeWidth = $state(4);
    guageHeight = $state(4);

    pixelData: ImageData | null = $state(null)
    imageWidth = $derived(this.pixelData ? this.pixelData.width : 1);
    imageHeight = $derived(this.pixelData ? this.pixelData.height : 1);

    projectStitches = $state(10);
    projectRows = $state(10);
    projectWidth = $state(4);
    projectHeight = $state(4);
    realProjectWidth = $state(4);
    realProjectHeight = $state(4);
    timeoutId: number | null = $state(null)

    // gauge = $derived(this.gaugeRows / this.gaugeStitches);
    // gaugeStitchWidth = $derived(this.gaugeWidth / this.gaugeStitches);
    // gaugeStitchHeight = $derived(this.guageHeight / this.gaugeRows);
    // imageSizeRatio = $derived(this.imageHeight / this.imageWidth)
    

    gaugeUnitsIsCm = $state(false)
    gaugeUnits = $derived(this.gaugeUnitsIsCm ? "Centimeters" : "Inches")
    pixelGroups: PixelGroup[] = [];
    colorCount = $state(2);
    colors = $state(["#444444", "#CCCCCC"]);

    
    setSizeFromReal() {
        this.projectHeight = this.realProjectHeight;
        this.projectWidth = this.realProjectWidth;
    };

    roundToTwo(input: number) {
        return Math.round((input + Number.EPSILON)* 100) / 100;
    }

    removeColorAtIndex = (index: number) => {
		this.colors.splice(index, 1);
		this.colorCount--;
	}

    /*
        ps = stitchCount
        pw = ps * (gw / gs)
        pr = round(pw * (ih/iw) * (gr/gh) )
        ph = pr * (gh / gr)
    */
    updateFromStitches(stitchCount: number) {
        this.projectStitches = stitchCount;
        this.projectWidth = this.roundToTwo(this.projectStitches * (this.gaugeWidth / this.gaugeStitches));
        this.projectRows = Math.round(this.projectWidth * (this.imageHeight / this.imageWidth) * (this.gaugeRows / this.guageHeight));
        this.projectHeight = this.roundToTwo(this.projectRows * (this.guageHeight / this.gaugeRows));
        this.realProjectHeight = this.projectHeight;
        this.realProjectWidth = this.projectWidth;
    }

    updateFromRows(rowCount: number) {
        this.projectRows = rowCount;
        this.projectHeight = this.roundToTwo(this.projectRows * (this.guageHeight / this.gaugeRows));
        this.projectStitches = Math.round(this.projectHeight * (this.imageWidth / this.imageHeight) * (this.gaugeStitches / this.gaugeWidth));
        this.projectWidth = this.roundToTwo(this.projectStitches * (this.gaugeWidth / this.gaugeStitches));
        this.realProjectHeight = this.projectHeight;
        this.realProjectWidth = this.projectWidth;
    }

    clearTimeout() {
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
        }
    }

    updateFromWidth(width: number) {
        this.clearTimeout()
        this.projectWidth = width;
        this.projectStitches = Math.round(this.projectWidth * (this.gaugeStitches / this.gaugeWidth));
        this.realProjectWidth = this.roundToTwo(this.projectStitches * (this.gaugeWidth / this.gaugeStitches));
        this.projectRows = Math.round(this.realProjectWidth * (this.imageHeight / this.imageWidth) * (this.gaugeRows / this.guageHeight));
        this.projectHeight = this.roundToTwo(this.projectRows * (this.guageHeight / this.gaugeRows));
        this.realProjectHeight = this.projectHeight;
        this.timeoutId = setTimeout(() => {this.setSizeFromReal()}, 2000);
    }

    updateFromHeight(height: number) {
        this.clearTimeout()
        this.projectHeight = height;
        this.projectRows = Math.round(this.projectHeight * (this.gaugeRows / this.guageHeight));
        this.realProjectHeight = this.roundToTwo(this.projectRows * (this.guageHeight / this.gaugeRows));
        this.projectStitches = Math.round(this.realProjectHeight * (this.imageWidth / this.imageHeight) * (this.gaugeStitches / this.gaugeWidth));
        this.projectWidth = this.roundToTwo(this.projectStitches * (this.gaugeWidth / this.gaugeStitches));
        this.realProjectWidth = this.projectWidth;
        this.timeoutId = setTimeout(() => {this.setSizeFromReal()}, 2000);
    }

    updateColor() {
        while (this.colorCount > this.colors.length) {
            this.colors.push("#888888");
        }
        while (this.colorCount < this.colors.length) {
            this.colors.pop();
        }
    }

    updatePixelData(pixelData: ImageData) {
        this.pixelData = pixelData
    }

}