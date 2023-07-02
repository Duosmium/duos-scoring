<script lang="ts">
	import type { PageData } from './$types';
	import Head from '$lib/components/Head.svelte';

	export let data: PageData;
</script>

<Head title="Dashboard | Duosmium Scoring" />

<h1>Account Settings</h1>

<!-- TODO: implement this -->

<style>
	h2 {
		margin-top: 32px;
		margin-bottom: 12px;
	}
	p {
		margin-top: 16px;
		margin-bottom: 4px;
	}
	ul li + li {
		margin-top: 8px;
	}
</style>
