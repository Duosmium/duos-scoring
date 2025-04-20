<script lang="ts">
	import type { PageData } from './$types';
	import Head from '$lib/components/Head.svelte';
	import { A, Heading, P } from 'flowbite-svelte';
	import { page } from '$app/stores';
	import { addToastMessage } from '$lib/components/Toasts.svelte';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import TournamentCard from './TournamentCard.svelte';
	import { seasonYear } from '$lib/sciolyffHelpers';

	export let data: PageData;

	const errorParam = $page.url.searchParams.get('error');
	if (errorParam) {
		$page.url.searchParams.delete('error');
		if (browser) goto($page.url, { replaceState: true, keepFocus: true });
		addToastMessage(errorParam, 'error');
	}

	$: data.user.roles = data.user.roles.sort(
		(a, b) =>
			b.tournament.startDate.valueOf() - a.tournament.startDate.valueOf() ||
			a.tournament.name.localeCompare(b.tournament.name) ||
			a.tournament.division.localeCompare(b.tournament.division)
	);
	$: upcoming = data.user.roles
		.filter((r) => r.tournament.startDate > new Date(Date.now() - 172800000)) // 48 hrs
		.sort(
			(a, b) =>
				a.tournament.startDate.valueOf() - b.tournament.startDate.valueOf()
		);
	$: thisSeason = data.user.roles.filter(
		(r) =>
			r.tournament.startDate <= new Date(Date.now() - 129600000) &&
			r.tournament.year === seasonYear(new Date())
	);
	$: pastSeasons = data.user.roles.filter(
		(r) => r.tournament.year < seasonYear(new Date())
	);
</script>

<Head title="Dashboard | Duosmium Scoring" />

<Heading tag="h1" class="mb-12">Welcome, {data.user.name}!</Heading>

{#if data.user.roles.length === 0}
	<P
		>You have no tournaments. You can create a new tournament with the above
		link, or contact your tournament director for an invite to an existing
		tournament.</P
	>
{:else}
	<Heading tag="h2" class="mb-8">Upcoming Tournaments</Heading>
	<div class="grid">
		{#each upcoming as role}
			<TournamentCard {role} />
		{:else}
			<P>No upcoming tournaments!</P>
		{/each}
	</div>

	<Heading tag="h2" class="my-8">Past Tournaments</Heading>
	<div class="grid">
		{#each thisSeason as role}
			<TournamentCard {role} />
		{:else}
			<P>No past tournaments!</P>
		{/each}
	</div>

	<Heading tag="h2" class="mt-8 mb-4">Past Seasons</Heading>
	<details>
		<summary class="mb-4">Expand</summary>
		<div class="grid">
			{#each pastSeasons as role}
				<TournamentCard {role} />
			{:else}
				<P>No past tournaments!</P>
			{/each}
		</div>
	</details>
{/if}

<style>
	.grid {
		display: grid;
		gap: 16px;
		grid-template-columns: repeat(auto-fill, minmax(min(400px, 100%), 1fr));
	}
</style>
