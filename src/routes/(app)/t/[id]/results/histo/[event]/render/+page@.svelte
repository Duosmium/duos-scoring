<script lang="ts">
	import { BarChart } from 'chartist';
	// @ts-ignore
	import ChartistAxisTitle from 'chartist-plugin-axistitle';
	import type { PageData } from './$types';
	import { browser } from '$app/environment';
	import './histo.scss';

	export let data: PageData;

	const histogramData = data.histograms
		? {
				start: data.histograms.start,
				width: data.histograms.width,
				count: data.histograms.counts
		  }
		: null;

	const labels = histogramData
		? histogramData.count.map((_, i) =>
				(histogramData.start + histogramData.width * i).toFixed(
					histogramData.width.toString().split('.')[1]?.length || 0
				)
		  )
		: null;

	let chart: HTMLDivElement;
	$: {
		if (browser && chart && histogramData && labels) {
			new BarChart(
				chart,
				{
					labels,
					series: [histogramData.count]
				},
				{
					plugins: [
						ChartistAxisTitle({
							axisX: {
								axisTitle: 'Score',
								offset: {
									x: 0,
									y: 46
								}
							},
							axisY: {
								axisTitle: 'Frequency',
								flipTitle: true,
								offset: {
									x: 0,
									y: -8
								}
							}
						})
					]
				}
			).on('draw', function (data) {
				if (data.type === 'bar') {
					data.element.attr({
						style: `stroke-width: ${100 / histogramData.count.length}%`
					});
				}
			});
		}
	}
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link href="https://fonts.googleapis.com/css2?family=Roboto&display=swap" rel="stylesheet" />
</svelte:head>

{#if data.histograms}
	<h1>{data.name}</h1>
	<div bind:this={chart} class="ct-chart ct-octave" />
	{#if data.histograms.info}
		<dl>
			{#each data.histograms.info as { key, value }}
				<div>
					<dt>{key}:</dt>
					<dd>{value}</dd>
				</div>
			{/each}
		</dl>
	{/if}
{:else if data.error}
	<div class="error">{data.error}</div>
{/if}
