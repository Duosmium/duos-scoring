<script lang="ts">
	import { Modal } from 'flowbite-svelte';
	import { addToastMessage } from '$lib/components/Toasts.svelte';

	import { page } from '$app/stores';
	import { generatePdf, getColor, getImage } from '$lib/slides/gen';
	import printable from '$lib/slides/printable';
	import type { Slides, Tournament } from '@prisma/client';
	import FullscreenPdf from '$lib/components/FullscreenPdf.svelte';
	import type { RealtimeChannel } from '@supabase/supabase-js';

	export let tournament: Tournament;
	export let generateFilename: (tournament: Tournament) => string;
	export let generateSciolyFF: (events?: bigint[]) => string;

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
	let separateTracks = false;
	let overallSchools = true;
	let overallPoints = true;
	let eventsOnly = false;
	let defaultImage: [string, [number, number]] | undefined = undefined;
	let tournamentUrl =
		'https://www.duosmium.org/results/' + generateFilename(tournament).trim() + '/';
	let qrCode = true;
	let showSlidesPreview = false;
	let slidesURL = '';
	const currentSettings = () => ({
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
		separateTracks,
		overallSchools,
		overallPoints,
		eventsOnly,
		tournamentUrl,
		qrCode
	});
	async function initializeSlidesPreview() {
		const sciolyff = generateSciolyFF();
		const filename = generateFilename(tournament).trim();

		themeBgColor = getColor(filename) || '#1f1b35';
		defaultImage = await getImage(filename);

		slidesURL = await generatePdf(sciolyff, undefined, currentSettings());
	}
	$: {
		if (showSlidesPreview) {
			generatePdf(generateSciolyFF(), undefined, currentSettings()).then((url) => {
				slidesURL = url;
			});
		}
	}

	function saveSlidesSettings() {
		fetch(`/t/${$page.params.id}/results/slides`, {
			method: 'PATCH',
			body: JSON.stringify(currentSettings())
		}).then((res) => {
			if (res.status === 200) {
				addToastMessage('Settings saved!', 'success');
			}
		});
	}

	let showPrintable = false;
	let reversePrintable = true;
	let printableHtml = '';
	$: {
		if (showPrintable) {
			printableHtml = printable(generateSciolyFF(), '', {
				combineTracks,
				separateTracks,
				overallSchools,
				reverse: reversePrintable,
				contentOnly: false
			});
		}
	}

	export const setPrintable = (value: boolean) => {
		showPrintable = value;
	};
	export const setPreview = (value: boolean) => {
		showSlidesPreview = value;
	};

	let broadcastChannel: RealtimeChannel | undefined;
	let viewer: FullscreenPdf;
	let batchIndex = 0;
	const fetchLatestBatches = async () => {
		const resp = await fetch(`/t/${$page.params.id}/results/slides`);
		const data: Slides = await resp.json();

		if (!data.batches || data.batches?.length <= batchIndex) return;

		const events = data.batches
			.filter((_, i, s) => i >= batchIndex && (data.done ? i < s.length - 1 : true))
			.flat();

		if (events) {
			const sciolyff = generateSciolyFF(events);
			const slides = await generatePdf(sciolyff, undefined, currentSettings(), ['events']);
			viewer.appendPdf(slides);
		}
		if (data.done) {
			const sciolyff = generateSciolyFF(data.batches.slice(-1)[0]);
			const slides = await generatePdf(sciolyff, undefined, currentSettings(), [
				'overall',
				'closing'
			]);
			viewer.appendPdf(slides);
		}

		batchIndex = data.batches.length;
	};

	export const startPresentation = async (events: bigint[]) => {
		const sciolyff = generateSciolyFF(events);
		const slides = await generatePdf(sciolyff, undefined, currentSettings(), ['intro', 'events']);
		viewer.appendPdf(slides);
		viewer.enterFullScreen();

		const resp = await fetch(`/t/${$page.params.id}/results/slides`, {
			method: 'PUT',
			body: JSON.stringify({ events: events.map((e) => e.toString()) })
		});
		const channelId = await resp.text();

		broadcastChannel = $page.data.supabase.channel(channelId);
		broadcastChannel
			.on('broadcast', { event: 'update' }, () => {
				console.log('Received update event');
				fetchLatestBatches();
			})
			.subscribe();
	};

	export const resumePresentation = async () => {
		viewer.enterFullScreen();
	};

	export const addBatch = async (events: bigint[], done?: boolean) => {
		const resp = await fetch(`/t/${$page.params.id}/results/slides`, {
			method: 'PUT',
			body: JSON.stringify({ events: events.map((e) => e.toString()), done })
		});
		if (resp.status == 200) {
			addToastMessage('Events pushed!', 'success');
		} else {
			addToastMessage('Failed to push events!', 'error');
		}
	};

	export const stopPresentation = async () => {
		if (broadcastChannel) {
			broadcastChannel.unsubscribe();
			broadcastChannel = undefined;
		}
		const resp = await fetch(`/t/${$page.params.id}/results/slides`, {
			method: 'DELETE'
		});
		if (resp.status == 200) {
			addToastMessage('Presentation stopped!', 'success');
		} else {
			addToastMessage('Failed to stop presentation!', 'error');
		}
	};
</script>

<Modal title="Slides Preview" bind:open={showSlidesPreview} autoclose outsideclose size="xl">
	{#await initializeSlidesPreview()}
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
			<label>
				Enable QR code for full results:
				<input type="checkbox" id="qrCode" bind:checked={qrCode} />
			</label>

			<details>
				<summary>Advanced</summary>
				<label>
					Include Event Slides Only:
					<input type="checkbox" bind:checked={eventsOnly} />
				</label>
				<label>
					Shuffle Event Order:
					<input type="checkbox" bind:checked={randomOrder} />
				</label>
				<label>
					Score Tracks Together:
					<input type="checkbox" bind:checked={combineTracks} />
				</label>
				<label>
					Group Events By Track:
					<input type="checkbox" bind:checked={separateTracks} />
				</label>
				<label>
					Rank Overall by Schools:
					<input type="checkbox" bind:checked={overallSchools} />
				</label>
				<label>
					Display Overall Point Totals:
					<input type="checkbox" bind:checked={overallPoints} />
				</label>

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
			</details>
		</details>
		<iframe title="Slides Preview" class="w-full h-[calc(100vh-200px)]" src={slidesURL} />
	{/await}
</Modal>

<Modal title="Printable Medals List" bind:open={showPrintable} autoclose outsideclose size="xl">
	<details>
		<summary>Settings</summary>
		<label
			>Rank Overall By Schools:
			<input type="checkbox" bind:checked={overallSchools} />
		</label>
		<label
			>Score Tracks Together:
			<input type="checkbox" bind:checked={combineTracks} />
		</label>
		<label
			>Group Events By Track:
			<input type="checkbox" bind:checked={separateTracks} />
		</label>
		<label
			>Reverse Medal Order:
			<input type="checkbox" bind:checked={reversePrintable} />
		</label>
	</details>
	<iframe
		title="Printable Medals List"
		class="w-full h-[calc(100vh-200px)]"
		srcdoc={printableHtml}
	/>
</Modal>

<FullscreenPdf bind:this={viewer}></FullscreenPdf>

<style>
	label {
		display: block;
	}
	summary {
		cursor: pointer;
	}
</style>
