<script lang="ts">
	import type { PageData } from './$types';
	import Head from '$lib/components/Head.svelte';

	import {
		Table,
		TableBody,
		TableBodyCell,
		TableBodyRow,
		TableHead,
		TableHeadCell,
		Checkbox,
		Label,
		Select,
		Button,
		Heading,
		Modal,
		Input,
		Toast
	} from 'flowbite-svelte';
	import { page } from '$app/stores';
	import { slide } from 'svelte/transition';
	import { invalidateAll } from '$app/navigation';

	export let data: PageData;

	const scoringStatus = [
		{ value: 'SCORING', name: 'Scoring' },
		{ value: 'TRIAL', name: 'Trial' },
		{ value: 'TRIALED', name: 'Trialed' }
	];
	const highScoring = [
		{ value: 'true', name: 'High Score Wins' },
		{ value: 'false', name: 'Low Score Wins' }
	];

	let selectAll = false;
	$: events = data.tournament.events.map((ev, i) => ({ ...ev, index: i, checked: false }));

	let lastIndex = -1;
	function toggleCheck(id: bigint) {
		selectAll = false;
		if (!shiftDown) {
			lastIndex = events.findIndex((ev) => ev.id === id);
			events = events.map((ev) => (ev.id === id ? { ...ev, checked: !ev.checked } : ev));
		} else {
			const currentEvent = events.find((ev) => ev.id === id);
			if (!currentEvent) return;
			const currentIndex = currentEvent.index;
			const currentStatus = currentEvent.checked;
			const minIndex = Math.min(currentIndex, lastIndex);
			const maxIndex = Math.max(currentIndex, lastIndex);
			events = events.map((ev, i) =>
				i >= minIndex && i <= maxIndex ? { ...ev, checked: !currentStatus } : ev
			);
			lastIndex = currentIndex;
		}
	}

	function toggleAll() {
		selectAll = !selectAll;
		events = events.map((ev) => ({ ...ev, checked: selectAll }));
	}

	$: selected = events.filter((ev) => ev.checked);

	let shiftDown = false;
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Shift') {
			shiftDown = true;
		}
	}
	function handleKeyup(event: KeyboardEvent) {
		if (event.key === 'Shift') {
			shiftDown = false;
		}
	}

	let showConfirmDelete = false;
	let confirmDeleteText = '';
	function confirmDelete() {
		const ids = selected.map((ev) => ev.id.toString());
		fetch('.', {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				events: ids
			})
		}).then((res) => {
			if (res.status === 200) {
				events = events.filter((ev) => !ids.includes(ev.id.toString()));
				addToastMessage('Events deleted!', 'success');
			} else {
				addToastMessage('Failed to delete events!', 'error');
			}
		});
	}

	function changeStatus(id: bigint) {
		const event = events.find((ev) => ev.id === id);
		if (!event) return;

		fetch(`/td/${$page.params['id']}/events`, {
			method: 'PATCH',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				event: event.id.toString(),
				status: event.status
			})
		}).then((res) => {
			if (res.status === 200) {
				addToastMessage('Event status updated!', 'success');
			} else {
				addToastMessage('Failed to update event status!', 'error');
			}
		});
	}

	let showAddEvent = false;
	let addEventName = '';
	let addEventStatus = 'SCORING';
	let addHighScoring = 'true';
	function openAddEvent() {
		showAddEvent = true;
		addEventName = '';
		addEventStatus = 'SCORING';
		addHighScoring = 'true';
	}
	function addEvent() {
		// TODO: validate event names for canonicalization
		fetch(`/td/${$page.params['id']}/events`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				name: addEventName,
				status: addEventStatus,
				highScoring: addHighScoring
			})
		}).then((res) => {
			if (res.status === 200) {
				addToastMessage('Event added!', 'success');
				invalidateAll();
			} else {
				addToastMessage('Failed to add event!', 'error');
			}
		});
	}

	let messages: { text: string; type: 'success' | 'error' }[] = [];
	function addToastMessage(message: string, type: 'success' | 'error' = 'success') {
		messages = [...messages, { text: message, type }];
		setTimeout(() => {
			messages = messages.slice(1);
		}, 3000);
	}
</script>

<Head
	title="Events | {data.tournament.year} {data.tournament.shortName} {data.tournament
		.division} | Duosmium Scoring"
/>

<svelte:window on:keydown={handleKeydown} on:keyup={handleKeyup} />

<Heading tag="h2">Events</Heading>
{#if selected.length > 0}
	<div
		class="fixed bottom-12 left-1/2 -translate-x-1/2 bg-slate-300 dark:bg-slate-700 z-40 rounded-lg p-4 flex items-center space-x-4"
	>
		<span>{selected.length} selected</span>
		<Button
			size="sm"
			color="alternative"
			btnClass="bg-transparent border-none underline p-2"
			on:click={() => {
				events = events.map((ev) => ({ ...ev, checked: false }));
			}}>Clear</Button
		>
		<Button
			size="sm"
			color="red"
			on:click={() => {
				showConfirmDelete = true;
			}}>Delete</Button
		>
	</div>
{/if}
<Table divClass="relative overflow-x-auto" hoverable={true}>
	<!-- top-[92px] lg:top-[116px] -->
	<TableHead>
		<TableHeadCell class="!p-4">
			<Checkbox on:click={toggleAll} checked={selectAll} />
		</TableHeadCell>
		<TableHeadCell>Event Name</TableHeadCell>
		<TableHeadCell>Status</TableHeadCell>
		<TableHeadCell>Audited</TableHeadCell>
		<TableHeadCell>Sorted</TableHeadCell>
		<TableHeadCell>Scores In</TableHeadCell>
		<TableHeadCell>ES & Volunteers</TableHeadCell>
		<TableHeadCell>
			<span class="sr-only"> View </span>
		</TableHeadCell>
	</TableHead>
	<TableBody tableBodyClass="divide-y">
		{#if events.length === 0}
			<TableBodyRow>
				<p>No events have been added yet.</p>
				<!-- TODO: Add ability to add all events from current slate -->
			</TableBodyRow>
		{:else}
			{#each events as event}
				<TableBodyRow>
					<TableBodyCell class="!p-4">
						<Checkbox
							on:click={() => {
								toggleCheck(event.id);
							}}
							checked={event.checked}
						/>
					</TableBodyCell>
					<TableBodyCell>{event.name}</TableBodyCell>
					<TableBodyCell>
						<Label>
							<span class="sr-only">Status</span>
							<Select
								on:change={() => {
									changeStatus(event.id);
								}}
								underline
								class="mt-2"
								items={scoringStatus}
								bind:value={event.status}
							/>
						</Label>
					</TableBodyCell>
					<!-- TODO: change these placeholders -->
					<TableBodyCell>[Audited Placeholder]</TableBodyCell>
					<TableBodyCell>[Sorted Placeholder]</TableBodyCell>
					<TableBodyCell>[Scores In Placeholder]</TableBodyCell>
					<TableBodyCell>[ES Placeholder]</TableBodyCell>
					<TableBodyCell>
						<a
							href="/td/{data.tournament.id}/events/{event.slug}/"
							class="font-medium text-primary-600 hover:underline dark:text-primary-500"
						>
							View
						</a>
					</TableBodyCell>
				</TableBodyRow>
			{/each}
		{/if}
	</TableBody>
</Table>
<div class="w-full flex justify-items-end mt-8">
	<Button color="green" class="block ml-auto" on:click={openAddEvent}>Add Event</Button>
</div>

<div class="fixed bottom-8 right-8 flex flex-col space-y-4">
	{#each messages as message}
		<Toast color={message.type === 'success' ? 'green' : 'red'} transition={slide}>
			<svelte:fragment slot="icon">
				{#if message.type === 'success'}
					<svg
						aria-hidden="true"
						class="w-5 h-5"
						fill="currentColor"
						viewBox="0 0 20 20"
						xmlns="http://www.w3.org/2000/svg"
						><path
							fill-rule="evenodd"
							d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
							clip-rule="evenodd"
						/></svg
					>
					<span class="sr-only">Check icon</span>
				{:else}
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 20 20"
						fill="currentColor"
						class="w-5 h-5"
					>
						<path
							d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"
						/>
					</svg>
					<span class="sr-only">X icon</span>
				{/if}
			</svelte:fragment>
			{message.text}
		</Toast>
	{/each}
</div>

<Modal
	title="Delete Events"
	bind:open={showConfirmDelete}
	autoclose
	outsideclose
	on:close={() => {
		confirmDeleteText = '';
	}}
>
	<p class="text-base leading-relaxed text-gray-500 dark:text-gray-400">
		Are you sure you want to delete {selected.length} event{selected.length > 1 ? 's' : ''}? This
		action cannot be undone.
	</p>
	<Label>
		Type "confirm" to delete these events.
		<Input class="mt-2" type="text" required placeholder="confirm" bind:value={confirmDeleteText} />
	</Label>
	<svelte:fragment slot="footer">
		<Button
			color="red"
			disabled={confirmDeleteText !== 'confirm'}
			on:click={() => {
				if (confirmDeleteText === 'confirm') {
					confirmDelete();
					confirmDeleteText = '';
				}
			}}>I accept</Button
		>
		<Button color="alternative">Cancel</Button>
	</svelte:fragment>
</Modal>

<Modal title="Add Events" bind:open={showAddEvent} autoclose outsideclose>
	<Label>
		Event Name
		<Input
			class="mt-2"
			type="text"
			required
			placeholder="Anatomy and Physiology"
			bind:value={addEventName}
		/>
	</Label>
	<Label>
		Status
		<Select underline class="mt-2" items={scoringStatus} bind:value={addEventStatus} />
	</Label>
	<Label>
		High Scoring
		<Select underline class="mt-2" items={highScoring} bind:value={addHighScoring} />
	</Label>

	<svelte:fragment slot="footer">
		<Button color="green" disabled={addEventName === ''} on:click={addEvent}>Add Event</Button>
		<Button color="alternative">Cancel</Button>
	</svelte:fragment>
</Modal>
