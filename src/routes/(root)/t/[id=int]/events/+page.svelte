<script lang="ts">
	import type { PageData } from './$types';
	import Head from '$lib/components/Head.svelte';

	import {
		TableBodyCell,
		TableHeadCell,
		Label,
		Select,
		Button,
		Heading,
		Modal,
		Input,
		Avatar,
		Tooltip,
		P,
		List,
		Li,
		Checkbox
	} from 'flowbite-svelte';
	import type { TrialStatus } from '$drizzle/types';
	import { addToastMessage } from '$lib/components/Toasts.svelte';
	import SelectableTable from '$lib/components/SelectableTable.svelte';
	import ConfirmModal from '$lib/components/ConfirmModal.svelte';

	import checklists from '$lib/checklists/checklists';
	import currentEvents from '$lib/data/currentEvents';
	import { sendData } from '../helpers';

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

	$: roles = data.roles;

	$: events = data.events;
	let selected: typeof events = [];

	let showConfirmDelete = false;
	function confirmDelete() {
		const ids = selected.map((ev) => ev.id.toString());
		events = events.filter((ev) => !ids.includes(ev.id.toString()));
		sendData({
			method: 'DELETE',
			body: {
				events: ids
			},
			msgs: {
				info: 'Deleting events...',
				success: 'Events deleted!',
				error: 'Failed to delete events!'
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

			sendData({
				method: 'PATCH',
				body: {
					event: id.toString(),
					trialStatus: newStatus
				},
				msgs: {
					info: 'Updating event status...',
					success: 'Event status updated!',
					error: 'Failed to update event status!'
				}
			});
		};
	}

	let showAddAll = false;
	function addAllEvents() {
		if (data.tournament.division == 'A') {
			addToastMessage('Cannot add all events to division A!', 'error');
			return;
		}
		sendData({
			method: 'PUT',
			multiple: true,
			body: currentEvents[data.tournament.division].map(
				([eventName, highScoring]) => ({
					name: eventName,
					trialStatus: 'SCORING',
					highScoring: highScoring.toString()
				})
			),
			msgs: {
				info: 'Adding events...',
				success: 'Events added!',
				error: 'Failed to add events!'
			}
		});
	}

	let showAddEvent = false;
	let addEventName = '';
	let addEventTrialStatus = 'SCORING';
	let addHighScoring = 'true';
	let addEnableChecklist = false;
	let addEventMedals = '';
	function openAddEvent() {
		showAddEvent = true;
		addEventName = '';
		addEventTrialStatus = 'SCORING';
		addHighScoring = 'true';
		addEnableChecklist = false;
		addEventMedals = '';
	}
	function addEvent() {
		// TODO: validate event names for canonicalization
		sendData({
			method: 'PUT',
			body: {
				name: addEventName,
				trialStatus: addEventTrialStatus,
				highScoring: addHighScoring,
				enableChecklist: addEnableChecklist,
				medals: parseInt(addEventMedals) || undefined
			},
			msgs: {
				info: 'Adding event...',
				success: 'Event added!',
				error: 'Failed to add event!'
			}
		});
	}

	let showEditEvent = false;
	let editEventName = '';
	let editEventTrialStatus = 'SCORING';
	let editHighScoring = 'true';
	let editEnableChecklist = false;
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
		editEnableChecklist = ev.enableChecklist;
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
						enableChecklist: editEnableChecklist,
						medals: parseInt(editEventMedals) || null
					}
				: ev
		);
		// TODO: validate event names for canonicalization
		sendData({
			method: 'PATCH',
			body: {
				event: editEventId.toString(),
				name: editEventName,
				trialStatus: editEventTrialStatus,
				highScoring: editHighScoring,
				enableChecklist: editEnableChecklist,
				medals: parseInt(editEventMedals) || undefined
			},
			msgs: {
				info: 'Updating event...',
				success: 'Event edited!',
				error: 'Failed to edit event!'
			}
		});
	}
</script>

<Head
	title="Events | {data.tournament.year} {data.tournament.shortName} {data
		.tournament.division} | Duosmium Scoring"
/>

<div class="w-full flex justify-between flex-wrap mb-2">
	<Heading tag="h2" class="w-fit">Events</Heading>
	<span class="space-x-4">
		<Button color="green" on:click={openAddEvent}>Add Event</Button>
		{#if events.length === 0 && data.tournament.division !== 'A'}
			<Button
				color="green"
				on:click={() => {
					showAddAll = true;
				}}>Add All Events</Button
			>
		{/if}
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
	</div>
{/if}
<SelectableTable items={events} bind:selected cols={10}>
	<svelte:fragment slot="buttons">
		<Button
			size="sm"
			color="red"
			on:click={() => {
				showConfirmDelete = true;
			}}>Delete</Button
		>
	</svelte:fragment>
	<svelte:fragment slot="headers">
		<TableHeadCell class="px-2">Event Name</TableHeadCell>
		<TableHeadCell class="px-2">Medals</TableHeadCell>
		<TableHeadCell class="px-2">Trial Status</TableHeadCell>
		<TableHeadCell class="px-2">Locked</TableHeadCell>
		<TableHeadCell class="px-2">Audited</TableHeadCell>
		<TableHeadCell class="px-2">Scores In</TableHeadCell>
		<TableHeadCell class="px-2">ES & Volunteers</TableHeadCell>
		<TableHeadCell class="px-2">
			<span class="sr-only"> Edit </span>
		</TableHeadCell>
		<TableHeadCell class="px-2">
			<span class="sr-only"> View </span>
		</TableHeadCell>
	</svelte:fragment>
	<svelte:fragment slot="item" let:item={event}>
		<TableBodyCell class="py-0 px-2">
			<a href="/t/{data.tournament.id}/events/{event.id.toString()}/"
				>{event.name}</a
			>
		</TableBodyCell>
		<TableBodyCell class="py-0 px-2"
			>{event.medals ?? data.tournament.medals}</TableBodyCell
		>
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
		<TableBodyCell class="py-0 px-2"
			>{event.locked ? 'Yes' : 'No'}</TableBodyCell
		>
		<TableBodyCell class="py-0 px-2">
			{#if event.audited}
				<Avatar class={`user_${event.audited.id} -ml-2`}
					>{event.audited.name
						.split(' ')
						.map((w) => w[0])
						.join('')
						.toUpperCase()}</Avatar
				>
			{:else}
				No
			{/if}
		</TableBodyCell>
		<TableBodyCell class="py-0 px-2"
			>{event.scores.length} / {data.teams.length}</TableBodyCell
		>
		<TableBodyCell class="py-0 px-2"
			><span class={`flex ${event.supervisors.length !== 0 ? 'ml-4' : ''}`}>
				{#each event.supervisors as { user }}
					<Avatar class={`user_${user.id}`} stacked
						>{user.name
							.split(' ')
							.map((w) => w[0])
							.join('')
							.toUpperCase()}</Avatar
					>
				{:else}
					Not Assigned
				{/each}
			</span></TableBodyCell
		>
		<TableBodyCell class="py-0 px-2">
			<Button
				color="alternative"
				class="border-none p-1 text-primary-600 hover:underline dark:text-primary-500"
				on:click={() => {
					openEditEvent(event.id);
				}}
			>
				Edit
			</Button>
		</TableBodyCell>
		<TableBodyCell class="py-0 px-2">
			<a
				href="/t/{data.tournament.id}/events/{event.id.toString()}/"
				class="text-primary-600 hover:underline dark:text-primary-500"
			>
				View
			</a>
		</TableBodyCell>
	</svelte:fragment>
</SelectableTable>

{#each roles as { user }}
	<Tooltip triggeredBy={`.user_${user.id}`}>{user.name}</Tooltip>
{/each}

<ConfirmModal
	title="Delete Events"
	actionMessage="delete these events"
	bind:open={showConfirmDelete}
	onConfirm={confirmDelete}
>
	Are you sure you want to delete {selected.length} event{selected.length > 1
		? 's'
		: ''}? This action cannot be undone.
</ConfirmModal>

<Modal title="Add Events" bind:open={showAddEvent} autoclose outsideclose>
	<P><span class="text-red-600">*</span> Indicates required field.</P>

	<Label>
		Event Name <span class="text-red-600">*</span>
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
		<Select
			underline
			class="mt-2"
			items={trialStatus}
			bind:value={addEventTrialStatus}
		/>
	</Label>
	<Label>
		High Scoring
		<Select
			underline
			class="mt-2"
			items={highScoring}
			bind:value={addHighScoring}
		/>
	</Label>
	{#if checklists[data.tournament.year]?.[addEventName] != undefined}
		<Checkbox class="mt-2" bind:checked={addEnableChecklist}
			>Enable Digital Checklists</Checkbox
		>
	{/if}
	<Label>
		Number of Medals (Optional, overrides tournament level setting)
		<Input class="mt-2" type="text" required bind:value={addEventMedals} />
	</Label>

	<svelte:fragment slot="footer">
		<Button color="green" disabled={addEventName === ''} on:click={addEvent}
			>Add Event</Button
		>
		<Button color="alternative">Cancel</Button>
	</svelte:fragment>
</Modal>

<Modal title="Add All Events" bind:open={showAddAll} autoclose outsideclose>
	{#if data.tournament.division === 'A'}
		<P>Adding all events is not supported for Division A.</P>
	{:else}
		<P>
			The following events for this season will be added to this tournament. You
			can edit the trial status and medal counts later.
		</P>
		<List tag="ul">
			{#each currentEvents[data.tournament.division] as [event, _]}
				<Li>{event}</Li>
			{/each}
		</List>
	{/if}

	<svelte:fragment slot="footer">
		<Button
			color="green"
			disabled={data.tournament.division === 'A'}
			on:click={addAllEvents}>Add All Events</Button
		>
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
		<Select
			underline
			class="mt-2"
			items={trialStatus}
			bind:value={editEventTrialStatus}
		/>
	</Label>
	<Label>
		High Scoring
		<Select
			underline
			class="mt-2"
			items={highScoring}
			bind:value={editHighScoring}
		/>
	</Label>
	{#if checklists[data.tournament.year]?.[editEventName] != undefined}
		<Checkbox class="mt-2" bind:checked={editEnableChecklist}
			>Enable Digital Checklists</Checkbox
		>
	{/if}
	<Label>
		Medals (Optional)
		<Input class="mt-2" type="text" required bind:value={editEventMedals} />
	</Label>

	<svelte:fragment slot="footer">
		<Button color="green" on:click={editEvent}>Save</Button>
		<Button color="alternative">Cancel</Button>
	</svelte:fragment>
</Modal>
