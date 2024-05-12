<script lang="ts">
	import { generatePdf } from '$lib/slides/gen';
	import { onMount } from 'svelte';
	import sciolyff from './test';
	import FullscreenPdf from '$lib/components/FullscreenPdf.svelte';

	let viewer: FullscreenPdf;

	let slidesURL = '';
	onMount(async () => {
		slidesURL = await generatePdf(sciolyff, undefined, {
			tournamentLogo: '',
			tournamentLogoDimensions: [0, 0] as [number, number],
			logoTextHeight: 1,
			logoAwardsHeight: 1,
			sidebarLineHeight: 0.5,
			dividerOffset: 10,
			titleFontSize: 48,
			headerFontSize: 32,
			sidebarFontSize: 16,
			teamFontSize: 36,
			teamLineHeight: 1.25,
			themeBgColor: '#043862',
			themeTextColor: '#f5f5f5',
			bgColor: '#fafafa',
			textColor: '#212121',
			headerTextColor: '#353535',
			randomOrder: false,
			combineTracks: false,
			separateTracks: false,
			overallSchools: true,
			overallPoints: true,
			eventsOnly: false,
			tournamentUrl: '',
			qrCode: true
		});
	});

	$: viewer?.appendPdf(slidesURL);
</script>

{#if slidesURL === ''}
	<p>Loading...</p>
{:else}
	<FullscreenPdf bind:this={viewer} src={slidesURL}></FullscreenPdf>
{/if}
