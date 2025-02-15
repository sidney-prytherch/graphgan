<script lang="ts">
	import Canvas from './Canvas.svelte';
	import Icon from '@iconify/svelte';
	import StitchCanvas from './StitchCanvas.svelte';
	import { CrochetImage } from './CrochetImage.svelte';
	import DropdownComponent from './DropdownComponent.svelte';
	import { PixelGroup } from './PixelGroup.svelte';
	import { KMeans } from './KMeans.svelte';
	import SimpleCanvas from './SimpleCanvas.svelte';

	let mainColor = $state('#008B8B');
	let contrastingColor = $state('#dedbaf');

	let canvas: Canvas;
	let smallCanvas: Canvas;
	let smallestCanvas: Canvas;
	let stitchCanvas: StitchCanvas;
	let averageColorCanvas: StitchCanvas;
	let kMeansCanvas: SimpleCanvas;
	let files: FileList | null | undefined = $state();
	let image: string | null = $state(null);
	let imageData: HTMLImageElement | null = $state.raw(null);
	// let showOriginalImage: boolean = $state(false)
	let page = $state(0);
	const canvasViewOptions = ['stitches', 'averages', 'original', 'kMeans'];
	let canvasView = $state(0); // index of canvasViewOptions
	const sizeOptions = ['stitch count', 'row count', 'width', 'height'];
	let sizeOptionSelection = $state(sizeOptions[0]);
	const lastPage = 2;
	const firstPage = 0;

	let kMeansColorCount: number = $state(2);
	let pixelGroups: PixelGroup[][] | null = $state(null);
	let pixelData: ImageData | undefined = $state();
	let smallPixelData: ImageData | undefined = $state();
	let smallestPixelData: ImageData | undefined = $state();
	let kMeansPixels: string[][] = $state([[]]);
	let crochetImageData = $state(new CrochetImage());

	const getPixels = (data: ImageData) => {
		pixelData = data;
		crochetImageData.updatePixelData(pixelData);
	};

	const getSmallPixels = (data: ImageData) => {
		smallPixelData = data;
	};

	const getSmallestPixels = (data: ImageData) => {
		smallestPixelData = data;
	};

	const nextPage = () => {
		page = Math.min(page + 2, lastPage);
	};

	const previousPage = () => {
		page = Math.max(page - 2, firstPage);
	};

	const updateEstimation = () => {
		if (sizeOptionSelection === sizeOptions[0]) {
			crochetImageData.updateFromStitches(crochetImageData.projectStitches);
		} else {
			crochetImageData.updateFromRows(crochetImageData.projectRows);
		}
	};

	const automaticRedraw = () => {
		createPixelGroups();
	};

	const updateColorValue = (hex: string, percent: number) => {
		hex = hex.replace('#', '');

		const num = parseInt(hex, 16);

		const amt = Math.floor(255 * percent);

		const R = (num >> 16) + amt;
		const B = ((num >> 8) & 0x00ff) + amt;
		const G = (num & 0x0000ff) + amt;

		const newR = Math.max(Math.min(255, R), 0).toString(16).padStart(2, '0');
		const newB = Math.max(Math.min(255, B), 0).toString(16).padStart(2, '0');
		const newG = Math.max(Math.min(255, G), 0).toString(16).padStart(2, '0');

		return `#${newR}${newB}${newG}`;
	};

	const getContrastingColor = (hex: string) => {
		hex = hex.replace('#', '');

		const num = parseInt(hex, 16);

		const R = 255 - (num >> 16);
		const B = 255 - ((num >> 8) & 0x00ff);
		const G = 255 - (num & 0x0000ff);

		// if the value is relatively light, make it lighter for even more contrast - if dark, darken
		const valueContrast = 50 * (((R + G + B) / 3 > 255 / 2) ? 1 : -1);

		console.log({valueContrast})

		const newR = Math.max(Math.min(255, R + valueContrast), 0).toString(16).padStart(2, '0');
		const newB = Math.max(Math.min(255, B + valueContrast), 0).toString(16).padStart(2, '0');
		const newG = Math.max(Math.min(255, G + valueContrast), 0).toString(16).padStart(2, '0');

		return `#${newR}${newB}${newG}`;
	};

	const createKMeansPixelGroup = (tempPixelData?: ImageData) => {
		let pixels = tempPixelData ? tempPixelData : smallPixelData;
		if (!smallPixelData || !pixels) {
			return null;
		}

		let pixels2D = [];

		crochetImageData.colors = new Array(kMeansColorCount).fill('#000000');
		crochetImageData.colorCount = crochetImageData.colors.length;
		crochetImageData.updateColor();
		createPixelGroups();

		let kMeans = new KMeans();
		for (let currentPixelRow = 0; currentPixelRow < pixels.height; currentPixelRow++) {
			let row = [];
			for (let currentPixel = 0; currentPixel < pixels.width; currentPixel++) {
				let pixelIndex = pixels.width * 4 * currentPixelRow + 4 * currentPixel;
				row.push({
					r: pixels.data[pixelIndex],
					g: pixels.data[pixelIndex + 1],
					b: pixels.data[pixelIndex + 2]
				});
			}
			pixels2D.push(row);
		}
		kMeans.clusterCount = crochetImageData.colors.length;
		kMeans.pixels2D = pixels2D;
		kMeans.calculateKMeansClusters();
		kMeansPixels = kMeans.getStringColors();
		crochetImageData.colors = kMeans.clusters.map((cluster) => kMeans.rgbToHex(cluster.getRGB()));
		createPixelGroups();
		kMeansCanvas.updateImage(kMeansPixels);
	};

	const createPixelGroups = () => {
		if (!pixelData) {
			return null;
		}

		const pixelsPerRow = pixelData.height / crochetImageData.projectRows;
		const pixelsPerStitch = pixelData.width / crochetImageData.projectStitches;

		let pixelRows: PixelGroup[][] = [];
		for (let currentRow = 0; currentRow < crochetImageData.projectRows; currentRow++) {
			let pixelRow: PixelGroup[] = [];
			let rowStartPixel = Math.floor(pixelsPerRow * currentRow);
			let rowEndPixel = Math.floor(pixelsPerRow * (currentRow + 1)) - 1;
			for (
				let currentStitch = 0;
				currentStitch < crochetImageData.projectStitches;
				currentStitch++
			) {
				let stitchStartPixel = Math.floor(pixelsPerStitch * currentStitch);
				let stitchEndPixel = Math.floor(pixelsPerStitch * (currentStitch + 1)) - 1;
				let pixelGroup = new PixelGroup();
				for (
					let currentPixelRow = rowStartPixel;
					currentPixelRow < rowEndPixel;
					currentPixelRow++
				) {
					for (let currentPixel = stitchStartPixel; currentPixel < stitchEndPixel; currentPixel++) {
						let pixelIndex = pixelData.width * 4 * currentPixelRow + 4 * currentPixel;
						pixelGroup.pixels.push({
							r: pixelData.data[pixelIndex],
							g: pixelData.data[pixelIndex + 1],
							b: pixelData.data[pixelIndex + 2]
						});
					}
				}
				pixelRow.push(pixelGroup);
				pixelGroup.calculateAverageColor();
				pixelGroup.setColors(crochetImageData.colors);
				pixelGroup.calculateTargetColorProximities();
			}
			pixelRows.push(pixelRow);
		}
		pixelGroups = pixelRows;
		stitchCanvas.setImage(pixelGroups, pixelData.height, pixelData.width);
		averageColorCanvas.setImage(pixelGroups, pixelData.height, pixelData.width);
	};

	const handleFileInput = () => {
		if (files && files.length > 0) {
			let inputImage = files[0];
			let reader = new FileReader();
			reader.readAsDataURL(inputImage);
			reader.onload = (e) => {
				if (e.target && e.target.result && typeof e.target.result == 'string') {
					image = e.target.result;
					let newImageData = new Image();
					newImageData.src = e.target.result;
					newImageData.onload = () => {
						imageData = newImageData;
						stitchCanvas.clear();
						averageColorCanvas.clear();
						canvas.updateImage(imageData);
						smallCanvas.updateImage(imageData);
						smallestCanvas.updateImage(imageData);
						createKMeansPixelGroup(smallestPixelData);
						mainColor = crochetImageData.colors[0];
					};
				}
			};
		}
	};
</script>

<main
	style="--mainColor: {mainColor}; --contrastingColor: {getContrastingColor(
		mainColor
	)}; --darkerColor: {updateColorValue(mainColor, -0.3)}; --lighterColor: {updateColorValue(
		mainColor,
		0.3
	)}; --darkestColor: {updateColorValue(mainColor, -0.8)};"
>
	<h1>Crochet Site</h1>

	<div class="rowflex">
		<div class="pagebutton">
			<button onclick={previousPage} class="iconButton"
				><Icon icon="ion:arrow-back-circle-outline" width="48" height="48" /></button
			>
		</div>
		<div class="optionsandimage">
			<div class="options">
				<div class:invisible={page !== 0}>
					<label for="imageInput">Upload a picture:</label>
					<input
						onchange={handleFileInput}
						accept="image/png, image/jpeg"
						bind:files
						id="imageInput"
						name="imageInput"
						type="file"
					/>
				</div>

				<!-- <div class:invisible={page !== 1}>
					<label for="imageInput">This page is a work in progress</label>
					<p>Sorry!</p>
				</div> -->

				<div class="colflex" class:invisible={page !== 2}>
					<DropdownComponent name="Gauge Settings">
						{#snippet dropDownContent()}
							<div>
								<label for="gaugeStitches">Update stitch count in gauge:</label>
								<input
									bind:value={crochetImageData.gaugeStitches}
									onchange={() => {
										updateEstimation();
										automaticRedraw();
									}}
									id="gaugeStitches"
									name="gaugeStitches"
									type="number"
								/>
							</div>

							<div>
								<label for="gaugeRows">Update row count in gauge:</label>
								<input
									bind:value={crochetImageData.gaugeRows}
									onchange={() => {
										updateEstimation();
										automaticRedraw();
									}}
									id="gaugeRows"
									name="gaugeRows"
									type="number"
								/>
							</div>

							<div>
								<label for="gaugeWidth"
									>Update width of gauge ({crochetImageData.gaugeUnits}):</label
								>
								<input
									bind:value={crochetImageData.gaugeWidth}
									onchange={() => {
										updateEstimation();
										automaticRedraw();
									}}
									id="gaugeWidth"
									name="gaugeWidth"
									type="number"
								/>
							</div>

							<div>
								<label for="gaugeHeight"
									>Update height of gauge ({crochetImageData.gaugeUnits}):</label
								>
								<input
									bind:value={crochetImageData.guageHeight}
									onchange={() => {
										updateEstimation();
										automaticRedraw();
									}}
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
								{crochetImageData.gaugeUnitsIsCm
									? 'Change Units to Inches'
									: 'Change Units to Centimeters'}
							</button>
						{/snippet}
					</DropdownComponent>
					<DropdownComponent name="Stitch/Row/Size Settings">
						{#snippet dropDownContent()}
							<div>
								<label for="updateOption">Select how you want to calculate project size:</label>
								<select id="updateOption" bind:value={sizeOptionSelection}>
									{#each sizeOptions as option}
										<option>{option}</option>
									{/each}
									<!-- <option>stitch count</option>
									<option>row count</option> -->
								</select>
							</div>
							<div>
								<label for="stitchCount">Stitch count:</label>
								<input
									disabled={sizeOptionSelection != sizeOptions[0]}
									bind:value={crochetImageData.projectStitches}
									onchange={() => {
										crochetImageData.updateFromStitches(crochetImageData.projectStitches);
										automaticRedraw();
									}}
									id="stitchCount"
									name="stitchCount"
									type="number"
								/>
							</div>
							<div>
								<label for="rowCount">Row count:</label>
								<input
									disabled={sizeOptionSelection != sizeOptions[1]}
									bind:value={crochetImageData.projectRows}
									onchange={() => {
										crochetImageData.updateFromRows(crochetImageData.projectRows);
										automaticRedraw();
									}}
									id="rowCount"
									name="rowCount"
									type="number"
								/>
							</div>
							<div>
								<label for="projectWidth">Estimated/Desired Width:</label>
								<input
									disabled={sizeOptionSelection != sizeOptions[2]}
									bind:value={crochetImageData.projectWidth}
									onchange={() => {
										crochetImageData.updateFromWidth(crochetImageData.projectWidth);
										automaticRedraw();
									}}
									id="projectWidth"
									name="projectWidth"
									type="number"
								/>
								<span class:invisible={sizeOptionSelection != sizeOptions[2]}
									>{crochetImageData.realProjectWidth}</span
								>
								<span>{crochetImageData.gaugeUnits}</span>
							</div>
							<div>
								<label for="projectHeight">Estimated/Desired Height:</label>
								<input
									disabled={sizeOptionSelection != sizeOptions[3]}
									bind:value={crochetImageData.projectHeight}
									onchange={() => {
										crochetImageData.updateFromHeight(crochetImageData.projectHeight);
										automaticRedraw();
									}}
									id="projectHeight"
									name="projectHeight"
									type="number"
								/>
								<span class:invisible={sizeOptionSelection != sizeOptions[3]}
									>{crochetImageData.realProjectHeight}</span
								>
								<span>{crochetImageData.gaugeUnits}</span>
							</div>
						{/snippet}
					</DropdownComponent>
					<DropdownComponent name="Colors">
						{#snippet dropDownContent()}
							<div>
								<label for="kMeansColorCountInput"></label>
								<input
									bind:value={kMeansColorCount}
									id="kMeansColorCountInput"
									name="kMeansColorCountInpue"
									type="number"
								/>
								<button
									onclick={() => {
										createKMeansPixelGroup();
									}}>Find the colors for me!</button
								>
							</div>
							{#each crochetImageData.colors as color, i}
								<div class="colorflex">
									<label for={'color' + i}>Color {i + 1}</label>
									<input
										id={'color' + i}
										bind:value={crochetImageData.colors[i]}
										type="color"
										onchange={automaticRedraw}
									/>
									<span>{crochetImageData.colors[i]}</span>
									<button
										class="iconButton"
										onclick={() => {
											crochetImageData.removeColorAtIndex(i);
											automaticRedraw();
										}}><Icon icon="ion:close-circle-outline" width="32" height="32" /></button
									>
								</div>
							{/each}
							<div>
								<button
									onclick={() => {
										crochetImageData.colorCount++;
										crochetImageData.updateColor();
										automaticRedraw();
									}}>Add Color</button
								>
							</div>
						{/snippet}
					</DropdownComponent>
					<button onclick={createPixelGroups}>create pixel groups</button>
				</div>
			</div>

			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div
				class="imageFlex"
				onclick={() => {
					canvasView = (canvasView + 1) % canvasViewOptions.length;
				}}
			>
				<div class="invisible">
					<Canvas
						bind:this={smallCanvas}
						width={600}
						height={600}
						{imageData}
						getPixels={getSmallPixels}
					/>
					<Canvas
						bind:this={smallestCanvas}
						width={50}
						height={50}
						{imageData}
						getPixels={getSmallestPixels}
					/>
				</div>
				<div class:top-view={page === 0 || canvasView === 0} class:invisible={!imageData}>
					<h3>Original Image</h3>
					<Canvas {imageData} {getPixels} bind:this={canvas} />
				</div>
				<div class:top-view={page === 2 && canvasView === 1} class:invisible={!pixelData}>
					<h3>Estimation of project</h3>
					<StitchCanvas bind:this={stitchCanvas} />
				</div>
				<div class:top-view={page === 2 && canvasView === 2} class:invisible={!pixelData}>
					<h3>Image with averaged colors</h3>
					<StitchCanvas bind:this={averageColorCanvas} colorToSelect={0} />
				</div>
				<div class:top-view={page === 2 && canvasView === 3} class:invisible={!pixelData}>
					<h3>Image of K-Means representation</h3>
					<SimpleCanvas bind:this={kMeansCanvas} pixelData2D={kMeansPixels} />
				</div>
			</div>

			<div class="hiddenPageButtons">
				<button onclick={previousPage}>Previous Page</button>
				<button onclick={nextPage}>Next Page</button>
			</div>
		</div>
		<div class="pagebutton">
			<button onclick={nextPage} class="iconButton"
				><Icon icon="ion:arrow-forward-circle-outline" width="48" height="48" /></button
			>
		</div>
	</div>
</main>

<style>
	@import url('https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,100..900;1,100..900&display=swap');

	* {
		padding: 8px;
		margin: 8px;
		color: var(--contrastingColor);
		font-family: Roboto;
		font-weight: bold;
	}

	button,
	input,
	select {
		background-color: var(--mainColor);
		text-shadow: black 1px 1px;
		border: none;
		font-weight: 800;
		font-size: larger;
		border-radius: 8px;
		transition: background-color 0.5s ease;
	}

	button {
		box-shadow: 5px 5px 0px --var(darkestColor);
		transition: box-shadow 0.5s ease;
	}

	button:active {
		box-shadow: 2px 2px 0px --var(darkestColor);
		transform: translate(2px, 2px);
		background-color: --var(darkerColor);
		transition:
			background-color 0.5s ease,
			box-shadow 0.5s ease;
	}

	input[type='number'] {
		max-width: 100px;
	}

	button:disabled,
	input:disabled,
	select:disabled {
		background-color: --var(darkerColor);
		color: #74725d;
		transition: background-color 0.5s ease;
	}

	input {
		padding: 4px;
	}

	main {
		display: flex;
		flex-direction: column;
		justify-content: flex-start;
		align-items: center;
		background: var(--mainColor);
		transition: background-color 0.5s ease;
		border-image-slice: 10 10 10 10 fill;
		border-image-width: 50px 50px 50px 50px;
		border-image-outset: 0px 0px 0px 0px;
		border-image-repeat: round round;
		border-image-source: url(/src/routes/waistcoatStitch.svg);
		max-height: 100vh;
		height: 100vh;
		overflow: hidden !important;
	}

	main {
		margin: 0 !important;
	}

	.colorflex {
		display: flex;
		flex-direction: row;
		align-items: center;
	}

	.rowflex {
		display: flex;
		flex-direction: row;
		/* border: 5px solid greenyellow; */
		/* background-color: #00000022; */
		border-radius: 10px;
		align-items: stretch;
		justify-content: space-evenly;
		width: 100%;
		min-height: 800px;
		max-height: 95vh;
	}

	.colflex {
		display: flex;
		flex-direction: column;
		justify-content: flex-start;
		align-items: start;
		width: 100%;
	}

	.options {
		display: flex;
		/* border: 5px solid blue; */
		background-color: #00000055;
		border-radius: 10px;
		flex-direction: column;
		justify-content: flex-start;
		align-items: center;
		flex-grow: 1;
		overflow-y: scroll;
		overflow-x: hidden;
	}

	.imageFlex {
		display: flex;
		/* border: 5px solid red; */
		background-color: #00000055;
		border-radius: 10px;
		flex-grow: 1;
		flex-direction: row;
		justify-content: space-evenly;
		overflow-y: auto;
		flex-wrap: wrap;
		max-width: 50%;
	}

	.options,
	.imageFlex {
		scrollbar-color: var(--contrastingColor) var(--mainColor); /* Blue thumb, orange track */
		transition: scrollbar-color 0.5s ease;
	}

	.top-view {
		align-self: flex-start;
		width: 90%;
		min-width: 90%;
		order: -1;
	}

	.imageFlex div {
		width: 40%;
	}

	.optionsandimage {
		display: flex;
		justify-content: stretch;
		/* border: 5px solid purple; */
		background-color: var(--mainColor);
		transition: scrollbar-color 0.5s ease;
		border-radius: 10px;
		width: 100%;
		max-height: 80vh;
	}

	.pagebutton {
		flex-grow: 1;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.invisible {
		display: none;
	}

	.iconButton {
		border: none;
		background-color: #00000000;
		color: var(--contrastingColor);
		transition: color 0.5s ease;
		box-shadow: none;
	}

	.hiddenPageButtons {
		display: none;
	}

	@media screen and (max-width: 992px) {
		.optionsandimage {
			flex-direction: column;
		}
		.imageFlex div {
			min-width: auto;
		}
		.options {
			max-height: 50%;
		}

		.imageFlex {
			max-width: 100%;
			max-height: 50%;
		}

		.hiddenPageButtons {
			display: flex;
			flex-direction: row;
			justify-content: space-evenly;
		}

		.pagebutton {
			display: none;
		}
	}
</style>
