<script lang="ts">
	import type { PageData } from './$types';
	import Head from '$lib/components/Head.svelte';

	export let data: PageData;
</script>

<Head title="Dashboard | Duosmium Scoring" />

<main class="main">
	<header>
		<img class="dark:hidden inline-block" src="/logo_dark.png" alt="Duosmium Logo" />
		<img class="dark:inline-block hidden" src="/logo_light.png" alt="Duosmium Logo" />
		<a class="btn" href="/logout">Log Out</a>
	</header>
	<h1>Account Settings</h1>

	<!-- TODO: implement this -->
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
