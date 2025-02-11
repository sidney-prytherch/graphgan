<script lang="ts">
	import { onMount } from 'svelte';

	let {
		width = 600,
		height = 600,
		color = '#333',
		nodraw = true,
		background = '#fff',
		imageData,
		getPixels
	} = $props();

	let canvas: HTMLCanvasElement;
	let context: CanvasRenderingContext2D;
	let isDrawing: boolean;
	let start: { x: any; y: any };

    $inspect(imageData)

	let t: number, l: number;

	onMount(() => {
		context = canvas.getContext('2d') || new CanvasRenderingContext2D();
		context.lineWidth = 3;

		handleSize();
	});
    
	$effect(() => {
        if (context && imageData && imageData.width > 0) {
			height = (width / imageData.width) * imageData.height;
            context.drawImage(imageData, 0, 0, imageData.width, imageData.height, 0, 0, width, height);
			getPixels(context.getImageData(0, 0, width, height));
		}
	});

	const handleStart = ({ offsetX: x, offsetY: y }: { offsetX: number; offsetY: number }) => {
		if (!nodraw) {
			if (color === background) {
				context.clearRect(0, 0, width, height);
			} else {
				isDrawing = true;
				start = { x, y };
			}
		}
	};

	const handleEnd = () => {
		isDrawing = false;
	};
	const handleMove = ({ offsetX: x1, offsetY: y1 }: { offsetX: number; offsetY: number }) => {
		if (!isDrawing) return;

		const { x, y } = start;
		context.beginPath();
		context.moveTo(x, y);
		context.lineTo(x1, y1);
		context.closePath();
		context.stroke();

		start = { x: x1, y: y1 };
	};

	const handleSize = () => {
		const { top, left } = canvas.getBoundingClientRect();
		t = top;
		l = left;
	};
</script>

<svelte:window on:resize={handleSize} />

<canvas
	{width}
	{height}
	style:background
	bind:this={canvas}
	onmousedown={handleStart}
	ontouchstart={(e) => {
		const { clientX, clientY } = e.touches[0];
		handleStart({
			offsetX: clientX - l,
			offsetY: clientY - t
		});
	}}
	onmouseup={handleEnd}
	ontouchend={handleEnd}
	onmouseleave={handleEnd}
	onmousemove={handleMove}
	ontouchmove={(e) => {
		const { clientX, clientY } = e.touches[0];
		handleMove({
			offsetX: clientX - l,
			offsetY: clientY - t
		});
	}}
>
</canvas>
