<script lang="ts">
	import SelectableTable from '$lib/components/SelectableTable.svelte';
	import { Button, List, TableBodyCell, TableHeadCell } from 'flowbite-svelte';

	export let data;
	$: pending = data.pending.sort(
		(a, b) => a.startDate.getDate() - b.startDate.getDate()
	);
	let selected: typeof pending = [];

	$: upcoming = data.upcoming;
	let selectedUpcoming: typeof upcoming = [];

	$: approved = data.approved;
	let selectedApproved: typeof approved = [];
</script>

<h1>Admin Dashboard</h1>

<h2 class="w-fit">Pending Approval</h2>
<SelectableTable items={pending} bind:selected cols={6}>
	<svelte:fragment slot="buttons">
		<Button
			size="sm"
			color="green"
			on:click={() => {
				// showConfirmDelete = true;
			}}>Approve</Button
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
		<TableBodyCell class="py-0 px-2">{t.name}</TableBodyCell>
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
					{t.startDate.toISOString().split('T')[0]} to {t.endDate
						.toISOString()
						.split('T')[0]}
				</li>
				<li><span>Awards:</span> {t.awardsDate.toISOString().split('T')[0]}</li>
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
<SelectableTable items={upcoming} bind:selected={selectedUpcoming} cols={6}>
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
		<TableBodyCell class="py-0 px-2">{t.name}</TableBodyCell>
		<TableBodyCell class="py-0 px-2"
			>{t.startDate.toISOString().split('T')[0]} to {t.endDate
				.toISOString()
				.split('T')[0]}</TableBodyCell
		>
	</svelte:fragment>
</SelectableTable>

<h2 class="w-fit mt-12">Approved Tournaments</h2>
<SelectableTable items={approved} bind:selected={selectedApproved} cols={6}>
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
		<TableBodyCell class="py-0 px-2">{t.name}</TableBodyCell>
		<TableBodyCell class="py-0 px-2"
			>{t.startDate.toISOString().split('T')[0]} to {t.endDate
				.toISOString()
				.split('T')[0]}</TableBodyCell
		>
	</svelte:fragment>
</SelectableTable>

<style lang="postcss">
	li span {
		@apply text-green-600 dark:text-green-400;
	}
</style>
