<script lang="ts">
	import type { PageData } from './$types';
	import Head from '$lib/components/Head.svelte';

	import {
		TableBodyCell,
		TableHeadCell,
		Label,
		Button,
		Heading,
		Modal,
		Input
	} from 'flowbite-svelte';
	import { page } from '$app/stores';
	import { invalidateAll } from '$app/navigation';
	import type { Track } from '@prisma/client';
	import SelectableTable from '$lib/components/SelectableTable.svelte';
	import { addToastMessage } from '$lib/components/Toasts.svelte';
	import ConfirmModal from '$lib/components/ConfirmModal.svelte';

	export let data: PageData;

	$: tracks = data.tournament.tracks!;
	let selected: typeof tracks = [];

	let showConfirmDelete = false;
	function confirmDelete() {
		const ids = selected.map((t) => t.id.toString());
		fetch(`/t/${$page.params['id']}/tracks`, {
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
		fetch(`/t/${$page.params['id']}/tracks`, {
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
		fetch(`/t/${$page.params['id']}/tracks`, {
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
</script>

<Head
	title="Tracks | {data.tournament.year} {data.tournament.shortName} {data.tournament
		.division} | Duosmium Scoring"
/>

<div class="w-full flex justify-between flex-wrap mb-2">
	<Heading tag="h2" class="w-fit">Tracks</Heading>
	<span class="space-x-4">
		<Button color="green" on:click={openAddTrack}>Add Track</Button>
	</span>
</div>

<SelectableTable items={tracks} bind:selected cols={5}>
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
		<TableHeadCell class="px-2">Track Name</TableHeadCell>
		<TableHeadCell class="px-2">Medals</TableHeadCell>
		<TableHeadCell class="px-2">Trophies</TableHeadCell>
		<TableHeadCell class="px-2"># Teams</TableHeadCell>
		<TableHeadCell class="px-2">
			<span class="sr-only"> Edit </span>
		</TableHeadCell>
	</svelte:fragment>
	<svelte:fragment slot="item" let:item={track}>
		<TableBodyCell class="py-0 px-2">{track.name}</TableBodyCell>
		<TableBodyCell class="py-0 px-2">{track.medals ?? 'Default'}</TableBodyCell>
		<TableBodyCell class="py-0 px-2">{track.trophies ?? 'Default'}</TableBodyCell>
		<TableBodyCell class="py-0 px-2">{track.teams.length}</TableBodyCell>
		<TableBodyCell class="py-0 px-2">
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
	</svelte:fragment>
</SelectableTable>
<ConfirmModal
	title="Delete Tracks"
	actionMessage="delete these tracks"
	bind:open={showConfirmDelete}
	onConfirm={confirmDelete}
>
	Are you sure you want to delete {selected.length} track{selected.length > 1 ? 's' : ''}? This
	action cannot be undone.
</ConfirmModal>

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
