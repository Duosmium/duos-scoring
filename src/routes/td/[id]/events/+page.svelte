<script lang="ts">
	import type { PageData } from './$types';
	import Head from '$lib/components/Head.svelte';

	export let data: PageData;
</script>

<Head
	title="Events | {data.tournament.year} {data.tournament.shortName} {data.tournament
		.division} | Duosmium Scoring"
/>

<h2>Events</h2>

{#if data.tournament.events.length === 0}
	<p>No events have been added yet.</p>
{:else}
	<ul>
		{#each data.tournament.events as event}
			<li>
				<a href="/td/{data.tournament.id}/events/{event.slug}/">{event.name}</a>
			</li>
		{/each}
	</ul>
{/if}
