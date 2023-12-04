<script lang="ts">
	import type { PageData } from './$types';
	import Head from '$lib/components/Head.svelte';
	import { A, Button, Card, Heading, Li, List, P } from 'flowbite-svelte';

	export let data: PageData;
</script>

<Head title="Dashboard | Duosmium Scoring" />

<Heading tag="h1" class="mb-12">Welcome {data.user.name}!</Heading>

<Heading tag="h2" class="mb-8">Your Tournaments</Heading>
{#if data.user.roles.length === 0}
	<P>You have no tournaments. <a href="/new">Create one?</a></P>
{:else}
	<div class="grid">
		{#each data.user.roles as role}
			<Card size="md">
				<Heading tag="h3" customSize="text-md" class="mb-6">{role.tournament.name}</Heading>
				{#if role.role === 'TD'}
					<Button href="/t/{role.tournament.id}/">Tournament Director Dashboard</Button>
				{:else if role.role === 'SM'}
					<Button href="/t/{role.tournament.id}/">Scoremaster Dashboard</Button>
				{:else}
					<List tag="ul">
						{#each role.supEvents as event}
							<Li>
								<A href="/t/{role.tournament.id}/events/{event.id}/">{event.name} Dashboard</A>
							</Li>
						{:else}
							<Li>The tournament director has not assigned you a role yet.</Li>
						{/each}
					</List>
				{/if}
			</Card>
		{/each}
	</div>
{/if}

<style>
	.grid {
		display: grid;
		gap: 16px;
		grid-template-columns: repeat(auto-fill, minmax(min(400px, 100%), 1fr));
	}
</style>
