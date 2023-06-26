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
		Toast,
		Avatar
	} from 'flowbite-svelte';
	import { page } from '$app/stores';
	import { slide } from 'svelte/transition';
	import { invalidateAll } from '$app/navigation';
	import type { TrialStatus } from '@prisma/client';

	export let data: PageData;

	const trialStatus = [
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
		events = events.filter((ev) => !ids.includes(ev.id.toString()));
		fetch(`/td/${$page.params['id']}/events`, {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				events: ids
			})
		}).then((res) => {
			if (res.status === 200) {
				addToastMessage('Events deleted!', 'success');
			} else {
				addToastMessage('Failed to delete events!', 'error');
			}
		});
	}

	function changeTrialStatus(id: bigint) {
		return (e: Event) => {
			const newStatus = (e.target as HTMLSelectElement).value;
			if (!newStatus) return;

			events = events.map((ev) =>
				ev.id === id ? { ...ev, trialStatus: newStatus as TrialStatus } : ev
			);

			fetch(`/td/${$page.params['id']}/events`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					event: id.toString(),
					trialStatus: newStatus
				})
			}).then((res) => {
				if (res.status === 200) {
					addToastMessage('Event status updated!', 'success');
					invalidateAll();
				} else {
					addToastMessage('Failed to update event status!', 'error');
				}
			});
		};
	}

	let showAddEvent = false;
	let addEventName = '';
	let addEventTrialStatus = 'SCORING';
	let addHighScoring = 'true';
	let addEventMedals = '';
	function openAddEvent() {
		showAddEvent = true;
		addEventName = '';
		addEventTrialStatus = 'SCORING';
		addHighScoring = 'true';
		addEventMedals = '';
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
				trialStatus: addEventTrialStatus,
				highScoring: addHighScoring,
				medals: parseInt(addEventMedals) || undefined
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

	let showEditEvent = false;
	let editEventName = '';
	let editEventTrialStatus = 'SCORING';
	let editHighScoring = 'true';
	let editEventMedals = '';
	let editEventId: bigint;
	function openEditEvent(event: bigint) {
		showEditEvent = true;
		const ev = events.find((ev) => ev.id === event);
		if (!ev) return;
		editEventId = ev.id;
		editEventName = ev.name;
		editEventTrialStatus = ev.trialStatus;
		editHighScoring = ev.highScoring ? 'true' : 'false';
		editEventMedals = ev.medals?.toString() || '';
	}
	function editEvent() {
		events = events.map((ev) =>
			ev.id === editEventId
				? {
						...ev,
						name: editEventName,
						trialStatus: editEventTrialStatus as any,
						highScoring: editHighScoring === 'true',
						medals: parseInt(editEventMedals) || undefined
				  }
				: ev
		);
		// TODO: validate event names for canonicalization
		fetch(`/td/${$page.params['id']}/events`, {
			method: 'PATCH',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				event: editEventId.toString(),
				name: editEventName,
				trialStatus: editEventTrialStatus,
				highScoring: editHighScoring,
				medals: parseInt(editEventMedals) || undefined
			})
		}).then((res) => {
			if (res.status === 200) {
				addToastMessage('Event edited!', 'success');
				invalidateAll();
			} else {
				addToastMessage('Failed to edit event!', 'error');
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

<div class="w-full flex justify-between flex-wrap mb-2">
	<Heading tag="h2" class="w-fit">Events</Heading>
	<span class="space-x-4">
		<Button color="green" on:click={openAddEvent}>Add Event</Button>
	</span>
</div>
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
		<TableHeadCell class="py-4 pl-4 pr-2">
			<Checkbox on:click={toggleAll} checked={selectAll} />
		</TableHeadCell>
		<TableHeadCell class="px-2">Event Name</TableHeadCell>
		<TableHeadCell class="px-2">Medals</TableHeadCell>
		<TableHeadCell class="px-2">Trial Status</TableHeadCell>
		<TableHeadCell class="px-2">Audited</TableHeadCell>
		<TableHeadCell class="px-2">Sorted</TableHeadCell>
		<TableHeadCell class="px-2">Scores In</TableHeadCell>
		<TableHeadCell class="px-2">ES & Volunteers</TableHeadCell>
		<TableHeadCell class="px-2">
			<span class="sr-only"> Edit </span>
		</TableHeadCell>
		<TableHeadCell class="px-2">
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
					<TableBodyCell class="py-4 pl-4 pr-2">
						<Checkbox
							on:click={() => {
								toggleCheck(event.id);
							}}
							checked={event.checked}
						/>
					</TableBodyCell>
					<TableBodyCell class="py-0 px-2">{event.name}</TableBodyCell>
					<TableBodyCell class="py-0 px-2">{event.medals ?? data.tournament.medals}</TableBodyCell>
					<TableBodyCell class="py-0 px-2">
						<Label>
							<span class="sr-only">Trial Status</span>
							<Select
								on:change={changeTrialStatus(event.id)}
								underline
								class="min-w-[5.25rem] !border-0"
								items={trialStatus}
								value={event.trialStatus}
							/>
						</Label>
					</TableBodyCell>
					<TableBodyCell class="py-0 px-2">
						<span class="flex">
							{#each event.audited as audited}
								<!-- TODO: name popover -->
								<Avatar stacked
									>{audited.name
										.split(' ')
										.map((w) => w[0].toUpperCase())
										.join('')}</Avatar
								>
							{:else}
								No
							{/each}
						</span>
					</TableBodyCell>
					<TableBodyCell class="py-0 px-2">
						<span class="flex">
							{#each event.sorted as sorted}
								<Avatar stacked
									>{sorted.name
										.split(' ')
										.map((w) => w[0].toUpperCase())
										.join('')}</Avatar
								>
							{:else}
								No
							{/each}
						</span>
					</TableBodyCell>
					<TableBodyCell class="py-0 px-2">{event.scores.length}</TableBodyCell>
					<TableBodyCell class="py-0 px-2"
						><span class="flex">
							{#each event.roles as { user }}
								<Avatar stacked
									>{user.name
										.split(' ')
										.map((w) => w[0].toUpperCase())
										.join('')}</Avatar
								>
							{:else}
								Not Assigned
							{/each}
						</span></TableBodyCell
					>
					<TableBodyCell class="py-0 px-2">
						<Button
							color="alternative"
							class="border-none p-1 font-medium text-primary-600 hover:underline dark:text-primary-500"
							on:click={() => {
								openEditEvent(event.id);
							}}
						>
							Edit
						</Button>
					</TableBodyCell>
					<TableBodyCell class="py-0 px-2">
						<a
							href="/td/{data.tournament.id}/events/{event.id.toString()}/"
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
			}}>Confirm</Button
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
		Trial Status
		<Select underline class="mt-2" items={trialStatus} bind:value={addEventTrialStatus} />
	</Label>
	<Label>
		High Scoring
		<Select underline class="mt-2" items={highScoring} bind:value={addHighScoring} />
	</Label>
	<Label>
		Medals (Optional)
		<Input class="mt-2" type="text" required bind:value={addEventMedals} />
	</Label>

	<svelte:fragment slot="footer">
		<Button color="green" disabled={addEventName === ''} on:click={addEvent}>Add Event</Button>
		<Button color="alternative">Cancel</Button>
	</svelte:fragment>
</Modal>

<Modal title="Edit Event" bind:open={showEditEvent} autoclose outsideclose>
	<Label>
		Event Name
		<Input
			class="mt-2"
			type="text"
			required
			placeholder="Anatomy and Physiology"
			bind:value={editEventName}
		/>
	</Label>
	<Label>
		Trial Status
		<Select underline class="mt-2" items={trialStatus} bind:value={editEventTrialStatus} />
	</Label>
	<Label>
		High Scoring
		<Select underline class="mt-2" items={highScoring} bind:value={editHighScoring} />
	</Label>
	<Label>
		Medals (Optional)
		<Input class="mt-2" type="text" required bind:value={editEventMedals} />
	</Label>

	<svelte:fragment slot="footer">
		<Button color="green" on:click={editEvent}>Save</Button>
		<Button color="alternative">Cancel</Button>
	</svelte:fragment>
</Modal>
