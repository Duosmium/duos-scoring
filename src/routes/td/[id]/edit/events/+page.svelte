<script lang="ts">
	import type { PageData } from './$types';
	import Head from '$lib/components/Head.svelte';

	export let data: PageData;

	let newEvents: number[] = [];

	function deleteEvent(event: bigint) {
		if (confirm('Are you sure you want to delete this event?')) {
			fetch(`?event=${event}`, { method: 'DELETE' })
				.then((res) => {
					if (res.ok) {
						location.reload();
					} else {
						alert('An error occurred while deleting the event.');
					}
				})
				.catch(() => alert('An error occurred while deleting the event.'));
		}
	}
</script>

<Head
	title="Edit Events | {data.tournament.year} {data.tournament.shortName ??
		data.tournament.name} {data.tournament.division} | Duosmium Scoring"
/>

<h2>Events</h2>

<form method="post">
	<ul>
		{#each data.tournament.events.slice().sort((a, b) => a.name.localeCompare(b.name)) as event}
			<li>
				<input type="text" name="{event.id}_name" value={event.name} />
				<select name="{event.id}_status" value={event.status}>
					<option value="SCORING">Scoring</option>
					<option value="TRIAL">Trial</option>
					<option value="TRIALED">Trialed</option>
				</select>
				<button type="button" on:click={() => deleteEvent(event.id)}>Delete</button>
				<input type="hidden" name="event" value={event.id} />
			</li>
		{:else}
			<li>No events found.</li>
			<input type="hidden" name="addEvents" value="true" />
			<button type="submit"
				>Add {data.tournament.year} Division {data.tournament.division} events!</button
			>
		{/each}
		{#if data.tournament.events.length > 0}
			{#each newEvents as event}
				<li>
					<input type="text" name="new{event}_name" />
					<select name="new{event}_status">
						<option value="SCORING">Scoring</option>
						<option value="TRIAL">Trial</option>
						<option value="TRIALED">Trialed</option>
					</select>
					<button type="button" on:click={() => (newEvents = newEvents.filter((e) => e !== event))}
						>Delete</button
					>
					<input type="hidden" name="event" value="new{event}" />
				</li>
			{/each}
			<button type="button" on:click={() => (newEvents = [...newEvents, newEvents.length])}
				>Add event</button
			>
			<button type="submit">Save</button>
		{/if}
	</ul>
</form>
