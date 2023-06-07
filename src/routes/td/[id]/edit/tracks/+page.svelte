<script lang="ts">
	import type { PageData } from './$types';
	import Head from '$lib/components/Head.svelte';

	export let data: PageData;
</script>

<Head
	title="Edit Tracks | {data.tournament.year} {data.tournament.shortName} {data.tournament
		.division} | Duosmium Scoring"
/>

<h2>Tracks</h2>

{#if data.tracks.length === 0}
	<p>This tournament has no tracks!</p>
{:else}
	<ul>
		{#each data.tracks as track}
			<li>{track.name} ({track.medals} medals, {track.trophies} trophies)</li>
		{/each}
	</ul>
{/if}
