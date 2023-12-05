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
		Textarea,
		Alert,
		P,
		List,
		Li,
		Select
	} from 'flowbite-svelte';
	import { page } from '$app/stores';
	import { invalidateAll } from '$app/navigation';
	import SelectableTable from '$lib/components/SelectableTable.svelte';
	import { addToastMessage } from '$lib/components/Toasts.svelte';
	import ConfirmModal from '$lib/components/ConfirmModal.svelte';
	import papaparse from 'papaparse';

	export let data: PageData;

	const roleOptions = [
		{ name: 'Tournament Director', value: 'TD' },
		{ name: 'Scoremaster', value: 'SM' },
		{ name: 'Event Supervisor', value: 'ES' }
	];
	const roleNames = new Map(roleOptions.map((r) => [r.value, r.name]));
	const roleSort = {
		TD: 0,
		SM: 1,
		ES: 2
	};

	$: members = data.roles.sort((a, b) => roleSort[a.role] - roleSort[b.role]);
	let selectedMembers: typeof members = [];

	$: invites = data.invites.map((i) => ({ ...i, id: i.link }));
	let selectedInvites: typeof invites = [];

	let showConfirmDeleteMembers = false;
	let showConfirmDeleteInvites = false;
	function confirmDelete(thing: 'members' | 'invites') {
		const ids =
			thing === 'members'
				? { members: selectedMembers.map((m) => m.user.id) }
				: { invites: selectedInvites.map((i) => i.link) };
		fetch(`/t/${$page.params['id']}/members`, {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(ids)
		}).then((res) => {
			if (res.status === 200) {
				if (thing === 'members') {
					members = members.filter((m) => !ids.members?.includes(m.user.id));
				} else {
					invites = invites.filter((i) => !ids.invites?.includes(i.link));
				}
				addToastMessage(`${thing[0].toLocaleUpperCase() + thing.slice(1)} deleted!`, 'success');
			} else {
				addToastMessage(`Failed to delete ${thing}!`, 'error');
			}
		});
	}

	const emailRegex =
		/^(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])$/;
	let showInviteMembers = false;
	let inviteMembersData = '';
	let parsedInvites: string[][];
	let parsedError = '';
	$: events = new Map(data.events.map((e) => [e.name, e]));
	$: {
		parsedInvites = (
			papaparse.parse(inviteMembersData, { header: false, skipEmptyLines: 'greedy' })
				.data as typeof parsedInvites
		).map((row) => row.filter((d) => d !== ''));
		parsedError = '';
		parsedInvites.forEach((t) => {
			if (!emailRegex.test(t[0])) {
				parsedError += `Invalid email '${t[0]}'\n`;
			}
			if (t.slice(1).length !== 0) {
				t.slice(1).forEach((e) => {
					if (!events.has(e)) {
						parsedError += `Invalid event '${e}'\n`;
					}
				});
			}
		});
	}
	function openInviteMembers() {
		showInviteMembers = true;
	}
	function inviteMembers() {
		// TODO: validation
		fetch(`/t/${$page.params['id']}/members`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(
				parsedInvites.map((i) => ({
					email: i[0],
					events: i.slice(1).map((name) => events.get(name)?.id.toString())
				}))
			)
		}).then((res) => {
			if (res.status === 200) {
				inviteMembersData = '';
				addToastMessage('Invites sent!', 'success');
				invalidateAll();
			} else {
				addToastMessage('Failed to send invites!', 'error');
			}
		});
	}

	let showEditMember = false;
	let editMemberData: {
		userId: string;
		role: 'ES' | 'SM' | 'TD';
		events: bigint[];
	} = { userId: '', role: 'ES', events: [] };
	function openEditMember(member: bigint) {
		showEditMember = true;
		const foundMember = members.find((m) => m.id === member);
		if (!foundMember) {
			addToastMessage('Failed to find member!', 'error');
			return;
		}
		editMemberData = {
			userId: foundMember.user.id,
			role: foundMember.role,
			events: foundMember.supEvents.map((e) => e.id)
		};
	}
	function editMember() {
		// TODO: validation
		fetch(`/t/${$page.params['id']}/members`, {
			method: 'PATCH',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				member: {
					userId: editMemberData.userId,
					role: editMemberData.role,
					events: editMemberData.events.map((e) => e.toString())
				}
			}) // TODO: validate
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
	let editInviteData: { link: string; events: bigint[] } = { link: '', events: [] };
	function openEditInvite(invite: string) {
		showEditInvite = true;
		const foundInvite = invites.find((i) => i.link === invite);
		if (!foundInvite) {
			addToastMessage('Failed to find invite!', 'error');
			return;
		}
		editInviteData = { link: foundInvite.link, events: foundInvite.events.map((e) => e.id) };
	}
	function editInvite() {
		// TODO: validation
		fetch(`/t/${$page.params['id']}/members`, {
			method: 'PATCH',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				invite: {
					link: editInviteData.link,
					events: editInviteData.events.map((e) => e.toString())
				}
			}) // TODO: validate
		}).then((res) => {
			if (res.status === 200) {
				addToastMessage('Invite updated!', 'success');
				invalidateAll();
			} else {
				addToastMessage('Failed to update invite!', 'error');
			}
		});
	}

	function copyInvite(inviteId: string) {
		return () => {
			const url = new URL($page.url);
			url.pathname = '/invite/' + inviteId;
			navigator.clipboard.writeText(url.toString());
			addToastMessage('Invite copied!', 'success');
		};
	}
</script>

<Head
	title="Members | {data.tournament.year} {data.tournament.shortName} {data.tournament
		.division} | Duosmium Scoring"
/>

<div class="w-full flex justify-between flex-wrap mb-2">
	<Heading tag="h2" class="w-fit">Members</Heading>
	<span class="space-x-4">
		<Button color="green" on:click={openInviteMembers}>Invite Members</Button>
	</span>
</div>

<SelectableTable items={members} bind:selected={selectedMembers} cols={6}>
	<svelte:fragment slot="buttons">
		<Button
			size="sm"
			color="red"
			on:click={() => {
				showConfirmDeleteMembers = true;
			}}>Delete</Button
		>
	</svelte:fragment>
	<svelte:fragment slot="headers">
		<TableHeadCell class="px-2">Name</TableHeadCell>
		<TableHeadCell class="px-2">Email</TableHeadCell>
		<TableHeadCell class="px-2">Role</TableHeadCell>
		<TableHeadCell class="px-2">Events</TableHeadCell>
		<TableHeadCell class="px-2">
			<span class="sr-only"> Edit </span>
		</TableHeadCell>
	</svelte:fragment>
	<svelte:fragment slot="item" let:item={member}>
		<TableBodyCell class="py-0 px-2">{member.user.name}</TableBodyCell>
		<TableBodyCell class="py-0 px-2">{data.emails.get(member.user.id)}</TableBodyCell>
		<TableBodyCell class="py-0 px-2">{roleNames.get(member.role)}</TableBodyCell>
		<TableBodyCell class="py-0 px-2"
			>{member.supEvents
				.map((event) => event.name)
				?.sort((a, b) => a.localeCompare(b))
				?.join(', ')}</TableBodyCell
		>
		<TableBodyCell class="py-0 px-2">
			<Button
				color="alternative"
				class="border-none p-1 font-medium text-primary-600 hover:underline dark:text-primary-500"
				on:click={() => {
					openEditMember(member.id);
				}}
			>
				Edit
			</Button>
		</TableBodyCell>
	</svelte:fragment>
</SelectableTable>

<Heading tag="h3" class="w-fit mt-20 mb-6">Pending Invites</Heading>
<SelectableTable items={invites} bind:selected={selectedInvites} cols={5}>
	<svelte:fragment slot="buttons">
		<Button
			size="sm"
			color="red"
			on:click={() => {
				showConfirmDeleteInvites = true;
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
		<TableBodyCell class="py-0 px-2"
			><button on:click={copyInvite(invite.id)}>{invite.id}</button></TableBodyCell
		>
		<TableBodyCell class="py-0 px-2">{invite.email}</TableBodyCell>
		<TableBodyCell class="py-0 px-2"
			>{invite.events
				.map((e) => e.name)
				.sort((a, b) => a.localeCompare(b))
				.join(', ')}</TableBodyCell
		>
		<TableBodyCell class="py-0 px-2">
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

<ConfirmModal
	title="Remove Members"
	actionMessage="remove these members"
	bind:open={showConfirmDeleteMembers}
	onConfirm={() => {
		confirmDelete('members');
	}}
>
	Are you sure you want to remove {selectedMembers.length} member{selectedMembers.length > 1
		? 's'
		: ''}? This action cannot be undone.
</ConfirmModal>

<ConfirmModal
	title="Delete Invites"
	actionMessage="delete these invites"
	bind:open={showConfirmDeleteInvites}
	onConfirm={() => {
		confirmDelete('invites');
	}}
>
	Are you sure you want to remove {selectedInvites.length} invite{selectedInvites.length > 1
		? 's'
		: ''}? This action cannot be undone.
</ConfirmModal>

<Modal title="Add Member" bind:open={showInviteMembers} autoclose outsideclose>
	<P>
		To invite members, paste in list of emails below. You can also add events that the person will
		automatically be assigned to by separating the email and events by commas or tabs (the default
		in Google Sheets when you copy).
		<List tag="ul" class="space-y-1 mt-2">
			<Li
				><code class="dark:text-red-300 text-red-700">Email</code>
				<i>(Required)</i>: An invite link will be sent to this email
			</Li>
			<Li
				><code class="dark:text-blue-300 text-blue-700">Events</code>
				<i>(Optional)</i>: The invite will automatically add them to these events</Li
			>
		</List>
	</P>
	<Label>
		Emails
		<Textarea class="mt-2" required bind:value={inviteMembersData} />
	</Label>

	<Heading tag="h3" class="text-md">Preview</Heading>

	{#if parsedError}
		<Alert class="mt-2 whitespace-pre-line" color="red">{parsedError}</Alert>
	{:else if parsedInvites.length !== 0}
		<ol>
			{#each parsedInvites as invite}
				<li>
					<span class="dark:text-red-300 text-red-700"
						>{invite[0] + (invite.slice(1).length !== 0 ? ': ' : '')}</span
					><span class="dark:text-blue-300 text-blue-700"
						>{invite.slice(1).length !== 0 ? invite.slice(1).join(', ') : ''}</span
					>
				</li>
			{/each}
		</ol>
	{:else}
		<P>Waiting for input...</P>
	{/if}

	<svelte:fragment slot="footer">
		<!-- TODO: validation -->
		<Button color="green" disabled={parsedError.length !== 0} on:click={inviteMembers}>Save</Button>
		<Button color="alternative">Cancel</Button>
	</svelte:fragment>
</Modal>

<Modal title="Edit Member" bind:open={showEditMember} autoclose outsideclose>
	<Heading tag="h2" class="text-2xl">Events</Heading>
	{#each events.entries() as event}
		<Checkbox
			class="mr-2 mt-2"
			checked={editMemberData.events.includes(event[1].id)}
			on:click={(e) => {
				// @ts-ignore
				if (e.target?.checked) {
					editMemberData.events.push(event[1].id);
				} else {
					editMemberData.events.splice(editMemberData.events.indexOf(event[1].id), 1);
				}
			}}>{event[0]}</Checkbox
		>
	{/each}
	{#if editMemberData.userId !== data.user.id}
		<Heading tag="h2" class="text-2xl mt-20">Permissions</Heading>
		<Label class="!mt-4">
			Role
			<Select underline class="mt-2" bind:value={editMemberData.role} items={roleOptions} />
		</Label>
	{/if}

	<svelte:fragment slot="footer">
		<!-- TODO: validation -->
		<Button color="green" disabled={false} on:click={editMember}>Save</Button>
		<Button color="alternative">Cancel</Button>
	</svelte:fragment>
</Modal>

<Modal title="Edit Invite" bind:open={showEditInvite} autoclose outsideclose>
	<Heading tag="h2" class="text-2xl">Events</Heading>
	{#each events.entries() as event}
		<Checkbox
			class="mt-2 mr-2"
			checked={editInviteData.events.includes(event[1].id)}
			on:click={(e) => {
				// @ts-ignore
				if (e.target?.checked) {
					editInviteData.events.push(event[1].id);
				} else {
					editInviteData.events.splice(editInviteData.events.indexOf(event[1].id), 1);
				}
			}}>{event[0]}</Checkbox
		>
	{/each}

	<svelte:fragment slot="footer">
		<!-- TODO: validation -->
		<Button color="green" disabled={false} on:click={editInvite}>Save</Button>
		<Button color="alternative">Cancel</Button>
	</svelte:fragment>
</Modal>
