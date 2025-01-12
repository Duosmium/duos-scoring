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
		Timeline,
		TimelineItem,
		Tooltip
	} from 'flowbite-svelte';
	import ChevronDownOutline from 'flowbite-svelte-icons/ChevronDownOutline.svelte';
	import { page } from '$app/stores';
	import * as zip from '@zip.js/zip.js';

	import { invalidateAll } from '$app/navigation';
	import Slides from './Slides.svelte';
	import { generateFilename, generateSciolyFF } from '$lib/sciolyffHelpers';
	import { sendData } from '../helpers';

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
		initiallyChecked:
			e.scores.length === data.teams.length && e.lastExportedAt == null
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
					return (
						(b.lastExportedAt?.getTime() ?? 0) -
						(a.lastExportedAt?.getTime() ?? 0)
					);
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
	function getSciolyFF(events?: bigint[]) {
		if (!events && selected.length !== 0) touchEventsExportedAt();
		const selectedEvents = new Set(events ?? selected.flatMap((e) => e.id));

		const filteredEvents = data.events.filter((e) => selectedEvents.has(e.id));
		const filteredRankings = data.rankings.filter((r) =>
			selectedEvents.has(r.event.id)
		);

		return generateSciolyFF(
			data.tournament,
			filteredEvents,
			data.tracks,
			data.teams,
			filteredRankings,
			exportHistos ? data.histos : undefined
		);
	}

	async function generatePreview() {
		const content = getSciolyFF();

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
		const content = getSciolyFF();
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
		const content = getSciolyFF();
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
				return ['NOSHOW', 'DISQUALIFICATION', 'PARTICIPATION'].includes(
					score?.status ?? ''
				)
					? (score?.status ?? '')
					: (score?.rawScore ?? '');
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
						data.rankings.find(
							(r) => r.teamId === t.id && r.event.id === event.id
						)?.ranking ?? '',
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

	let markPrelim = true;
	let showPublish = false;
	let showStatus = false;
	let publishStatus: [string, string, 'ok' | 'pending' | 'error'][] = [];
	function publishResults() {
		if (events.some((e) => !e.audited)) {
			addToastMessage('All events must be audited before publishing.', 'error');
			return;
		}
		showPublish = false;
		publishStatus = [['Uploading results...', '', 'pending']];
		showStatus = true;
		sendData({
			path: `/t/${$page.params.id}/results/publish`,
			method: 'PUT',
			body: { exportHistos, markPrelim },
			msgs: {
				info: 'Uploading results...',
				success: 'Results uploaded successfully!',
				error: 'Failed to upload results.'
			}
		})
			.then(() => {
				selected = [];
				publishStatus = [
					['Uploading results...', '', 'ok'],
					['Results uploaded!', '', 'ok'],
					['Building website...', 'This may take a while.', 'pending']
				];
				const interval = setInterval(async () => {
					const resp = await fetch(
						'https://api.netlify.com/api/v1/sites/e5240f06-f560-42cf-9484-ed20ba5c7e87/deploys?per_page=1'
					);

					const status = (await resp.json())[0].state;
					if (status === 'ready') {
						clearInterval(interval);
						publishStatus = [
							['Uploading results...', '', 'ok'],
							['Results uploaded!', '', 'ok'],
							['Building website...', '', 'ok'],
							['Website built!', '', 'ok'],
							['Results published!', '', 'ok']
						];
						addToastMessage('Results published!', 'success');
					} else if (status === 'error') {
						clearInterval(interval);
						publishStatus = [
							['Uploading results...', '', 'ok'],
							['Results uploaded!', '', 'ok'],
							['Building website...', '', 'error'],
							[
								'Failed to build website.',
								'Please contact a Duosmium admin to resolve this issue.',
								'error'
							]
						];
						addToastMessage('Failed to publish (build error).', 'error');
					} else {
						publishStatus = [
							['Uploading results...', '', 'ok'],
							['Results uploaded!', '', 'ok'],
							[
								'Building website...',
								`This may take up to 3 minutes. Last status: ${status}; Last checked: ${new Date().toLocaleTimeString()}`,
								'pending'
							]
						];
					}
				}, 5000);
			})
			.catch(() => {
				publishStatus = [
					['Uploading results...', '', 'error'],
					[
						'Failed to upload results.',
						'Please contact a Duosmium admin to resolve this issue.',
						'error'
					]
				];
			});
	}

	function requestApproval() {
		sendData({
			path: `/t/${$page.params.id}`,
			method: 'PATCH',
			body: { requestingApproval: true },
			msgs: {
				info: 'Requesting approval...',
				success: 'Approval requested!',
				error: 'Failed to request approval!'
			}
		});
	}
</script>

<Head
	title="Results | {data.tournament.year} {data.tournament.shortName} {data
		.tournament.division} | Duosmium Scoring"
/>

<Heading tag="h2" class="w-fit">Results</Heading>

<P
	>Preview and export results on this page. Select the events you want to export
	with the checkboxes on the left, or check the top-most checkbox to check all
	the events. Then use the "Preview" button to preview the results page, where
	you can download a PDF version. In order to select an event, the event must be
	marked as audited by a tournament director or scoremaster.</P
>

<P
	>To update/publish results to duosmium.org, ensure the tournament is approved
	and all events are audited, then select all events. A publish button should
	appear at the bottom of your screen.</P
>

<ul class="flex gap-4 mb-6">
	<li class="flex items-center gap-1">
		{#if data.tournament.approved}
			<svg
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 24 24"
				fill="currentColor"
				class="size-6 text-green-500"
			>
				<path
					fill-rule="evenodd"
					d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z"
					clip-rule="evenodd"
				/>
			</svg>
			Tournament Approved
		{:else if data.tournament.requestingApproval}
			<svg
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 24 24"
				fill="currentColor"
				class="size-6 text-yellow-400"
			>
				<path
					fill-rule="evenodd"
					d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm3 10.5a.75.75 0 0 0 0-1.5H9a.75.75 0 0 0 0 1.5h6Z"
					clip-rule="evenodd"
				/>
			</svg>
			Approval Pending
		{:else}
			<svg
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 24 24"
				fill="currentColor"
				class="size-6 text-red-500"
			>
				<path
					fill-rule="evenodd"
					d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm-1.72 6.97a.75.75 0 1 0-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 1 0 1.06 1.06L12 13.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L13.06 12l1.72-1.72a.75.75 0 1 0-1.06-1.06L12 10.94l-1.72-1.72Z"
					clip-rule="evenodd"
				/>
			</svg>
			<button class="hover:underline cursor-pointer" on:click={requestApproval}
				>Request Approval?</button
			>
		{/if}
	</li>
	<li class="flex items-center gap-1">
		{#if events.every((e) => e.audited)}
			<svg
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 24 24"
				fill="currentColor"
				class="size-6 text-green-500"
			>
				<path
					fill-rule="evenodd"
					d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z"
					clip-rule="evenodd"
				/>
			</svg>
			All Events Audited
		{:else}
			<svg
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 24 24"
				fill="currentColor"
				class="size-6 text-red-500"
			>
				<path
					fill-rule="evenodd"
					d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm-1.72 6.97a.75.75 0 1 0-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 1 0 1.06 1.06L12 13.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L13.06 12l1.72-1.72a.75.75 0 1 0-1.06-1.06L12 10.94l-1.72-1.72Z"
					clip-rule="evenodd"
				/>
			</svg>
			Some Events Not Audited
		{/if}
	</li>
</ul>

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
	<svelte:fragment slot="buttons">
		{#if selected.length === events.length && data.tournament.approved && events.every((e) => e.audited)}
			<Button
				color="blue"
				on:click={() => {
					showPublish = true;
				}}>Publish to duosmium.org</Button
			>
		{/if}
	</svelte:fragment>
	<svelte:fragment slot="headers">
		<TableHeadCell class="px-2"
			><button
				on:click={() => {
					sortBy = 'event';
				}}>Event</button
			></TableHeadCell
		>
		<TableHeadCell class="px-2">Medals</TableHeadCell>
		<TableHeadCell class="px-2">Trial Status</TableHeadCell>
		<TableHeadCell class="px-2"
			><button
				on:click={() => {
					sortBy = 'scoresIn';
				}}>Scores In</button
			></TableHeadCell
		>
		<TableHeadCell class="px-2"
			><button
				on:click={() => {
					sortBy = 'auditTime';
				}}>Audited</button
			></TableHeadCell
		>
		<TableHeadCell class="px-2"
			><button
				on:click={() => {
					sortBy = 'exportTime';
				}}>Last Export</button
			></TableHeadCell
		>
		<TableHeadCell class="px-2">
			<span class="sr-only"> Histogram </span>
		</TableHeadCell>
	</svelte:fragment>
	<svelte:fragment slot="item" let:item={event}>
		<TableBodyCell class="py-0 px-2"
			><a href="/t/{$page.params.id}/events/{event.id}">{event.name}</a
			></TableBodyCell
		>
		<TableBodyCell class="py-0 px-2"
			>{event.medals ?? data.tournament.medals}</TableBodyCell
		>
		<TableBodyCell class="py-0 px-2"
			>{trialStatusDisplay[event.trialStatus]}</TableBodyCell
		>
		<TableBodyCell class="py-0 px-2"
			>{event.scores.length} / {data.teams.length}</TableBodyCell
		>
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

<Slides
	{generateFilename}
	generateSciolyFF={getSciolyFF}
	tournament={data.tournament}
	bind:this={slides}
/>

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

<Modal
	title="Results Preview"
	bind:open={showPreview}
	autoclose
	outsideclose
	size="xl"
>
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
			class="w-full h-[calc(100vh-200px)]"
			srcdoc={previewContent}
		/>
	{/await}
</Modal>

<Modal
	title="Publish to duosmium.org"
	bind:open={showPublish}
	autoclose
	outsideclose
	size="xl"
	classFooter="justify-end"
>
	<p class="sticky top-0 success !mt-0">
		Check the below preview, then hit "Publish" if everything looks correct.
		Additional publishes overwrite previous publishes. <strong
			>Once published, results can only be removed by a Duosmium admin.</strong
		>
	</p>
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
			class="w-full h-[calc(100vh-320px)]"
			srcdoc={previewContent}
		/>
	{/await}
	<svelte:fragment slot="footer">
		<div>
			<Checkbox bind:checked={exportHistos}>Export Histograms</Checkbox>
			<Checkbox bind:checked={markPrelim}>Mark as Preliminary</Checkbox>
		</div>
		<Button
			color="blue"
			disabled={selected.length !== events.length || !data.tournament.approved}
			on:click={() => {
				publishResults();
			}}>Publish</Button
		>
		<Button color="alternative">Cancel</Button>
	</svelte:fragment>
</Modal>

<Modal
	title="Publish Status"
	bind:open={showStatus}
	autoclose
	outsideclose
	size="sm"
>
	<p>
		Results are being published! You do not need to keep this window open, but
		it's helpful to check publishing status.
	</p>
	<Timeline order="vertical" class="ml-4">
		{#each publishStatus as [title, body, status]}
			<TimelineItem
				{title}
				classDiv="ring-0 bg-transparent dark:bg-transparent"
			>
				<svelte:fragment slot="icon">
					<span
						class="flex absolute -start-3 translate-y-0.5 justify-center items-center w-6 h-6 rounded-full"
					>
						{#if status === 'ok'}
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 24 24"
								fill="currentColor"
								class="size-6 text-green-500"
							>
								<path
									fill-rule="evenodd"
									d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z"
									clip-rule="evenodd"
								/>
							</svg>
						{:else if status === 'pending'}
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 24 24"
								fill="currentColor"
								class="size-6 text-blue-500 animate-spin"
							>
								<path
									fill-rule="evenodd"
									d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm0 8.625a1.125 1.125 0 1 0 0 2.25 1.125 1.125 0 0 0 0-2.25ZM15.375 12a1.125 1.125 0 1 1 2.25 0 1.125 1.125 0 0 1-2.25 0ZM7.5 10.875a1.125 1.125 0 1 0 0 2.25 1.125 1.125 0 0 0 0-2.25Z"
									clip-rule="evenodd"
								/>
							</svg>
						{:else}
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 24 24"
								fill="currentColor"
								class="size-6 text-red-500"
							>
								<path
									fill-rule="evenodd"
									d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm-1.72 6.97a.75.75 0 1 0-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 1 0 1.06 1.06L12 13.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L13.06 12l1.72-1.72a.75.75 0 1 0-1.06-1.06L12 10.94l-1.72-1.72Z"
									clip-rule="evenodd"
								/>
							</svg>
						{/if}
					</span>
				</svelte:fragment>
				{#if body}
					<p>{body}</p>
				{/if}
			</TimelineItem>
		{/each}
	</Timeline>
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

<style>
	button {
		text-transform: inherit;
	}
</style>
