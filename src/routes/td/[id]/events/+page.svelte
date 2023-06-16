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
		Input
	} from 'flowbite-svelte';

	export let data: PageData;

	const scoringStatus = [
		{ value: 'SCORING', name: 'Scoring' },
		{ value: 'TRIAL', name: 'Trial' },
		{ value: 'TRIALED', name: 'Trialed' }
	];

	let selectAll = false;
	let events = data.tournament.events.map((ev, i) => ({ ...ev, index: i, checked: false }));

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
		const ids = selected.map((ev) => ev.id);
		fetch('.', {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				events: ids
			})
		});
	}

	function changeStatus(id: bigint) {
		const event = events.find((ev) => ev.id === id);
		if (!event) return;

		fetch('.', {
			method: 'PATCH',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				event: event.id,
				status: event.status
			})
		});
	}

	let showAddEvent = false;
	function addEvent(name: string, status: string) {}
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
		<TableBodyRow>
			<TableBodyCell colspan={8}>
				<Button color="green" class="block ml-auto">Add Event</Button>
			</TableBodyCell>
		</TableBodyRow>
	</TableBody>
</Table>

<Modal
	title="Confirm Deleting Events"
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
				}
			}}>I accept</Button
		>
		<Button color="alternative">Cancel</Button>
	</svelte:fragment>
</Modal>

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
				}
			}}>I accept</Button
		>
		<Button color="alternative">Cancel</Button>
	</svelte:fragment>
</Modal>
