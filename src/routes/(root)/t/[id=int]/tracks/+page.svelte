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
		Input,
		P
	} from 'flowbite-svelte';
	import type { Track } from '$drizzle/types';
	import SelectableTable from '$lib/components/SelectableTable.svelte';
	import ConfirmModal from '$lib/components/ConfirmModal.svelte';
	import { sendData } from '../helpers';

	export let data: PageData;

	$: tracks = data.tracks;
	let selected: typeof tracks = [];

	let showConfirmDelete = false;
	function confirmDelete() {
		const ids = selected.map((t) => t.id.toString());
		sendData({
			method: 'DELETE',
			body: { tracks: ids },
			msgs: {
				info: 'Deleting tracks...',
				success: 'Tracks deleted!',
				error: 'Failed to delete tracks!'
			}
		}).then(() => {
			tracks = tracks.filter((t) => !ids.includes(t.id.toString()));
			selected = [];
		});
	}

	let showAddTrack = false;
	let addTrackData: Partial<Track> = {};
	function openAddTrack() {
		showAddTrack = true;
	}
	function addTrack() {
		// TODO: validation, canonicalization

		addTrackData.medals = addTrackData.medals
			? parseInt(addTrackData.medals as any)
			: null;
		addTrackData.trophies = addTrackData.trophies
			? parseInt(addTrackData.trophies as any)
			: null;
		sendData({
			method: 'PUT',
			body: [addTrackData],
			msgs: {
				info: 'Adding track...',
				success: 'Track added!',
				error: 'Failed to add track!'
			}
		}).then(() => {
			addTrackData = {};
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
			medals: editTrackData.medals
				? parseInt(editTrackData.medals as any)
				: null,
			trophies: editTrackData.trophies
				? parseInt(editTrackData.trophies as any)
				: null
		};
		sendData({
			method: 'PATCH',
			body: { id: editTrackData.id?.toString(), data: sendTrackData },
			msgs: {
				info: 'Updating track...',
				success: 'Track updated!',
				error: 'Failed to update track!'
			}
		});
	}
</script>

<Head
	title="Tracks | {data.tournament.year} {data.tournament.shortName} {data
		.tournament.division} | Duosmium Scoring"
/>

<div class="w-full flex justify-between flex-wrap mb-2">
	<Heading tag="h2" class="w-fit">Tracks</Heading>
	<span class="space-x-4">
		<Button color="green" on:click={openAddTrack}>Add Track</Button>
	</span>
</div>

<SelectableTable items={tracks} bind:selected cols={6}>
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
		<TableBodyCell class="py-0 px-2"
			>{track.trophies ?? 'Default'}</TableBodyCell
		>
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
	Are you sure you want to delete {selected.length} track{selected.length > 1
		? 's'
		: ''}? This action cannot be undone.
</ConfirmModal>

<Modal title="Add Track" bind:open={showAddTrack} autoclose outsideclose>
	<P><span class="text-red-600">*</span> Indicates required field.</P>

	<Label>
		<div>Track Name: <span class="text-red-600">*</span></div>
		<Input class="mt-2" type="text" bind:value={addTrackData.name} />
	</Label>
	<Label>
		<div>Number of Medals:</div>
		<div class="text-sm">Optional, overrides tournament level setting</div>
		<Input class="mt-2" type="number" bind:value={addTrackData.medals} />
	</Label>
	<Label>
		<div>Number of Trophies</div>
		<div class="text-sm">Optional, overrides tournament level setting</div>
		<Input class="mt-2" type="number" bind:value={addTrackData.trophies} />
	</Label>

	<svelte:fragment slot="footer">
		<!-- TODO: validation -->
		<Button color="green" disabled={false} on:click={addTrack}>Add Track</Button
		>
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
