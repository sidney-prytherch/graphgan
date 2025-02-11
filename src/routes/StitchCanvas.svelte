<script lang="ts">
	import { onMount } from 'svelte';
	import { PixelGroup } from './PixelGroup.svelte';


    // colorToSelect:
        // 0 = average
        // 1 = closest
	let { width = 600, height = 600, colorToSelect = 1 } = $props();

	// let imageData: HTMLImageElement;
	let canvas: HTMLCanvasElement;
	let context: CanvasRenderingContext2D;
	let pixelGroups: PixelGroup[][];
	let imageWidth: number;
	let imageHeight: number;

	onMount(() => {
		context = canvas.getContext('2d') || new CanvasRenderingContext2D();
	});

	const redraw = () => {
		if (context && pixelGroups && pixelGroups.length > 0 && pixelGroups[0].length > 0 && imageHeight && imageWidth) {
			const rowCount = pixelGroups.length;
			const stitchCount = pixelGroups[0].length;
			const pixelsPerRow = (imageHeight / rowCount);
			const pixelsPerStitch = (imageWidth / stitchCount);
			console.log('pixelsPerRow', pixelsPerRow);
			console.log('pixelsPerStitch', pixelsPerStitch);

            context.strokeStyle = '#000000';
            clear()
            context.lineWidth = 1;

			for (let currentRow = 0; currentRow < rowCount; currentRow++) {
				let rowStartPixel = Math.floor(pixelsPerRow * currentRow);
				for (let currentStitch = 0; currentStitch < stitchCount; currentStitch++) {
					let stitchStartPixel = Math.floor(pixelsPerStitch * currentStitch);


                    if (colorToSelect === 0) {
                        context.fillStyle = pixelGroups[currentRow][currentStitch].averageColorAsHex;
                    } else {
                        context.fillStyle = pixelGroups[currentRow][currentStitch].closestColorAsHex;
                    }
					context.beginPath();
					context.rect(stitchStartPixel, rowStartPixel, Math.ceil(pixelsPerStitch), Math.ceil(pixelsPerRow));
					context.fill();
                    if (pixelGroups.length + pixelGroups[0].length < 110)
                        context.stroke();
				}
			}

		}
	};

    export const clear = () => {
        context.clearRect(0, 0, canvas.width, canvas.height);
    }

	export const setImage = (
		newPixelGroups: PixelGroup[][],
		newImageHeight: number,
		newImageWidth: number
	) => {
		pixelGroups = newPixelGroups;
		imageHeight = newImageHeight;
		imageWidth = newImageWidth;
		redraw();
	};

	const handleSize = () => {
		redraw();
	};
</script>

<svelte:window on:resize={handleSize} />

<canvas {width} {height} bind:this={canvas}> </canvas>

<style>
	canvas {
		width: 100%;
	}
</style>
