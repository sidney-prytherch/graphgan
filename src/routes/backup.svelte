<script lang="ts">
	import { CrochetImage } from './CrochetImage.svelte';
	import Canvas from './Canvas.svelte';
	// import Palette from './Palette.svelte';

	const colors = ['#d58141', '#d7c44c', '#4fa9cc', '#3f8d27'];
	const background = '#ffffff';

	// let color = $state(colors[0]);
	// let paletteColor = $state(colors[0]);

	let files: FileList | null | undefined = $state.raw();
	let image: string | null = $state.raw(null);
	let imageData: HTMLImageElement | null = $state.raw(null);
	let pixelData: ImageData | undefined = $state.raw();

	let getPixels = (data: ImageData) => {
		pixelData = data;
	};

	$effect(() => {
		if (files && files.length > 0) {
			let inputImage = files[0];
			let reader = new FileReader();
			reader.readAsDataURL(inputImage);
			reader.onload = (e) => {
				if (e.target && e.target.result && typeof e.target.result == 'string') {
					image = e.target.result;
					imageData = new Image();
					imageData.src = e.target.result;
					imageData.onload = () => {
						crochetImageData.imageHeight = imageData?.naturalHeight || crochetImageData.imageHeight;
						crochetImageData.imageWidth = imageData?.naturalWidth || crochetImageData.imageWidth;
					};
				}
			};
		}
	});

	// let stitchImageFiles: FileList | null | undefined = $state();
	// let stitchImage: string | null = $state(null);
	// let stitchImageData: HTMLImageElement | null = $state.raw(null);
	// $effect(() => {
	// 	if (stitchImageFiles && stitchImageFiles.length > 0) {
	// 		let inputImage = stitchImageFiles[0];
	// 		let reader = new FileReader();
	// 		reader.readAsDataURL(inputImage);
	// 		reader.onload = (e) => {
	// 			if (e.target && e.target.result && typeof e.target.result == 'string') {
	// 				stitchImage = e.target.result;
	// 				stitchImageData = new Image();
	// 				stitchImageData.src = e.target.result;
	// 			}
	// 		};
	// 	}
	// });

	let crochetImageData = new CrochetImage();
</script>

<main>
	<h1>Crochet Site</h1>

	<!-- <Canvas {color} {background} {stitchImageData} />
	<Palette
		paletteColor={color}
		{colors}
		{background}
		setColor={( detail: {color: string} ) => {
			color = detail.color;
		}}
	/> -->

	<!-- <label for="stitchInput">Upload a picture:</label>
	<input
		accept="image/png, image/jpeg"
		bind:files={stitchImageFiles}
		id="stitchInput"
		name="stitchInput"
		type="file"
	/> -->

	<label for="imageInput">Upload a picture:</label>
	<input accept="image/png, image/jpeg" bind:files id="imageInput" name="imageInput" type="file" />

	<Canvas {imageData} {getPixels} />

	<div>
		<label for="stitchCount">Update stitch count:</label>
		<input
			bind:value={crochetImageData.stitches}
			id="stitchCount"
			name="stitchCount"
			type="number"
		/>
	</div>

	<h2>Gauge</h2>

	<div>
		<label for="gaugeStitches">Update stitch count in gauge:</label>
		<input
			bind:value={crochetImageData.gaugeStitches}
			id="gaugeStitches"
			name="gaugeStitches"
			type="number"
		/>
	</div>

	<div>
		<label for="gaugeRows">Update row count in gauge:</label>
		<input bind:value={crochetImageData.gaugeRows} id="gaugeRows" name="gaugeRows" type="number" />
	</div>

	<div>
		<label for="gaugeWidth">Update width of gauge ({crochetImageData.gaugeUnits}):</label>
		<input
			bind:value={crochetImageData.gaugeWidth}
			id="gaugeWidth"
			name="gaugeWidth"
			type="number"
		/>
	</div>

	<div>
		<label for="gaugeHeight">Update height of gauge ({crochetImageData.gaugeUnits}):</label>
		<input
			bind:value={crochetImageData.guageHeight}
			id="gaugeHeight"
			name="gaugeHeight"
			type="number"
		/>
	</div>

	<button
		onclick={() => {
			crochetImageData.gaugeUnitsIsCm = !crochetImageData.gaugeUnitsIsCm;
		}}
	>
		{crochetImageData.gaugeUnitsIsCm ? 'Change Units to Inches' : 'Change Units to Centimeters'}
	</button>

	<div>
		<label for="imageWidth">Update image width:</label>
		<input
			bind:value={crochetImageData.imageWidth}
			id="imageWidth"
			name="imageWidth"
			type="number"
		/>
	</div>

	<div>
		<label for="imageHeight">Update image height:</label>
		<input
			bind:value={crochetImageData.imageHeight}
			id="imageHeight"
			name="imageHeight"
			type="number"
		/>
	</div>

	<br />

	{#if files}
		<h2>Selected file:</h2>
		{#each Array.from(files) as file}
			<p>{file.name} ({file.size} bytes)</p>
		{/each}
	{/if}

	<p>
		stitches: {crochetImageData.stitches}, rows: {crochetImageData.rows}
	</p>

	<p>
		Estimated size: width: {crochetImageData.estimatedWidth}
		{crochetImageData.gaugeUnits}, height: {crochetImageData.estimatedHeight}
		{crochetImageData.gaugeUnits}
	</p>

	<!-- <img id="inputImage" class="image" src={image} alt="d" /> -->
</main>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		min-height: 100vh;
		display: flex;
		justify-content: center;
		align-items: center;
		background: #e5e5e5;
	}

	:global(.visually-hidden:not(:focus):not(:active)) {
		clip: rect(0 0 0 0);
		clip-path: inset(50%);
		height: 1px;
		width: 1px;
		overflow: hidden;
		position: absolute;
		white-space: nowrap;
	}

	main {
		max-width: 800px;
		display: flex;
		flex-direction: column;
		gap: 0.5rem 0;
	}

	main :global(canvas) {
		align-self: center;
	}

	main div {
		justify-content: space-evenly;
		display: flex;
		flex-direction: row;
	}
</style>
