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
	import { TournamentRoles } from '@prisma/client';

	export let data: PageData;

	let selectAll = false;
	$: members = data.tournament.users!.map((m, i) => ({
		...m,
		admin:
			m.roles.find(
				(role) => role.role === TournamentRoles.DIRECTOR && role.tournamentId === data.tournament.id
			) != undefined,
		index: i,
		checked: false
	}));

	let lastIndex = -1;
	function toggleCheck(id: string) {
		selectAll = false;
		if (!shiftDown) {
			lastIndex = members.findIndex((m) => m.id === id);
			members = members.map((m) => (m.id === id ? { ...m, checked: !m.checked } : m));
		} else {
			const currentMember = members.find((m) => m.id === id);
			if (!currentMember) return;
			const currentIndex = currentMember.index;
			const currentStatus = currentMember.checked;
			const minIndex = Math.min(currentIndex, lastIndex);
			const maxIndex = Math.max(currentIndex, lastIndex);
			members = members.map((m, i) =>
				i >= minIndex && i <= maxIndex ? { ...m, checked: !currentStatus } : m
			);
			lastIndex = currentIndex;
		}
	}

	function toggleAll() {
		selectAll = !selectAll;
		members = members.map((m) => ({ ...m, checked: selectAll }));
	}

	$: selected = members.filter((m) => m.checked);

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
		const ids = selected.map((m) => m.id.toString());
		fetch(`/t/${$page.params['id']}/members`, {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				members: ids
			})
		}).then((res) => {
			if (res.status === 200) {
				members = members.filter((m) => !ids.includes(m.id.toString()));
				addToastMessage('Members deleted!', 'success');
			} else {
				addToastMessage('Failed to delete members!', 'error');
			}
		});
	}

	let showAddMember = false;
	let addMemberData = {};
	function openAddMember() {
		showAddMember = true;
	}
	function addMember() {
		// TODO: validation
		fetch(`/t/${$page.params['id']}/members`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify([]) // TODO: validate
		}).then((res) => {
			if (res.status === 200) {
				addMemberData = {};
				addToastMessage('Member added!', 'success');
				invalidateAll();
			} else {
				addToastMessage('Failed to add member!', 'error');
			}
		});
	}

	let showEditMember = false;
	let editMemberData: Partial<(typeof members)[0]> = {};
	function openEditMember(member: string) {
		showEditMember = true;
		editMemberData = { ...members.find((m) => m.id === member) };
	}
	function editMember() {
		// TODO: validation
		fetch(`/t/${$page.params['id']}/members`, {
			method: 'PATCH',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({}) // TODO: validate
		}).then((res) => {
			if (res.status === 200) {
				addToastMessage('Member updated!', 'success');
				invalidateAll();
			} else {
				addToastMessage('Failed to update member!', 'error');
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
	title="Members | {data.tournament.year} {data.tournament.shortName} {data.tournament
		.division} | Duosmium Scoring"
/>

<svelte:window on:keydown={handleKeydown} on:keyup={handleKeyup} />

<div class="w-full flex justify-between flex-wrap mb-2">
	<Heading tag="h2" class="w-fit">Members</Heading>
	<span class="space-x-4">
		<Button color="green" on:click={openAddMember}>Invite Members</Button>
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
				members = members.map((m) => ({ ...m, checked: false }));
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
		<TableHeadCell>Name</TableHeadCell>
		<TableHeadCell>Admin</TableHeadCell>
		<TableHeadCell>Events</TableHeadCell>
		<TableHeadCell>
			<span class="sr-only"> Edit </span>
		</TableHeadCell>
	</TableHead>
	<TableBody tableBodyClass="divide-y">
		{#if members.length === 0}
			<TableBodyRow>
				<TableBodyCell colspan="7" class="text-center">
					<p>No members have been added yet.</p>
				</TableBodyCell>
			</TableBodyRow>
		{:else}
			{#each members as member}
				<TableBodyRow>
					<TableBodyCell class="!p-4">
						<Checkbox
							on:click={() => {
								toggleCheck(member.id);
							}}
							checked={member.checked}
						/>
					</TableBodyCell>
					<TableBodyCell>{member.name}</TableBodyCell>
					<TableBodyCell>{member.admin ? 'Yes' : 'No'}</TableBodyCell>
					<TableBodyCell
						>{member.roles
							.filter((role) => role.tournamentId === data.tournament.id && role.event)
							.map((role) => role.event?.name)
							.join(', ')}</TableBodyCell
					>
					<TableBodyCell>
						{#if member.id !== data.user.id}
							<Button
								color="alternative"
								class="border-none p-1 font-medium text-primary-600 hover:underline dark:text-primary-500"
								on:click={() => {
									openEditMember(member.id);
								}}
							>
								Edit
							</Button>
						{/if}
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
	title="Remove Members"
	bind:open={showConfirmDelete}
	autoclose
	outsideclose
	on:close={() => {
		confirmDeleteText = '';
	}}
>
	<p class="text-base leading-relaxed text-gray-500 dark:text-gray-400">
		Are you sure you want to remove {selected.length} member{selected.length > 1 ? 's' : ''}? This
		action cannot be undone.
	</p>
	<Label>
		Type "confirm" to remove these members.
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

<Modal title="Add Member" bind:open={showAddMember} autoclose outsideclose>
	<svelte:fragment slot="footer">
		<!-- TODO: validation -->
		<Button color="green" disabled={false} on:click={addMember}>Add Member</Button>
		<Button color="alternative">Cancel</Button>
	</svelte:fragment>
</Modal>

<Modal title="Edit Member" bind:open={showEditMember} autoclose outsideclose>
	<Label>some kind of event stuff</Label>
	<Label>
		<Checkbox bind:checked={editMemberData.admin} />
		<div>Admin Permissions</div>
		<div class="text-sm">
			This role gives this user access to the entire tournament, including every event and setting.
			They will also have the permission to manage users. <strong
				>Only give this role to trusted individuals!</strong
			>
		</div>
	</Label>

	<svelte:fragment slot="footer">
		<!-- TODO: validation -->
		<Button color="green" disabled={false} on:click={editMember}>Save</Button>
		<Button color="alternative">Cancel</Button>
	</svelte:fragment>
</Modal>
