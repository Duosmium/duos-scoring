<script lang="ts">
	export let title: string;
</script>

<svelte:head>
	<title>{title}</title>

	<meta property="og:title" content={title} />

	<meta name="twitter:title" content={title} />
</svelte:head>
