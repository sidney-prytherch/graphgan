<script lang="ts">
	import { onMount } from 'svelte';

	let { width = 600, height = 600, imageData, getPixels } = $props();

	// let imageData: HTMLImageElement;
	let canvas: HTMLCanvasElement;
	let context: CanvasRenderingContext2D;

	onMount(() => {
		context = canvas.getContext('2d') || new CanvasRenderingContext2D();
	});

	const redraw = () => {
		if (context && imageData && imageData.width > 0) {
			const scale = Math.min(width / imageData.width, height / imageData.height);
			const scaledWidth = imageData.width * scale;
			const scaledHeight = imageData.height * scale;

			context.clearRect(0, 0, canvas.width, canvas.height);
			context.drawImage(imageData, 0, 0, scaledWidth, scaledHeight);
			getPixels(context.getImageData(0, 0, scaledWidth, scaledHeight));
		}
	};

	export const updateImage = (newImage: HTMLImageElement) => {
		imageData = newImage;
		redraw();
	}

	// $effect(() => {
	// 	redraw();
	// });

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