<script lang="ts">
	export let alt: string;
	export let imageData: {
		metadata: { width: number; height: number; src: string };
		jpeg: string;
		webp: string;
	};
	export let className = '';
	export let imgClass = '';
	export let loading: 'lazy' | 'eager' = 'lazy';
	export let sizes = '(max-width:65ch) 100vw, 65ch';
	export let preload = false;

	const { width, height, src } = imageData.metadata;
</script>

<svelte:head>
	{#if preload}
		<link
			rel="preload"
			as="image"
			imagesrcset={imageData.webp}
			imagesizes={sizes}
			type="image/webp"
		/>
		<link
			rel="preload"
			as="image"
			imagesrcset={imageData.jpeg}
			imagesizes={sizes}
			type="image/jpeg"
		/>
	{/if}
</svelte:head>

<picture class={className}>
	<source srcset={imageData.webp} type="image/webp" {sizes} />
	<source srcset={imageData.jpeg} type="image/jpeg" {sizes} />
	<img class={imgClass} {alt} {loading} decoding="async" {width} {height} {src} />
</picture>
