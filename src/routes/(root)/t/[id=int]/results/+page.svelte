<script lang="ts">
	import type { PageData } from './$types';
	import Head from '$lib/components/Head.svelte';
	import SelectableTable from '$lib/components/SelectableTable.svelte';
	import {
		Avatar,
		Button,
		Checkbox,
		Heading,
		Label,
		Modal,
		P,
		TableBodyCell,
		TableHeadCell,
		Tooltip
	} from 'flowbite-svelte';
	import { page } from '$app/stores';
	import yaml from 'js-yaml';

	export let data: PageData;

	const trialStatusDisplay = {
		SCORING: 'Scoring',
		TRIAL: 'Trial',
		TRIALED: 'Trialed'
	} as const;

	$: roles = data.roles;
	$: events = data.events.map((e) => ({
		...e,
		disabled: e.audited == null
	}));
	let selected: typeof events = [];

	let exportHistos = false;

	let showHisto = false;
	let histoEvent: bigint | null = null;
	let histoLoaded = false;
	function openHistogram(id: bigint) {
		histoEvent = id;
		histoLoaded = false;
		showHisto = true;
	}

	let showPreview = false;

	async function generatePreview() {
		const selectedEvents = new Set(selected.flatMap((e) => e.id));
		const sciolyffRep = {
			Tournament: {
				name: data.tournament.name,
				'short name': data.tournament.shortName ?? undefined,
				location: data.tournament.location,
				state: data.tournament.state,
				level: data.tournament.level,
				division: data.tournament.division,
				year: data.tournament.year,
				'start date': data.tournament.startDate,
				'end date': data.tournament.endDate,
				'awards date': data.tournament.awardsDate,
				medals: data.tournament.medals,
				trophies: data.tournament.trophies,
				bids: data.tournament.bids ?? undefined,
				'n offset': data.tournament.nOffset ?? undefined,
				'worst placings dropped': data.tournament.drops ?? undefined
			},
			Events: data.events.flatMap((e) =>
				selectedEvents.has(e.id)
					? [
							{
								name: e.name,
								trial: e.trialStatus === 'TRIAL' ? true : undefined,
								trialed: e.trialStatus === 'TRIALED' ? true : undefined,
								medals: e.medals ?? undefined
							}
					  ]
					: []
			),
			Tracks:
				data.tournament.enableTracks && data.tracks.length
					? data.tracks.map((t) => ({
							name: t.name,
							medals: t.medals ?? undefined,
							trophies: t.trophies ?? undefined
					  }))
					: undefined,
			Teams: data.teams.map((t) => ({
				number: t.number,
				school: t.school,
				'school abbreviation': t.abbreviation ?? undefined,
				suffix: t.suffix ?? undefined,
				city: t.city ?? undefined,
				state: t.state,
				track: t.tracks?.name ?? undefined,
				exhibition: t.exhibition || undefined
			})),
			Placings: data.rankings.flatMap((r) =>
				r.flatMap((s) =>
					selectedEvents.has(s.event.id)
						? [
								{
									team: s.team.number,
									event: s.event.name,
									participated:
										s.ranking === 'PARTICIPATION'
											? true
											: s.ranking === 'NOSHOW'
											? false
											: undefined,
									disqualified: s.status === 'DISQUALIFICATION' ? true : undefined,
									place: typeof s.ranking === 'number' ? s.ranking : undefined,
									tie: s.tie || undefined
								}
						  ]
						: []
				)
			),
			Penalties:
				data.teams.flatMap((t) =>
					t.penalties == null
						? []
						: [
								{
									team: t.number,
									points: t.penalties
								}
						  ]
				) || undefined,
			Histograms: exportHistos
				? {
						type: 'data',
						data: data.events.flatMap((e) =>
							selectedEvents.has(e.id) ? [{ ...data.histos.get(e.id), event: e.name }] : []
						)
				  }
				: undefined
		};

		const content = yaml.dump(sciolyffRep);

		const res = await fetch('https://www.duosmium.org/preview/render/', {
			method: 'POST',
			body: JSON.stringify({ rep: content, superscore: false })
		});

		try {
			if (res.status !== 200) {
				throw new Error(`${res.status} ${res.statusText}`);
			}
			const data = await res.text();
			return data;
		} catch (e) {
			return `<!doctype html><html><body>
          <style>body,html {
            font-family: Roboto, -apple-system, BlinkMacSystemFont, Segoe UI, Helvetica Neue, Arial, sans-serif, Apple Color Emoji, Segoe UI Emoji, Segoe UI Symbol;
          }</style>
          <h1>An error occurred.</h1>
          <p>This could be because of an issue with your SciolyFF input.
          Please check your SciolyFF with the SciolyFF validator before continuing.
          If this issue persists, please contact the Duosmium team through
          <a href="mailto:admin@duosmium.org">email</a> or <a href="https://discord.gg/D6H5KNScHB">Discord</a>.</p>
          <p style="color: #aaa">Error code: ${e}</p>
          </body></html>`;
		}
	}
</script>

<Head
	title="Results | {data.tournament.year} {data.tournament.shortName} {data.tournament
		.division} | Duosmium Scoring"
/>

<Heading tag="h2" class="w-fit">Results</Heading>

<P
	>Preview and export results on this page. Select the events you want to export, then use the
	"Preview" button to preview the results page, where you can download a PDF version.</P
>

<Label class="text-base mb-4">
	Export Histograms: <Checkbox bind:checked={exportHistos} />
</Label>

<SelectableTable items={events} bind:selected cols={5}>
	<svelte:fragment slot="buttons">
		<Button
			color="green"
			on:click={() => {
				showPreview = true;
			}}>Preview</Button
		>
	</svelte:fragment>
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
		<TableBodyCell class="py-0 px-2">{event.name}</TableBodyCell>
		<TableBodyCell class="py-0 px-2">{event.medals ?? data.tournament.medals}</TableBodyCell>
		<TableBodyCell class="py-0 px-2">{trialStatusDisplay[event.trialStatus]}</TableBodyCell>
		<TableBodyCell class="py-0 px-2">{event.scores.length} / {data.teams.length}</TableBodyCell>
		<TableBodyCell class="py-0 px-2"
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
		<TableBodyCell class="py-0 px-2">
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
				class="animate-spin mr-2 fill-black dark:fill-white"
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

<Modal title="Results Preview" bind:open={showPreview} autoclose outsideclose size="xl">
	{#await generatePreview()}
		<div class="grid place-items-center h-60">
			<span class="flex items-center">
				<svg
					class="animate-spin mr-2 fill-black dark:fill-white"
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
	{:then previewContent}
		<iframe
			title="Results Preview"
			class="w-full h-screen"
			srcdoc={previewContent
				.replace('/main.css', 'https://www.duosmium.org/main.css')
				.replace('/main.js', 'https://www.duosmium.org/main.js')}
		/>
	{/await}
	<svelte:fragment slot="footer">
		<Button color="alternative">Ok</Button>
	</svelte:fragment>
</Modal>
