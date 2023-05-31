<script lang="ts">
	import type { PageData } from './$types';
	import Head from '$lib/components/Head.svelte';

	export let data: PageData;
</script>

<Head title="Dashboard | Duosmium Scoring" />

<main class="main">
	<header>
		<img src="/logo.png" alt="Duosmium Logo" />
		<a class="btn" href="/logout">Log Out</a>
	</header>
	<h1>Welcome {data.user.name}!</h1>

	<h2>Your Tournaments</h2>
	{#if data.user.tournaments.length === 0}
		<p>You have no tournaments. <a href="/new">Create one?</a></p>
	{:else}
		{#each data.user.tournaments as { tournament, roles }}
			<h3>{tournament.name}</h3>
			<ul>
				{#each roles as role}
					{#if role.role === 'DIRECTOR'}
						<li><a href="/td/{tournament.id}/">TD Dashboard</a></li>
					{:else if (role.role === 'LEAD_ES' || role.role === 'VOLUNTEER') && role.event}
						<li>
							<a href="/es/{tournament.id}/{role.event.slug}/">{role.event.name} Dashboard</a>
						</li>
					{/if}
				{/each}
			</ul>
		{/each}
	{/if}
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
