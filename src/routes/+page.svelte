<script lang="ts">
	import Canvas from './Canvas.svelte';
	import Icon from '@iconify/svelte';
	import StitchCanvas from './StitchCanvas.svelte';
	import { CrochetImage } from './CrochetImage.svelte';
	import DropdownComponent from './DropdownComponent.svelte';
	import { PixelGroup } from './PixelGroup.svelte';
	import { KMeans } from './KMeans.svelte';
	import SimpleCanvas from './SimpleCanvas.svelte';

	let canvas: Canvas;
	let smallCanvas: Canvas;
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

	let kMeansColorCount: number = $state(5);
	let pixelGroups: PixelGroup[][] | null = $state(null);
	let pixelData: ImageData | undefined = $state();
	let smallPixelData: ImageData | undefined = $state();
	let kMeansPixels: string[][] = $state([[]]);
	let crochetImageData = $state(new CrochetImage());

	const getPixels = (data: ImageData) => {
		pixelData = data;
		crochetImageData.updatePixelData(pixelData);
	};

	const getSmallPixels = (data: ImageData) => {
		smallPixelData = data;
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

	const createKMeansPixelGroup = () => {
		if (!smallPixelData) {
			return null;
		}

		let pixels2D = [];

		crochetImageData.colors = new Array(kMeansColorCount).fill('#000000');
		crochetImageData.colorCount = crochetImageData.colors.length;
		crochetImageData.updateColor();
		createPixelGroups();

		let kMeans = new KMeans();
		for (let currentPixelRow = 0; currentPixelRow < smallPixelData.height; currentPixelRow++) {
			let row = [];
			for (let currentPixel = 0; currentPixel < smallPixelData.width; currentPixel++) {
				let pixelIndex = smallPixelData.width * 4 * currentPixelRow + 4 * currentPixel;
				row.push({
					r: smallPixelData.data[pixelIndex],
					g: smallPixelData.data[pixelIndex + 1],
					b: smallPixelData.data[pixelIndex + 2]
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
					};
				}
			};
		}
	};
</script>

<main>
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
								<button onclick={createKMeansPixelGroup}>Find the colors for me!</button>
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
				</div>
				<div class:top-view={page === 0 || canvasView === 0}>
					<p>Original Image</p>
					<Canvas {imageData} {getPixels} bind:this={canvas} />
				</div>
				<div class:top-view={page === 2 && canvasView === 1}>
					<p>Estimation of project</p>
					<StitchCanvas bind:this={stitchCanvas} />
				</div>
				<div class:top-view={page === 2 && canvasView === 2}>
					<p>Image with averaged colors</p>
					<StitchCanvas bind:this={averageColorCanvas} colorToSelect={0} />
				</div>
				<div class:top-view={page === 2 && canvasView === 3}>
					<p>Image of K-Means representation</p>
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
	* {
		padding: 8px;
		margin: 8px;
	}

	input {
		padding: 4px;
	}

	main {
		display: flex;
		flex-direction: column;
		justify-content: flex-start;
		align-items: center;
		background-color: aquamarine;
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
		background-color: #00000022;
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
		background-color: #00000022;
		border-radius: 10px;
		flex-grow: 1;
		flex-direction: row;
		justify-content: space-evenly;
		overflow-y: auto;
		flex-wrap: wrap;
		max-width: 50%;
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
		background-color: #00000022;
		border-radius: 10px;
		width: 100%;
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
