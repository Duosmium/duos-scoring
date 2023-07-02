<script lang="ts">
	import type { PageData } from './$types';
	import Head from '$lib/components/Head.svelte';

	export let data: PageData;
</script>

<Head title="Dashboard | Duosmium Scoring" />

<h1>Welcome {data.user.name}!</h1>

<h2>Your Tournaments</h2>
{#if data.user.roles.length === 0}
	<p>You have no tournaments. <a href="/new">Create one?</a></p>
{:else}
	{#each data.user.roles as role}
		<h3>{role.tournament.name}</h3>
		<ul>
			{#if role.isDirector}
				<li><a href="/t/{role.tournament.id}/">TD Dashboard</a></li>
			{:else}
				{#each role.supEvents as event}
					<li>
						<a href="/t/{role.tournament.id}/events/{event.id}/">{event.name} Dashboard</a>
					</li>
				{:else}
					<li>The tournament director has not assigned you a role yet.</li>
				{/each}
			{/if}
		</ul>
	{/each}
{/if}

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
