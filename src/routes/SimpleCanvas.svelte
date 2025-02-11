<script lang="ts">
	import { onMount } from 'svelte';

	let { pixelData2D } = $props();

	// let imageData: HTMLImageElement;
	let canvas: HTMLCanvasElement;
	let context: CanvasRenderingContext2D;

    let height = $derived(pixelData2D.length)
    let width = $derived(pixelData2D[0].length)

	onMount(() => {
		context = canvas.getContext('2d') || new CanvasRenderingContext2D();
	});

	const redraw = () => {
        context.clearRect(0, 0, canvas.width, canvas.height);
		if (context && pixelData2D) {
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    context.fillStyle = pixelData2D[y][x];
					context.beginPath();
					context.rect(x, y, 1, 1);
					context.fill();
                }
            }
		}
	};

	export const updateImage = (newPixelData2D: string[][]) => {
		pixelData2D = newPixelData2D;
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