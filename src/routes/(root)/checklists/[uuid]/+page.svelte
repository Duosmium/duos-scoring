<script lang="ts">
	import checklists from '$lib/checklists/checklists.js';
	import Head from '$lib/components/Head.svelte';

	export let data;

	const ChecklistComponent =
		checklists[data.score.event.tournament.year]?.[data.score.event.name];
</script>

<Head
	title="{data.score.event.tournament.division}{data.score.team.number} - {data
		.score.event.name} Team Checklist"
></Head>

<main class="px-6 py-24 w-full mx-auto xl:max-w-7xl">
	<svelte:component
		this={ChecklistComponent}
		teamNumber={data.score.team.number}
		teamName={data.score.team.school +
			(data.score.team.suffix ? ' ' + data.score.team.suffix : '')}
		checklistData={data.score.checklist}
		readonly
	/>
</main>
