<script lang="ts">
	import checklists from '$lib/checklists';
	import Head from '$lib/components/Head.svelte';
	import { Modal } from 'flowbite-svelte';
	import type { ComponentType } from 'svelte';

	let ChecklistComponent: ComponentType;
	let showChecklist = false;
</script>

<Head title="All Digital Checklists"></Head>

<main class="px-6 my-8 w-full mx-auto xl:max-w-7xl">
	<h1>Checklists</h1>

	{#each Object.entries(checklists) as [year, yearChecklists]}
		<h2>{year}</h2>
		<ul class="ml-4 text-lg list-disc">
			{#each Object.entries(yearChecklists) as [event, eventChecklist]}
				<li>
					<button
						on:click={() => {
							ChecklistComponent = eventChecklist;
							showChecklist = true;
						}}>{event}</button
					>
				</li>
			{/each}
		</ul>
	{/each}
</main>

<Modal title="Checklists" size="xl" bind:open={showChecklist} outsideclose>
	<svelte:component
		this={ChecklistComponent}
		teamNumber={1}
		teamName="Duosmium High School"
	/>
</Modal>
