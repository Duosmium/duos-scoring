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
		Heading,
		Modal,
		P,
		TableBodyCell,
		TableHeadCell,
		Tooltip
	} from 'flowbite-svelte';
	import { DownloadOutline, FileCopyOutline } from 'flowbite-svelte-icons';
	import { page } from '$app/stores';
	import yaml from 'js-yaml';
	import type { Tournament } from '@prisma/client';
	import { generatePdf, getColor, getImage } from '$lib/slides/gen';

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

	function generateSciolyFF() {
		const selectedEvents = new Set(selected.flatMap((e) => e.id));
		const sciolyffRep = {
			Tournament: {
				name: data.tournament.name,
				'short name': data.tournament.shortName ?? undefined,
				location: data.tournament.location,
				state: data.tournament.state,
				level:
					data.tournament.level.toUpperCase()[0] + data.tournament.level.toLowerCase().slice(1),
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

	let tournamentLogo = '';
	let tournamentLogoDimensions = [0, 0] as [number, number];
	let logoTextHeight = 1;
	let logoAwardsHeight = 1;
	let sidebarLineHeight = 0.5;
	let dividerOffset = 10;
	let titleFontSize = 48;
	let headerFontSize = 32;
	let sidebarFontSize = 16;
	let teamFontSize = 36;
	let teamLineHeight = 1.25;
	let themeBgColor = '#1f1b35';
	let themeTextColor = '#f5f5f5';
	let bgColor = '#fafafa';
	let textColor = '#212121';
	let headerTextColor = '#353535';
	let randomOrder = false;
	let combineTracks = false;
	let overallSchools = true;
	let defaultImage: [string, [number, number]] | undefined = undefined;
	let tournamentUrl =
		'https://www.duosmium.org/results/' + generateFilename(data.tournament).trim() + '/';
	let showSlides = false;
	let slidesURL = '';
	async function initializeSlides() {
		const sciolyff = generateSciolyFF();
		const filename = generateFilename(data.tournament).trim();

		themeBgColor = getColor(filename) || '#1f1b35';
		defaultImage = await getImage(filename);

		slidesURL = await generatePdf(sciolyff, undefined, {
			tournamentLogo: tournamentLogo || defaultImage?.[0] || '',
			tournamentLogoDimensions:
				!tournamentLogo && defaultImage ? defaultImage[1] : tournamentLogoDimensions,
			logoTextHeight,
			logoAwardsHeight,
			sidebarLineHeight,
			dividerOffset,
			titleFontSize,
			headerFontSize,
			sidebarFontSize,
			teamFontSize,
			teamLineHeight,
			themeBgColor,
			themeTextColor,
			bgColor,
			textColor,
			headerTextColor,
			randomOrder,
			combineTracks,
			overallSchools,
			tournamentUrl
		});
	}
	$: {
		if (showSlides) {
			generatePdf(generateSciolyFF(), undefined, {
				tournamentLogo: tournamentLogo || defaultImage?.[0] || '',
				tournamentLogoDimensions:
					!tournamentLogo && defaultImage ? defaultImage[1] : tournamentLogoDimensions,
				logoTextHeight,
				logoAwardsHeight,
				sidebarLineHeight,
				dividerOffset,
				titleFontSize,
				headerFontSize,
				sidebarFontSize,
				teamFontSize,
				teamLineHeight,
				themeBgColor,
				themeTextColor,
				bgColor,
				textColor,
				headerTextColor,
				randomOrder,
				combineTracks,
				overallSchools,
				tournamentUrl
			}).then((url) => {
				slidesURL = url;
			});
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
	"Preview" button to preview the results page, where you can download a PDF version. In order to
	select an event, the event must be marked as audited by a tournament director or scoremaster.</P
>

<Checkbox class="mb-4" bind:checked={exportHistos}>Export Histograms</Checkbox>

<SelectableTable items={events} bind:selected cols={7}>
	<svelte:fragment slot="buttons">
		<Button
			class="py-2 border border-green-700 hover:border-green-800 dark:border-green-600 dark:hover:border-green-700"
			color="green"
			on:click={() => {
				showPreview = true;
			}}>Preview</Button
		>
		<Button
			class="py-2 border border-purple-700 hover:border-purple-800 dark:border-purple-600 dark:hover:border-purple-700"
			color="purple"
			on:click={() => {
				showSlides = true;
			}}>Slides</Button
		>
		<ButtonGroup class="space-x-px">
			<Button color="blue" class="dark:hover:bg-blue-600 hover:bg-blue-700 !py-2" tag="div"
				>SciolyFF</Button
			>
			<Button outline color="blue" class="!p-2" on:click={copySciolyFF}
				><FileCopyOutline size="md" /></Button
			>
			<Button outline color="blue" class="!p-2" on:click={downloadSciolyFF}
				><DownloadOutline size="md" /></Button
			>
		</ButtonGroup>
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
		<Button color="alternative">Done</Button>
	</svelte:fragment>
</Modal>

<Modal title="Slides Preview" bind:open={showSlides} autoclose outsideclose size="xl">
	{#await initializeSlides()}
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
	{:then _}
		<details>
			<summary>Settings</summary>
			<label>
				Theme Background Color:
				<input type="color" bind:value={themeBgColor} />
			</label>
			<label>
				Theme Text Color:
				<input type="color" bind:value={themeTextColor} />
			</label>
			<label>
				Tournament Logo:
				<input type="file" id="tournamentLogo" accept="image/png,image/jpeg" />
			</label>
			<label>
				Clear Logo:
				<button id="clearLogo">Clear</button>
			</label>

			<details>
				<summary>Advanced</summary>
				<label>
					Header Text Color:
					<input type="color" bind:value={headerTextColor} />
				</label>
				<label>
					Text Color:
					<input type="color" bind:value={textColor} />
				</label>
				<label>
					Background Color:
					<input type="color" bind:value={bgColor} />
				</label>
				<label>
					Logo Height (Text Slides):
					<input type="number" bind:value={logoTextHeight} />
				</label>
				<label>
					Logo Height (Placement Slides):
					<input type="number" bind:value={logoAwardsHeight} />
				</label>
				<label>
					Title Font Size:
					<input type="number" bind:value={titleFontSize} />
				</label>
				<label>
					Header Font Size:
					<input type="number" bind:value={headerFontSize} />
				</label>
				<label>
					Sidebar Font Size:
					<input type="number" bind:value={sidebarFontSize} />
				</label>
				<label>
					Sidebar Line Height:
					<input type="number" bind:value={sidebarLineHeight} />
				</label>
				<label>
					Team Font Size:
					<input type="number" bind:value={teamFontSize} />
				</label>
				<label>
					Team Line Height:
					<input type="number" bind:value={teamLineHeight} />
				</label>
				<label>
					Divider Offset:
					<input type="number" bind:value={dividerOffset} />
				</label>
				<label
					>Shuffle Event Order:
					<input type="checkbox" bind:checked={randomOrder} />
				</label>
				<label
					>Combine Tracks:
					<input type="checkbox" bind:checked={combineTracks} />
				</label>
				<label
					>Rank Overall by Schools:
					<input type="checkbox" bind:checked={overallSchools} />
				</label>
			</details>
		</details>
		<iframe title="Slides Preview" class="w-full h-[calc(100vh-200px)]" src={slidesURL} />
	{/await}
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
			class="w-full h-[calc(100vh-200px)]"
			srcdoc={previewContent
				.replace('/main.css', 'https://www.duosmium.org/main.css')
				.replace('/main.js', 'https://www.duosmium.org/main.js')}
		/>
	{/await}
</Modal>

<style>
	label {
		display: block;
	}
	summary {
		cursor: pointer;
	}
</style>
