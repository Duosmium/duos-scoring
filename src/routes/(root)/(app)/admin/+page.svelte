<script lang="ts">
	import SelectableTable from '$lib/components/SelectableTable.svelte';
	import {
		Button,
		List,
		Modal,
		TableBodyCell,
		TableHeadCell
	} from 'flowbite-svelte';
	import { sendData } from '../../t/[id=int]/helpers.js';
	import Head from '$lib/components/Head.svelte';

	export let data;
	$: pending = data.pending.sort(
		(a, b) => a.startDate.valueOf() - b.startDate.valueOf()
	);
	let selectedPending: typeof pending = [];

	$: upcoming = data.upcoming.sort(
		(a, b) => a.startDate.valueOf() - b.startDate.valueOf()
	);

	$: approved = data.approved.sort(
		(a, b) => b.startDate.valueOf() - a.startDate.valueOf()
	);
	let selectedApproved: typeof approved = [];

	let selected: typeof selectedPending = [];
	let action: 'approve' | 'unapprove' | 'archive' = 'approve';
	let showConfirm = false;
	function confirmAction() {
		const ids = selected.map((t) => t.id.toString());
		sendData({
			method: 'PATCH',
			body: { ids, action },
			msgs: {
				info: `${action[0].toUpperCase() + action.slice(1, -1) + 'ing'} tournaments...`,
				success: `Tournaments ${action}d!`,
				error: `Failed to ${action} tournaments!`
			}
		});
		selectedPending = [];
		selectedApproved = [];
	}

	function fmtDate(date: Date): string {
		return date.toUTCString().split(' ').slice(0, 4).join(' ');
	}
</script>

<Head title="Admin Dashboard | Duosmium Scoring" />

<h1>Admin Dashboard</h1>

<h2 class="w-fit">Pending Approval</h2>
<SelectableTable items={pending} bind:selected={selectedPending} cols={6}>
	<svelte:fragment slot="buttons">
		<Button
			size="sm"
			color="green"
			on:click={() => {
				action = 'approve';
				selected = selectedPending;
				showConfirm = true;
			}}>Approve</Button
		>
		<Button
			size="sm"
			color="yellow"
			on:click={() => {
				action = 'archive';
				selected = selectedPending;
				showConfirm = true;
			}}>Archive</Button
		>
	</svelte:fragment>
	<svelte:fragment slot="headers">
		<TableHeadCell class="px-2">Tournament Directors</TableHeadCell>
		<TableHeadCell class="px-2">Name</TableHeadCell>
		<TableHeadCell class="px-2">Attributes</TableHeadCell>
	</svelte:fragment>
	<svelte:fragment slot="item" let:item={t}>
		<TableBodyCell class="py-0 px-2"
			><List
				>{#each t.roles
					.filter((r) => r.role === 'TD')
					.map( (r) => [r.user.name, data.emails.get(r.userId)] ) as [name, email]}
					<li>{name} ({email})</li>
				{/each}
			</List></TableBodyCell
		>
		<TableBodyCell class="py-0 px-2"
			>{t.year} {t.name} {t.division}</TableBodyCell
		>
		<TableBodyCell class="px-2">
			<List>
				<li><span>Short Name:</span> {t.shortName}</li>
				<li><span>Level:</span> {t.level}</li>
				<li><span>Division:</span> {t.division}</li>
				<li><span>State:</span> {t.state}</li>
				<li><span>Location:</span> {t.location}</li>
				<li><span>Year:</span> {t.year}</li>
				<li>
					<span>Dates:</span>
					{fmtDate(t.startDate)} to {fmtDate(t.endDate)}
				</li>
				<li><span>Awards:</span> {fmtDate(t.awardsDate)}</li>
				<li><span>Medals:</span> {t.medals}</li>
				<li><span>Trophies:</span> {t.trophies}</li>
				<li><span>Bids:</span> {t.bids}</li>
				<li><span>Drops:</span> {t.drops}</li>
				<li><span>Tracks:</span> {t.enableTracks}</li>
				<li><span>N Offset:</span> {t.nOffset}</li>
			</List>
		</TableBodyCell>
	</svelte:fragment>
</SelectableTable>

<h2 class="w-fit mt-12">Upcoming Tournaments</h2>
<SelectableTable items={upcoming} selected={[]} cols={6}>
	<svelte:fragment slot="buttons"></svelte:fragment>
	<svelte:fragment slot="headers">
		<TableHeadCell class="px-2">Tournament Directors</TableHeadCell>
		<TableHeadCell class="px-2">Name</TableHeadCell>
		<TableHeadCell class="px-2">Dates</TableHeadCell>
	</svelte:fragment>
	<svelte:fragment slot="item" let:item={t}>
		<TableBodyCell class="py-2 px-2"
			><List
				>{#each t.roles
					.filter((r) => r.role === 'TD')
					.map( (r) => [r.user.name, data.emails.get(r.userId)] ) as [name, email]}
					<li>{name} ({email})</li>
				{/each}
			</List></TableBodyCell
		>
		<TableBodyCell class="py-0 px-2"
			>{t.year} {t.name} {t.division}</TableBodyCell
		>
		<TableBodyCell class="py-0 px-2"
			>{fmtDate(t.startDate)} to {fmtDate(t.endDate)}</TableBodyCell
		>
	</svelte:fragment>
</SelectableTable>

<h2 class="w-fit mt-12">Approved Tournaments</h2>
<SelectableTable items={approved} bind:selected={selectedApproved} cols={6}>
	<svelte:fragment slot="buttons">
		<Button
			size="sm"
			color="green"
			on:click={() => {
				action = 'unapprove';
				selected = selectedApproved;
				showConfirm = true;
			}}>Unapprove</Button
		>
		<Button
			size="sm"
			color="yellow"
			on:click={() => {
				action = 'archive';
				selected = selectedApproved;
				showConfirm = true;
			}}>Archive</Button
		>
	</svelte:fragment>
	<svelte:fragment slot="headers">
		<TableHeadCell class="px-2">Tournament Directors</TableHeadCell>
		<TableHeadCell class="px-2">Name</TableHeadCell>
		<TableHeadCell class="px-2">Dates</TableHeadCell>
	</svelte:fragment>
	<svelte:fragment slot="item" let:item={t}>
		<TableBodyCell class="py-2 px-2"
			><List
				>{#each t.roles
					.filter((r) => r.role === 'TD')
					.map( (r) => [r.user.name, data.emails.get(r.userId)] ) as [name, email]}
					<li>{name} ({email})</li>
				{/each}
			</List></TableBodyCell
		>
		<TableBodyCell class="py-0 px-2"
			>{t.year} {t.name} {t.division}</TableBodyCell
		>
		<TableBodyCell class="py-0 px-2"
			>{fmtDate(t.startDate)} to {fmtDate(t.endDate)}</TableBodyCell
		>
	</svelte:fragment>
</SelectableTable>

<Modal title="Confirm Action" bind:open={showConfirm} autoclose outsideclose>
	<p class="text-base leading-relaxed text-gray-500 dark:text-gray-400">
		Are you sure you want to {action}
		{selected.length}
		tournament{selected.length > 1 ? 's' : ''}?
	</p>
	<svelte:fragment slot="footer">
		<Button color="green" on:click={confirmAction}>Yes!</Button>
		<Button color="alternative">Cancel</Button>
	</svelte:fragment>
</Modal>

<style lang="postcss">
	li span {
		@apply text-green-600 dark:text-green-400;
	}
</style>
