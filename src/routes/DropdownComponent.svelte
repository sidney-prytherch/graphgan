<script lang="ts">
	import Icon from "@iconify/svelte";

	let expanded = $state(false);

	const expand = () => {
		expanded = !expanded
	}

	let { name= "This doesn't have a name", dropDownContent } = $props();
</script>

<div class="container">
	<button onclick={expand} >
		<div class="title">
			<div class="icon" class:rotated={expanded}>
				<Icon icon="ion:arrow-forward-circle-outline" width="24" height="24"  />
			</div>
			<h2>{name}</h2>
		</div>
	</button>
	<div class:invisible={!expanded}>
		{@render dropDownContent()}
	</div>
</div>

<style>
	.invisible {
		display: none;
	}
	.rotated {
		rotate: 90deg;
	}
	.title {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: center;
	}
	.icon {
		padding: 0;
		margin: 0;
		height: 24px;
		width: 24px;
	}
	.container {
		padding: 8px;
		margin: 8px;
	}
	button {
		border: none;
		background-color: #00000000;
	}
</style>