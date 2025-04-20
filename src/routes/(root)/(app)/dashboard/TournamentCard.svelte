<script lang="ts">
	import type { getUserInfo } from '$lib/server/db';
	import { A, Button, Card, Heading, Li, List, P } from 'flowbite-svelte';

	export let role: Exclude<
		Awaited<ReturnType<typeof getUserInfo>>,
		false
	>['roles'][number];
</script>

<Card size="md">
	<div class="flex-1 flex flex-col justify-center">
		<Heading tag="h3" customSize="text-md" class="mb-2"
			>{role.tournament.year}
			{role.tournament.name}
			{role.tournament.division}</Heading
		>
		<P class="mb-0"
			>{role.tournament.startDate.toUTCString() ===
			role.tournament.endDate.toUTCString()
				? role.tournament.startDate
						.toUTCString()
						.split(' ')
						.slice(0, 4)
						.join(' ')
				: role.tournament.startDate
						.toUTCString()
						.split(' ')
						.slice(0, 4)
						.join(' ') +
					' – ' +
					role.tournament.endDate
						.toUTCString()
						.split(' ')
						.slice(0, 4)
						.join(' ')}
			<br />
			@ {role.tournament.location}
		</P>
	</div>
	{#if role.supEvents.length > 0}
		<Heading tag="h4" class="mt-4">Events</Heading>
		<List tag="ul">
			{#each role.supEvents as event}
				<Li>
					<A href="/t/{role.tournament.id}/events/{event.id}/"
						>{event.name} Dashboard</A
					>
				</Li>
			{/each}
		</List>
	{:else if role.role === 'ES'}
		<List tag="ul" class="mt-4">
			<Li>The tournament director has not assigned you a role yet.</Li>
		</List>
	{/if}
	{#if role.role === 'TD'}
		<Button href="/t/{role.tournament.id}/" class="mt-6"
			>Tournament Director Dashboard</Button
		>
	{:else if role.role === 'SM'}
		<Button href="/t/{role.tournament.id}/" class="mt-6"
			>Scoremaster Dashboard</Button
		>
	{/if}
</Card>
