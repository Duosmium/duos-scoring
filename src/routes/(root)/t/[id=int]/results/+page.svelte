<script lang="ts">
	import type { PageData } from './$types';
	import Head from '$lib/components/Head.svelte';
	import SelectableTable from '$lib/components/SelectableTable.svelte';
	import { addToastMessage } from '$lib/components/Toasts.svelte';

	import {
		Avatar,
		Button,
		ButtonGroup,
		Checkbox,
		Dropdown,
		DropdownItem,
		Heading,
		Modal,
		P,
		Select,
		TableBodyCell,
		TableHeadCell,
		Tooltip
	} from 'flowbite-svelte';
	import ChevronDownOutline from 'flowbite-svelte-icons/ChevronDownOutline.svelte';
	import { page } from '$app/stores';
	import yaml from 'js-yaml';
	import * as zip from '@zip.js/zip.js';
	import type { Tournament } from '@prisma/client';

	import { invalidateAll } from '$app/navigation';
	import Slides from './Slides.svelte';

	export let data: PageData;

	let slides: Slides;

	const trialStatusDisplay = {
		SCORING: 'Scoring',
		TRIAL: 'Trial',
		TRIALED: 'Trialed'
	} as const;

	$: roles = data.roles;
	$: events = data.events.map((e) => ({
		...e,
		initiallyChecked: e.scores.length === data.teams.length && e.lastExportedAt == null
	}));
	let selected: typeof events = [];

	let sortBy = 'event';
	$: {
		events = events.sort((a, b) => {
			switch (sortBy) {
				case 'event':
					return a.name.localeCompare(b.name);
				case 'scoresIn':
					return a.scores.length - b.scores.length;
				case 'auditor':
					return (a.audited?.name ?? '').localeCompare(b.audited?.name ?? '');
				case 'auditTime':
					return (b.auditedAt?.getTime() ?? 0) - (a.auditedAt?.getTime() ?? 0);
				case 'exportTime':
					return (b.lastExportedAt?.getTime() ?? 0) - (a.lastExportedAt?.getTime() ?? 0);
				default:
					return 0;
			}
		});
	}

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
	$: presentationActive = data.slides.channelId != null;

	function touchEventsExportedAt() {
		fetch(`/t/${$page.params.id}/results/touch`, {
			method: 'PATCH',
			body: JSON.stringify(selected.flatMap((e) => e.id.toString()))
		}).then((res) => {
			if (res.status === 200) {
				invalidateAll();
			}
		});
	}
	function generateSciolyFF(events?: bigint[]) {
		if (!events && selected.length !== 0) touchEventsExportedAt();

		const levelLookup = {
			INVITATIONAL: 'Invitational',
			REGIONAL: 'Regionals',
			STATE: 'States',
			NATIONAL: 'Nationals'
		} as const;
		const selectedEvents = new Set(events ?? selected.flatMap((e) => e.id));
		const sciolyffRep = {
			Tournament: {
				name: data.tournament.name,
				'short name': data.tournament.shortName ?? undefined,
				location: data.tournament.location,
				state: data.tournament.state,
				level: levelLookup[data.tournament.level],
				division: data.tournament.division,
				year: data.tournament.year,
				'start date': data.tournament.startDate.toISOString().split('T')[0],
				'end date': data.tournament.endDate.toISOString().split('T')[0],
				'awards date': data.tournament.awardsDate.toISOString().split('T')[0],
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
			Placings: data.rankings.flatMap((s) =>
				selectedEvents.has(s.event.id)
					? [
							{
								team: s.team.number,
								event: s.event.name,
								participated:
									s.ranking === 'PARTICIPATION' ? true : s.ranking === 'NOSHOW' ? false : undefined,
								disqualified: s.status === 'DISQUALIFICATION' ? true : undefined,
								place: typeof s.ranking === 'number' ? s.ranking : undefined,
								tie: s.tie || undefined
							}
						]
					: []
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

		return yaml.dump(sciolyffRep);
	}

	async function generatePreview() {
		const content = generateSciolyFF();

		const res = await fetch('https://www.duosmium.org/preview/render/', {
			method: 'POST',
			body: JSON.stringify({ rep: content, superscore: false })
		});

		try {
			if (res.status !== 200) {
				throw new Error(`${res.status} ${res.statusText}`);
			}
			const data = await res.text();
			return data
				.replace('/main.css', 'https://www.duosmium.org/main.css')
				.replace('/main.js', 'https://www.duosmium.org/main.js');
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

	function copySciolyFF() {
		const content = generateSciolyFF();
		navigator.clipboard.writeText(content).then(
			() => {
				addToastMessage('Copied!', 'success');
			},
			() => {
				addToastMessage('Copy failed!', 'error');
			}
		);
	}

	function downloadSciolyFF() {
		const content = generateSciolyFF();
		const url = URL.createObjectURL(new Blob([content], { type: 'text/yaml' }));
		const a = document.createElement('a');
		a.href = url;
		a.download = generateFilename(data.tournament).trim() + '.yaml';
		a.hidden = true;
		document.body.appendChild(a);
		a.click();
		a.remove();
		URL.revokeObjectURL(url);
	}

	function generateFilename(tournament: Tournament) {
		// ^(19|20)\d{2}-[01]\d-[0-3]\d_([\w]+_invitational|([ns]?[A-Z]{2})_[\w]+_regional|([ns]?[A-Z]{2})_states|nationals)_(no_builds_)?[abc]$
		let output = '';
		output += tournament.startDate.getUTCFullYear();
		output += '-' + (tournament.startDate.getUTCMonth() + 1).toString().padStart(2, '0');
		output += '-' + tournament.startDate.getUTCDate().toString().padStart(2, '0');
		switch (tournament.level) {
			case 'NATIONAL':
				output += '_nationals';
				break;
			case 'STATE':
				output += `_${tournament.state}_states`;
				break;
			case 'REGIONAL':
				output += `_${tournament.state}_${(tournament.shortName ?? tournament.name)
					.toLowerCase()
					.split('regional')[0]
					.replace(/\./g, '')
					.replace(/[^\w]/g, '_')}regional`;
				break;
			default:
				output += `_${(tournament.shortName ?? tournament.name)
					.toLowerCase()
					.split('invitational')[0]
					.replace(/\./g, '')
					.replace(/[^\w]/g, '_')}invitational`;
				break;
		}
		output += '_' + tournament.division.toLowerCase();
		return output;
	}

	let printPreview: HTMLIFrameElement;
	async function printPdf() {
		const content = await generatePreview();
		printPreview.contentDocument?.write(content);
		printPreview.contentDocument?.close();
		printPreview.hidden = false;
		printPreview.contentWindow?.print();
		printPreview.hidden = true;
		printPreview.contentDocument?.write('');
		printPreview.contentDocument?.close();
	}

	function downloadRaws() {
		const header = ['Team #', 'Team'].concat(...data.events.map((e) => e.name));
		const body = data.teams.map((t) => [
			t.number,
			t.school + (t.suffix ? ` ${t.suffix}` : ''),
			...data.events.map((e) => {
				const score = e.scores.find((s) => s.teamId === t.id);
				return ['NOSHOW', 'DISQUALIFICATION', 'PARTICIPATION'].includes(score?.status ?? '')
					? score?.status ?? ''
					: score?.rawScore ?? '';
			})
		]);
		const csv = [header, ...body].map((row) => row.join(',')).join('\n');
		const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
		const a = document.createElement('a');
		a.href = url;
		a.download = generateFilename(data.tournament).trim() + '_RAW_SCORES.csv';
		a.hidden = true;
		document.body.appendChild(a);
		a.click();
		a.remove();
		URL.revokeObjectURL(url);
	}

	async function downloadEventZip() {
		const blobWriter = new zip.BlobWriter('application/zip');
		const writer = new zip.ZipWriter(blobWriter);

		await Promise.all(
			data.events.map(async (event) => {
				const header = [
					'Team #',
					'Team',
					'Raw Score',
					'Tier',
					'Tiebreak',
					'Status',
					'Ranking',
					'Notes'
				];
				const body = data.teams.map((t) => {
					const s = event.scores.find((s) => s.teamId === t.id);
					return [
						t.number,
						t.school + (t.suffix ? ` ${t.suffix}` : ''),
						s?.rawScore ?? '',
						s?.tier ?? '',
						s?.tiebreak ?? '',
						s?.status ?? '',
						data.rankings.find((r) => r.teamId === t.id && r.event.id === event.id)?.ranking ?? '',
						s?.notes ?? ''
					];
				});
				const csv = [header, ...body].map((row) => row.join(',')).join('\n');
				await writer.add(
					`${event.name}.csv`,
					new zip.BlobReader(new Blob([csv], { type: 'text/csv' }))
				);
			})
		);

		await writer.close();
		const blob = await blobWriter.getData();
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = generateFilename(data.tournament).trim() + '_ALL_SCORES.zip';
		a.hidden = true;
		document.body.appendChild(a);
		a.click();
		a.remove();
		URL.revokeObjectURL(url);
	}
</script>

<Head
	title="Results | {data.tournament.year} {data.tournament.shortName} {data.tournament
		.division} | Duosmium Scoring"
/>

<Heading tag="h2" class="w-fit">Results</Heading>

<P
	>Preview and export results on this page. Select the events you want to export with the checkboxes
	on the left, or check the top-most checkbox to check all the events. Then use the "Preview" button
	to preview the results page, where you can download a PDF version. In order to select an event,
	the event must be marked as audited by a tournament director or scoremaster.</P
>

<P>To update/publish results to duosmium.org, email admin@duosmium.org.</P>

<div class="w-full flex justify-between items-center flex-wrap mb-2">
	<Checkbox bind:checked={exportHistos}>Export Histograms</Checkbox>
	<span class="space-x-4 flex items-center flex-wrap">
		<Select
			class="w-36"
			items={[
				{ value: 'event', name: 'By Event' },
				{ value: 'scoresIn', name: 'By Scores In' },
				{ value: 'auditor', name: 'By Auditor' },
				{ value: 'auditTime', name: 'By Audit Time' },
				{ value: 'exportTime', name: 'By Export Time' }
			]}
			bind:value={sortBy}
		/>
		<ButtonGroup class="space-x-px">
			<Button
				class="py-2 border border-green-700 hover:border-green-800 dark:border-green-600 dark:hover:border-green-700"
				color="green"
				disabled={selected.length === 0}
				on:click={() => {
					showPreview = true;
				}}>Scoreboard</Button
			>
			<Button
				class="py-2 border border-green-700 hover:border-green-800 dark:border-green-600 dark:hover:border-green-700"
				color="green"
				disabled={selected.length === 0}
				on:click={() => {
					addToastMessage('Generating PDF...', 'success');
					printPdf();
				}}>PDF</Button
			>
		</ButtonGroup>
		<ButtonGroup class="space-x-px">
			<Button
				class="py-2 border border-yellow-400 hover:border-yellow-500"
				color="yellow"
				disabled={selected.length === 0}
				on:click={() => {
					slides.setPreview(true);
				}}>Preview Slides</Button
			>
			{#if !presentationActive}
				<Button
					class="py-2 border border-yellow-400 hover:border-yellow-500"
					color="yellow"
					disabled={selected.length === 0}
					on:click={() => {
						slides.startPresentation(selected.map((e) => e.id));
						presentationActive = true;
						invalidateAll();
					}}>Present</Button
				>
			{:else}
				<Button
					class="py-2 border border-yellow-400 hover:border-yellow-500"
					color="yellow"
					disabled={selected.length === 0}
					on:click={() => {
						slides.addBatch(selected.map((e) => e.id));
					}}>Append Events</Button
				>
				<Button
					class="py-2 border border-yellow-400 hover:border-yellow-500"
					color="yellow"
					disabled={selected.length === 0}
					on:click={() => {
						slides.addBatch(
							selected.map((e) => e.id),
							true
						);
					}}>Append Overall</Button
				>
				<Button
					class="py-2 border border-yellow-400 hover:border-yellow-500"
					color="yellow"
					on:click={() => {
						slides.resumePresentation();
					}}>Resume Presentation</Button
				>
				<Button
					class="py-2 border border-yellow-400 hover:border-yellow-500"
					color="yellow"
					on:click={() => {
						slides.stopPresentation();
						invalidateAll();
					}}>Stop Presenting</Button
				>
			{/if}
		</ButtonGroup>
		<Button
			class="py-2 border border-purple-700 hover:border-purple-800 dark:border-purple-600 dark:hover:border-purple-700"
			color="purple"
			disabled={selected.length === 0}
			on:click={() => {
				slides.setPrintable(true);
			}}>Printable Medals List</Button
		>

		<Button
			color="blue"
			class="py-1.5 border border-blue-700 hover:border-blue-800 dark:border-blue-600 dark:hover:border-blue-700"
			>Other <ChevronDownOutline class="w-6 h-6 fill-transparent" /></Button
		>
		<Dropdown class="dark:bg-gray-800">
			<DropdownItem disabled={selected.length === 0} on:click={downloadRaws}
				>Export Raw Scores Only</DropdownItem
			>
			<DropdownItem disabled={selected.length === 0} on:click={downloadEventZip}
				>Export All Event Data</DropdownItem
			>
			<DropdownItem disabled={selected.length === 0} on:click={copySciolyFF}
				>Copy SciolyFF</DropdownItem
			>
			<DropdownItem disabled={selected.length === 0} on:click={downloadSciolyFF}
				>Download SciolyFF</DropdownItem
			>
		</Dropdown>
	</span>
</div>

<SelectableTable items={events} bind:selected cols={7}>
	<svelte:fragment slot="buttons"></svelte:fragment>
	<svelte:fragment slot="headers">
		<TableHeadCell class="px-2">Event</TableHeadCell>
		<TableHeadCell class="px-2">Medals</TableHeadCell>
		<TableHeadCell class="px-2">Trial Status</TableHeadCell>
		<TableHeadCell class="px-2">Scores In</TableHeadCell>
		<TableHeadCell class="px-2">Audited</TableHeadCell>
		<TableHeadCell class="px-2">Last Export</TableHeadCell>
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
						.map((w) => w[0])
						.join('')
						.toUpperCase()}</Avatar
				>
			{:else}
				No
			{/if}</TableBodyCell
		>
		<TableBodyCell class="py-0 px-2"
			>{event.lastExportedAt?.toLocaleString('en-US', {
				month: 'numeric',
				day: 'numeric',
				hour12: false,
				hour: '2-digit',
				minute: '2-digit'
			}) ?? 'None'}</TableBodyCell
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

{#key events}
	{#each roles as { user }}
		<Tooltip triggeredBy={`.user_${user.id}`}>{user.name}</Tooltip>
	{/each}
{/key}

<Slides {generateFilename} {generateSciolyFF} tournament={data.tournament} bind:this={slides} />

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
		<Button color="alternative">Done</Button>
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
		<iframe title="Results Preview" class="w-full h-[calc(100vh-200px)]" srcdoc={previewContent} />
	{/await}
</Modal>

{#await generatePreview()}
	<!-- nothing here -->
{:then previewContent}
	<div class="sr-only" aria-hidden="true">
		<iframe
			title="Results Preview"
			class="w-full h-[calc(100vh-200px)] invisible"
			hidden={true}
			bind:this={printPreview}
			srcdoc={previewContent}
		/>
	</div>
{/await}
