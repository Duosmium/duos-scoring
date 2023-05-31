<script lang="ts">
	import type { PageData } from './$types';
	import Head from '$lib/components/Head.svelte';

	export let data: PageData;
</script>

<Head
	title="{data.tournament.year} {data.tournament.shortName} {data.tournament
		.division} | Duosmium Scoring"
/>
<nav>
	<a href="/td/{data.tournament.id}/">General Info</a>
	<a href="/td/{data.tournament.id}/events">Events/Score Counseling</a>
	<a href="/td/{data.tournament.id}/teams">Teams</a>
	<a href="/td/{data.tournament.id}/results">Results</a>
</nav>
<main class="main">
	<header>
		<img src="/logo.png" alt="Duosmium Logo" />
		<a class="btn" href="/logout">Log Out</a>
	</header>
	<h1>{data.tournament.year} {data.tournament.shortName} {data.tournament.division}</h1>
	<slot />
</main>

<style>
	img {
		height: 84px;
	}
	header {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 36px;
		gap: 16px;
	}
</style>
