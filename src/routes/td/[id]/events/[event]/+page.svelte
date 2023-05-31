<script lang="ts">
	import type { PageData } from './$types';
	import Head from '$lib/components/Head.svelte';
	import { page } from '$app/stores';

	export let data: PageData;
</script>

<Head
	title="Results | {data.tournament.year} {data.tournament.shortName} {data.tournament
		.division} | Duosmium Scoring"
/>

<h2>{$page.params.event}</h2>
