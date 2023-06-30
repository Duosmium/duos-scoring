<script lang="ts">
	import type { PageData } from './$types';
	import Head from '$lib/components/Head.svelte';

	import {
		TableBodyCell,
		TableHeadCell,
		Checkbox,
		Label,
		Button,
		Heading,
		Modal,
		Input
	} from 'flowbite-svelte';
	import { page } from '$app/stores';
	import { invalidateAll } from '$app/navigation';
	import { TournamentRoles } from '@prisma/client';
	import SelectableTable from '$lib/components/SelectableTable.svelte';
	import { addToastMessage } from '$lib/components/Toasts.svelte';

	export let data: PageData;

	$: members = data.tournament.users!.map((m) => ({
		...m,
		admin:
			m.roles.find(
				(role) => role.role === TournamentRoles.DIRECTOR && role.tournamentId === data.tournament.id
			) != undefined
	}));
	let selectedMembers: typeof members = [];

	$: invites = data.tournament.invites!.map((i) => ({ ...i, id: i.link }));
	let selectedInvites: typeof invites = [];

	let showConfirmDelete = false;
	let confirmDeleteText = '';
	function confirmDelete() {
		const ids = selectedMembers.map((m) => m.id.toString());
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

	let showEditInvite = false;
	let editInviteData: Partial<(typeof invites)[0]> = {};
	function openEditInvite(invite: string) {
		showEditInvite = true;
		editInviteData = { ...invites.find((i) => i.link === invite) };
	}
	function editInvite() {
		// TODO: validation
		fetch(`/t/${$page.params['id']}/members`, {
			method: 'PATCH',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({}) // TODO: validate
		}).then((res) => {
			if (res.status === 200) {
				addToastMessage('Invite updated!', 'success');
				invalidateAll();
			} else {
				addToastMessage('Failed to update invite!', 'error');
			}
		});
	}
</script>

<Head
	title="Members | {data.tournament.year} {data.tournament.shortName} {data.tournament
		.division} | Duosmium Scoring"
/>

<div class="w-full flex justify-between flex-wrap mb-2">
	<Heading tag="h2" class="w-fit">Members</Heading>
	<span class="space-x-4">
		<Button color="green" on:click={openAddMember}>Invite Members</Button>
	</span>
</div>

<SelectableTable items={members} bind:selected={selectedMembers}>
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
		<TableHeadCell class="px-2">Name</TableHeadCell>
		<TableHeadCell class="px-2">Admin</TableHeadCell>
		<TableHeadCell class="px-2">Events</TableHeadCell>
		<TableHeadCell class="px-2">
			<span class="sr-only"> Edit </span>
		</TableHeadCell>
	</svelte:fragment>
	<svelte:fragment slot="item" let:item={member}>
		<TableBodyCell class="px-2">{member.name}</TableBodyCell>
		<TableBodyCell class="px-2">{member.admin ? 'Yes' : 'No'}</TableBodyCell>
		<TableBodyCell class="px-2"
			>{member.roles
				.filter((role) => role.tournamentId === data.tournament.id && role.event)
				.map((role) => role.event?.name)
				.join(', ')}</TableBodyCell
		>
		<TableBodyCell class="px-2">
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
	</svelte:fragment>
</SelectableTable>

<Heading tag="h3" class="w-fit mt-20 mb-6">Pending Invites</Heading>
<SelectableTable items={invites} bind:selected={selectedInvites}>
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
		<TableHeadCell class="px-2">Invite Link</TableHeadCell>
		<TableHeadCell class="px-2">Sent To Email</TableHeadCell>
		<TableHeadCell class="px-2">Events</TableHeadCell>
		<TableHeadCell class="px-2">
			<span class="sr-only"> Edit </span>
		</TableHeadCell>
	</svelte:fragment>
	<svelte:fragment slot="item" let:item={invite}>
		<TableBodyCell class="px-2"><a href="/invite/{invite.id}">{invite.id}</a></TableBodyCell>
		<TableBodyCell class="px-2">{invite.email}</TableBodyCell>
		<TableBodyCell class="px-2">{invite.events.map((e) => e.name).join(', ')}</TableBodyCell>
		<TableBodyCell class="px-2">
			<Button
				color="alternative"
				class="border-none p-1 font-medium text-primary-600 hover:underline dark:text-primary-500"
				on:click={() => {
					openEditInvite(invite.id);
				}}
			>
				Edit
			</Button>
		</TableBodyCell>
	</svelte:fragment>
</SelectableTable>

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
		Are you sure you want to remove {selectedMembers.length} member{selectedMembers.length > 1
			? 's'
			: ''}? This action cannot be undone.
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

<Modal title="Edit Invite" bind:open={showEditInvite} autoclose outsideclose>
	<Label>some kind of event stuff</Label>

	<svelte:fragment slot="footer">
		<!-- TODO: validation -->
		<Button color="green" disabled={false} on:click={editInvite}>Save</Button>
		<Button color="alternative">Cancel</Button>
	</svelte:fragment>
</Modal>
