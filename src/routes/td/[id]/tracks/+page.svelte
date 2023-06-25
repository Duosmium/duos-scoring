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
		Button,
		Heading,
		Modal,
		Input,
		Toast
	} from 'flowbite-svelte';
	import { page } from '$app/stores';
	import { slide } from 'svelte/transition';
	import { invalidateAll } from '$app/navigation';
	import type { Track } from '@prisma/client';

	export let data: PageData;

	let selectAll = false;
	$: tracks = data.tournament.tracks.map((t, i) => ({ ...t, index: i, checked: false }));

	let lastIndex = -1;
	function toggleCheck(id: bigint) {
		selectAll = false;
		if (!shiftDown) {
			lastIndex = tracks.findIndex((t) => t.id === id);
			tracks = tracks.map((t) => (t.id === id ? { ...t, checked: !t.checked } : t));
		} else {
			const currentTrack = tracks.find((t) => t.id === id);
			if (!currentTrack) return;
			const currentIndex = currentTrack.index;
			const currentStatus = currentTrack.checked;
			const minIndex = Math.min(currentIndex, lastIndex);
			const maxIndex = Math.max(currentIndex, lastIndex);
			tracks = tracks.map((t, i) =>
				i >= minIndex && i <= maxIndex ? { ...t, checked: !currentStatus } : t
			);
			lastIndex = currentIndex;
		}
	}

	function toggleAll() {
		selectAll = !selectAll;
		tracks = tracks.map((t) => ({ ...t, checked: selectAll }));
	}

	$: selected = tracks.filter((t) => t.checked);

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
		const ids = selected.map((t) => t.id.toString());
		fetch(`/td/${$page.params['id']}/tracks`, {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				tracks: ids
			})
		}).then((res) => {
			if (res.status === 200) {
				tracks = tracks.filter((t) => !ids.includes(t.id.toString()));
				addToastMessage('Tracks deleted!', 'success');
			} else {
				addToastMessage('Failed to delete tracks!', 'error');
			}
		});
	}

	let showAddTrack = false;
	let addTrackData: Partial<Track> = {};
	function openAddTrack() {
		showAddTrack = true;
	}
	function addTrack() {
		// TODO: validation, canonicalization

		addTrackData.medals = addTrackData.medals ? parseInt(addTrackData.medals as any) : null;
		addTrackData.trophies = addTrackData.trophies ? parseInt(addTrackData.trophies as any) : null;
		fetch(`/td/${$page.params['id']}/tracks`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify([addTrackData]) // TODO: validate
		}).then((res) => {
			if (res.status === 200) {
				addTrackData = {};
				addToastMessage('Track added!', 'success');
				invalidateAll();
			} else {
				addToastMessage('Failed to add track!', 'error');
			}
		});
	}

	let showEditTrack = false;
	let editTrackData: Partial<Track> = {};
	function openEditTrack(track: bigint) {
		showEditTrack = true;
		editTrackData = { ...tracks.find((t) => t.id === track) };
	}
	function editTrack() {
		// TODO: validation, canonicalization

		const sendTrackData = {
			name: editTrackData.name,
			medals: editTrackData.medals ? parseInt(editTrackData.medals as any) : null,
			trophies: editTrackData.trophies ? parseInt(editTrackData.trophies as any) : null
		};
		fetch(`/td/${$page.params['id']}/tracks`, {
			method: 'PATCH',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ id: editTrackData.id?.toString(), data: sendTrackData }) // TODO: validate
		}).then((res) => {
			if (res.status === 200) {
				addToastMessage('Track updated!', 'success');
				invalidateAll();
			} else {
				addToastMessage('Failed to update track!', 'error');
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
	title="Tracks | {data.tournament.year} {data.tournament.shortName} {data.tournament
		.division} | Duosmium Scoring"
/>

<svelte:window on:keydown={handleKeydown} on:keyup={handleKeyup} />

<div class="w-full flex justify-between flex-wrap mb-2">
	<Heading tag="h2" class="w-fit">Tracks</Heading>
	<span class="space-x-4">
		<Button color="green" on:click={openAddTrack}>Add Track</Button>
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
				tracks = tracks.map((t) => ({ ...t, checked: false }));
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
		<TableHeadCell>Track Name</TableHeadCell>
		<TableHeadCell>Medals</TableHeadCell>
		<TableHeadCell>Trophies</TableHeadCell>
		<TableHeadCell># Teams</TableHeadCell>
		<TableHeadCell>
			<span class="sr-only"> Edit </span>
		</TableHeadCell>
	</TableHead>
	<TableBody tableBodyClass="divide-y">
		{#if tracks.length === 0}
			<TableBodyRow>
				<TableBodyCell colspan="7" class="text-center">
					<p>No tracks have been added yet.</p>
				</TableBodyCell>
			</TableBodyRow>
		{:else}
			{#each tracks as track}
				<TableBodyRow>
					<TableBodyCell class="!p-4">
						<Checkbox
							on:click={() => {
								toggleCheck(track.id);
							}}
							checked={track.checked}
						/>
					</TableBodyCell>
					<TableBodyCell>{track.name}</TableBodyCell>
					<TableBodyCell>{track.medals ?? 'Default'}</TableBodyCell>
					<TableBodyCell>{track.trophies ?? 'Default'}</TableBodyCell>
					<TableBodyCell>{track.teams.length}</TableBodyCell>
					<TableBodyCell>
						<Button
							color="alternative"
							class="border-none p-1 font-medium text-primary-600 hover:underline dark:text-primary-500"
							on:click={() => {
								openEditTrack(track.id);
							}}
						>
							Edit
						</Button>
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
	title="Delete Tracks"
	bind:open={showConfirmDelete}
	autoclose
	outsideclose
	on:close={() => {
		confirmDeleteText = '';
	}}
>
	<p class="text-base leading-relaxed text-gray-500 dark:text-gray-400">
		Are you sure you want to delete {selected.length} track{selected.length > 1 ? 's' : ''}? This
		action cannot be undone.
	</p>
	<Label>
		Type "confirm" to delete these tracks.
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

<Modal title="Add Track" bind:open={showAddTrack} autoclose outsideclose>
	<Label>
		<div>Track Name</div>
		<div class="text-sm">Required</div>
		<Input class="mt-2" type="text" bind:value={addTrackData.name} />
	</Label>
	<Label>
		<div>Number of Medals</div>
		<div class="text-sm">Optional</div>
		<Input class="mt-2" type="number" bind:value={addTrackData.medals} />
	</Label>
	<Label>
		<div>Number of Trophies</div>
		<div class="text-sm">Optional</div>
		<Input class="mt-2" type="number" bind:value={addTrackData.trophies} />
	</Label>

	<svelte:fragment slot="footer">
		<!-- TODO: validation -->
		<Button color="green" disabled={false} on:click={addTrack}>Add Track</Button>
		<Button color="alternative">Cancel</Button>
	</svelte:fragment>
</Modal>

<Modal title="Edit Track" bind:open={showEditTrack} autoclose outsideclose>
	<Label>
		<div>Track Name</div>
		<div class="text-sm">Required</div>
		<Input class="mt-2" type="text" bind:value={editTrackData.name} />
	</Label>
	<Label>
		<div>Number of Medals</div>
		<div class="text-sm">Optional</div>
		<Input class="mt-2" type="number" bind:value={editTrackData.medals} />
	</Label>
	<Label>
		<div>Number of Trophies</div>
		<div class="text-sm">Optional</div>
		<Input class="mt-2" type="number" bind:value={editTrackData.trophies} />
	</Label>

	<svelte:fragment slot="footer">
		<!-- TODO: validation -->
		<Button color="green" disabled={false} on:click={editTrack}>Save</Button>
		<Button color="alternative">Cancel</Button>
	</svelte:fragment>
</Modal>
