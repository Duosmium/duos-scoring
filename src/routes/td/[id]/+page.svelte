<script lang="ts">
	import type { PageData } from './$types';
	import Head from '$lib/components/Head.svelte';

	export let data: PageData;
</script>

<Head
	title="TD Dashboard | {data.tournament.year} {data.tournament.shortName} {data.tournament
		.division} | Duosmium Scoring"
/>

<a href="/td/{data.tournament.id}/edit">Edit</a>
