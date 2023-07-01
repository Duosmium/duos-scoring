<script lang="ts">
	import type { PageData } from './$types';
	import Head from '$lib/components/Head.svelte';
	import SelectableTable from '$lib/components/SelectableTable.svelte';
	import {
		Avatar,
		Button,
		Heading,
		Modal,
		TableBodyCell,
		TableHeadCell,
		Tooltip
	} from 'flowbite-svelte';
	import { page } from '$app/stores';

	export let data: PageData;

	const trialStatusDisplay = {
		SCORING: 'Scoring',
		TRIAL: 'Trial',
		TRIALED: 'Trialed'
	} as const;

	$: roles = data.tournament.roles!;
	$: events = data.tournament.events!;
	let selected: typeof events = [];

	let showHisto = false;
	let histoEvent: bigint | null = null;
	let histoLoaded = false;
	function openHistogram(id: bigint) {
		histoEvent = id;
		histoLoaded = false;
		showHisto = true;
	}
</script>

<Head
	title="Results | {data.tournament.year} {data.tournament.shortName} {data.tournament
		.division} | Duosmium Scoring"
/>

<Heading tag="h2" class="w-fit">Results</Heading>

<SelectableTable items={events} bind:selected cols={5}>
	<svelte:fragment slot="buttons" />
	<svelte:fragment slot="headers">
		<TableHeadCell class="px-2">Event</TableHeadCell>
		<TableHeadCell class="px-2">Medals</TableHeadCell>
		<TableHeadCell class="px-2">Trial Status</TableHeadCell>
		<TableHeadCell class="px-2">Scores In</TableHeadCell>
		<TableHeadCell class="px-2">Audited</TableHeadCell>
		<TableHeadCell class="px-2">
			<span class="sr-only"> Histogram </span>
		</TableHeadCell>
	</svelte:fragment>
	<svelte:fragment slot="item" let:item={event}>
		<TableBodyCell class="px-2">{event.name}</TableBodyCell>
		<TableBodyCell class="px-2">{event.medals ?? 'Default'}</TableBodyCell>
		<TableBodyCell class="px-2">{trialStatusDisplay[event.trialStatus]}</TableBodyCell>
		<TableBodyCell class="px-2"
			>{event.scores.length} / {data.tournament.teams.length}</TableBodyCell
		>
		<TableBodyCell class="px-2"
			>{#if event.audited}
				<Avatar class={`user_${event.audited.id} -ml-2`}
					>{event.audited.name
						.split(' ')
						.map((w) => w[0].toUpperCase())
						.join('')}</Avatar
				>
			{:else}
				No
			{/if}</TableBodyCell
		>
		<TableBodyCell class="px-2">
			<Button
				disabled={event.scores.filter((s) => s.rawScore !== null).length === 0}
				color="alternative"
				class="border-none p-1 font-medium text-primary-600 hover:underline dark:text-primary-500"
				on:click={() => {
					openHistogram(event.id);
				}}
			>
				Histogram
			</Button>
		</TableBodyCell>
	</svelte:fragment>
</SelectableTable>

{#each roles as { user }}
	<Tooltip triggeredBy={`.user_${user.id}`}>{user.name}</Tooltip>
{/each}

<Modal
	title={events.find((e) => e.id === histoEvent)?.name}
	bind:open={showHisto}
	autoclose
	outsideclose
>
	<img
		class:sr-only={!histoLoaded}
		aria-hidden={!histoLoaded}
		src={`/t/${$page.params.id}/results/histo/${histoEvent}`}
		alt="Histogram"
		on:load={() => {
			histoLoaded = true;
		}}
	/>
	<div class="grid place-items-center h-60" class:hidden={histoLoaded}>
		<span class="flex items-center">
			<svg
				class="animate-spin mr-2 text-inherit"
				width="24"
				height="24"
				viewBox="0 0 24 24"
				xmlns="http://www.w3.org/2000/svg"
				><path
					d="M12,1A11,11,0,1,0,23,12,11,11,0,0,0,12,1Zm0,19a8,8,0,1,1,8-8A8,8,0,0,1,12,20Z"
					opacity=".25"
				/><path
					d="M10.14,1.16a11,11,0,0,0-9,8.92A1.59,1.59,0,0,0,2.46,12,1.52,1.52,0,0,0,4.11,10.7a8,8,0,0,1,6.66-6.61A1.42,1.42,0,0,0,12,2.69h0A1.57,1.57,0,0,0,10.14,1.16Z"
				/></svg
			><span>Loading...</span>
		</span>
	</div>
	<svelte:fragment slot="footer">
		<Button color="alternative">Ok</Button>
	</svelte:fragment>
</Modal>
