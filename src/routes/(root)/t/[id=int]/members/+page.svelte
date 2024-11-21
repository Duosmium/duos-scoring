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
	import SelectableTable from '$lib/components/SelectableTable.svelte';
	import { addToastMessage } from '$lib/components/Toasts.svelte';
	import ConfirmModal from '$lib/components/ConfirmModal.svelte';
	import papaparse from 'papaparse';
	import type { UserRole } from '$drizzle/types';
	import { sendData } from '../helpers';

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
		sendData({
			method: 'DELETE',
			body: ids,
			msgs: {
				info: `Deleting ${thing}...`,
				success: `${thing[0].toLocaleUpperCase() + thing.slice(1)} deleted!`,
				error: `Failed to delete ${thing}!`
			}
		});
		if (thing === 'members') {
			members = members.filter((m) => !ids.members?.includes(m.user.id));
		} else {
			invites = invites.filter((i) => !ids.invites?.includes(i.link));
		}
	}

	const emailRegex =
		/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
	let showInviteMembers = false;
	let inviteMembersData = '';
	let parsedInvites: { email: string; events: string[]; role: UserRole }[];
	let parsedError = '';
	$: events = new Map(data.events.map((e) => [e.name.toLowerCase(), e]));
	$: {
		parsedInvites = [
			...(
				papaparse.parse(inviteMembersData, {
					header: false,
					skipEmptyLines: 'greedy',
					transform: (v) => v.trim()
				}).data as string[][]
			)
				.reduce((acc, row) => {
					row = row.filter((d) => d !== '');
					const userEvents = acc.get(row[0])?.events || new Set<string>();
					let role: UserRole = 'ES';
					row
						.slice(1)
						.map((d) => events.get(d.toLowerCase())?.name ?? d)
						.forEach((e) => {
							if ([...roleNames.keys()].includes(e.toUpperCase())) {
								role = e.toUpperCase() as UserRole;
								return;
							}
							userEvents.add(e);
						});
					acc.set(row[0], { events: userEvents, role });
					return acc;
				}, new Map<string, { events: Set<string>; role: UserRole }>())
				.entries()
		].map(([email, { events, role }]) => ({
			email,
			events: [...events],
			role
		}));
		parsedError = '';
		parsedInvites.forEach((t) => {
			if (!emailRegex.test(t.email)) {
				parsedError += `Invalid email '${t.email}'\n`;
			}
			if (t.events.length !== 0) {
				t.events.forEach((e) => {
					if (!events.has(e.toLowerCase())) {
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
		sendData({
			method: 'PUT',
			body: parsedInvites.slice(0, 15).map((i) => ({
				email: i.email,
				events: i.events.map((name) =>
					events.get(name.toLowerCase())?.id.toString()
				),
				role: i.role
			})),
			msgs: {
				info: 'Sending invites...',
				success: 'Invites sent!',
				error: 'Failed to send invites!'
			}
		}).then(() => {
			inviteMembersData = '';
		});
	}

	let showEditMember = false;
	let editMemberData: {
		userId: string;
		role: UserRole;
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
		sendData({
			method: 'PATCH',
			body: {
				member: {
					userId: editMemberData.userId,
					role: editMemberData.role,
					events: editMemberData.events.map((e) => e.toString())
				}
			},
			msgs: {
				info: 'Updating member...',
				success: 'Member updated!',
				error: 'Failed to update member!'
			}
		});
	}

	let showEditInvite = false;
	let editInviteData: { link: string; events: bigint[]; role: UserRole } = {
		link: '',
		events: [],
		role: 'ES'
	};
	function openEditInvite(invite: string) {
		showEditInvite = true;
		const foundInvite = invites.find((i) => i.link === invite);
		if (!foundInvite) {
			addToastMessage('Failed to find invite!', 'error');
			return;
		}
		editInviteData = {
			link: foundInvite.link,
			events: foundInvite.events.map((e) => e.id),
			role: foundInvite.role
		};
	}
	function editInvite() {
		// TODO: validation
		sendData({
			method: 'PATCH',
			body: {
				invite: {
					link: editInviteData.link,
					events: editInviteData.events.map((e) => e.toString()),
					role: editInviteData.role
				}
			},
			msgs: {
				info: 'Updating invite...',
				success: 'Invite updated!',
				error: 'Failed to update invite!'
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
	title="Members | {data.tournament.year} {data.tournament.shortName} {data
		.tournament.division} | Duosmium Scoring"
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
		<TableBodyCell class="py-0 px-2"
			>{data.emails.get(member.user.id)}</TableBodyCell
		>
		<TableBodyCell class="py-0 px-2">{roleNames.get(member.role)}</TableBodyCell
		>
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
		<TableHeadCell class="px-2">Invited As</TableHeadCell>
		<TableHeadCell class="px-2">Events</TableHeadCell>
		<TableHeadCell class="px-2">
			<span class="sr-only"> Edit </span>
		</TableHeadCell>
	</svelte:fragment>
	<svelte:fragment slot="item" let:item={invite}>
		<TableBodyCell class="py-0 px-2"
			><button on:click={copyInvite(invite.id)}>{invite.id}</button
			></TableBodyCell
		>
		<TableBodyCell class="py-0 px-2">{invite.email}</TableBodyCell>
		<TableBodyCell class="py-0 px-2">{roleNames.get(invite.role)}</TableBodyCell
		>
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
	Are you sure you want to remove {selectedMembers.length} member{selectedMembers.length >
	1
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
	Are you sure you want to remove {selectedInvites.length} invite{selectedInvites.length >
	1
		? 's'
		: ''}? This action cannot be undone.
</ConfirmModal>

<Modal title="Add Member" bind:open={showInviteMembers} autoclose outsideclose>
	<P>
		To invite members, paste in list of emails below (max 15 at a time). You can
		also add events that the person will automatically be assigned to by
		separating the email and events by commas or tabs (the default in Google
		Sheets when you copy).
		<List tag="ul" class="space-y-1 my-2">
			<Li
				><code class="dark:text-red-300 text-red-700">Email</code>
				<i>(Required)</i>: An invite link will be sent to this email
			</Li>
			<Li
				><code class="dark:text-blue-300 text-blue-700">Tournament Role</code>
				<i>(Optional)</i>: Supported roles include "TD", "SM", "ES" (default)</Li
			>
			<Li
				><code class="dark:text-blue-300 text-blue-700">Events</code>
				<i>(Optional)</i>: The invite will automatically add them to these
				events</Li
			>
		</List>
		If you need to invite more than 15 people, just repeat the process!
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
			{#each parsedInvites.slice(0, 15) as invite}
				<li>
					<span class="dark:text-red-300 text-red-700"
						>{invite.email} ({invite.role}){invite.events.length !== 0
							? ': '
							: ''}</span
					><span class="dark:text-blue-300 text-blue-700"
						>{invite.events.length !== 0 ? invite.events.join(', ') : ''}</span
					>
				</li>
			{/each}
			{#if parsedInvites.length > 15}
				<li>... truncated to 15 invites!</li>
			{/if}
		</ol>
	{:else}
		<P>Waiting for input...</P>
	{/if}

	<svelte:fragment slot="footer">
		<!-- TODO: validation -->
		<Button
			color="green"
			disabled={parsedError.length !== 0}
			on:click={inviteMembers}>Invite Members</Button
		>
		<Button color="alternative">Cancel</Button>
	</svelte:fragment>
</Modal>

<Modal title="Edit Member" bind:open={showEditMember} autoclose outsideclose>
	<Heading tag="h2" class="text-2xl">Events</Heading>
	{#each events.values() as event}
		<Checkbox
			class="mr-2 mt-2"
			checked={editMemberData.events.includes(event.id)}
			on:click={(e) => {
				// @ts-ignore
				if (e.target?.checked) {
					editMemberData.events.push(event.id);
				} else {
					editMemberData.events.splice(
						editMemberData.events.indexOf(event.id),
						1
					);
				}
			}}>{event.name}</Checkbox
		>
	{/each}
	{#if editMemberData.userId !== data.user.id}
		<Heading tag="h2" class="text-2xl mt-20">Permissions</Heading>
		<Label class="!mt-4">
			Role
			<Select
				underline
				class="mt-2"
				bind:value={editMemberData.role}
				items={roleOptions}
			/>
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
	{#each events.values() as event}
		<Checkbox
			class="mt-2 mr-2"
			checked={editInviteData.events.includes(event.id)}
			on:click={(e) => {
				// @ts-ignore
				if (e.target?.checked) {
					editInviteData.events.push(event.id);
				} else {
					editInviteData.events.splice(
						editInviteData.events.indexOf(event.id),
						1
					);
				}
			}}>{event.name}</Checkbox
		>
	{/each}

	<Heading tag="h2" class="text-2xl mt-20">Permissions</Heading>
	<Label class="!mt-4">
		Role
		<Select
			underline
			class="mt-2"
			bind:value={editInviteData.role}
			items={roleOptions}
		/>
	</Label>

	<svelte:fragment slot="footer">
		<!-- TODO: validation -->
		<Button color="green" disabled={false} on:click={editInvite}>Save</Button>
		<Button color="alternative">Cancel</Button>
	</svelte:fragment>
</Modal>
