<script lang="ts">
	import type { PageData } from './$types';
	import Head from '$lib/components/Head.svelte';

	export let data: PageData;
</script>

<Head
	title="Edit Teams | {data.tournament.year} {data.tournament.shortName} {data.tournament
		.division} | Duosmium Scoring"
/>

<h2>Teams</h2>

{#if data.tournament.teams.length === 0}
	<p>This tournament has no teams!</p>
{:else}
	<ul>
		{#each data.tournament.teams as team}
			<li>
				{team.number}: {team.school}{team.suffix ? ' ' : ''}{team.suffix ?? ''}
				{team.city ?? ''}{team.city ? ', ' : ''}{team.state}
			</li>
		{/each}
	</ul>
{/if}
