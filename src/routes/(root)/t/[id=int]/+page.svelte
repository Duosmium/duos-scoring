<script lang="ts">
	import type { PageData } from './$types';
	import Head from '$lib/components/Head.svelte';
	import {
		A,
		Button,
		Card,
		Checkbox,
		DescriptionList,
		Heading,
		Input,
		Label,
		Li,
		List,
		Modal,
		P,
		Progressbar,
		Select
	} from 'flowbite-svelte';
	import {
		divisions,
		levels,
		perEventNOptions,
		stateOrgs
	} from '$lib/data/consts';
	import type { Tournament } from '$drizzle/types';
	import { page } from '$app/stores';
	import { sendData } from './helpers';

	export let data: PageData;

	let showEditTournament = false;
	let editTournamentData: Partial<Tournament> = {};
	function openEditTournament() {
		showEditTournament = true;
		editTournamentData = {
			...data.tournament,
			startDate: data.tournament.startDate?.toISOString().slice(0, 10) as any,
			endDate: data.tournament.endDate?.toISOString().slice(0, 10) as any,
			awardsDate: data.tournament.awardsDate?.toISOString().slice(0, 10) as any
		};
	}
	function editTournament() {
		// TODO: validation, canonicalization

		const sendTournamentData = {
			name: editTournamentData.name || undefined,
			shortName: editTournamentData.shortName || undefined,
			location: editTournamentData.location || undefined,
			state: editTournamentData.state || undefined,
			level: editTournamentData.level || undefined,
			division: editTournamentData.division || undefined,
			year: parseInt(editTournamentData.year as any) || undefined,
			startDate: editTournamentData.startDate
				? new Date(editTournamentData.startDate)
				: undefined,
			endDate: editTournamentData.endDate
				? new Date(editTournamentData.endDate)
				: undefined,
			awardsDate: editTournamentData.awardsDate
				? new Date(editTournamentData.awardsDate)
				: undefined,
			enableTracks: editTournamentData.enableTracks ?? undefined,
			medals: ((m) => (isNaN(m) ? undefined : m))(
				parseInt(editTournamentData.medals as any)
			),
			trophies: ((t) => (isNaN(t) ? undefined : t))(
				parseInt(editTournamentData.trophies as any)
			),
			bids: parseInt(editTournamentData.bids as any) || null,
			bidsPerSchool: parseInt(editTournamentData.bidsPerSchool as any) || null,
			drops: parseInt(editTournamentData.drops as any) || null,
			nOffset: parseInt(editTournamentData.nOffset as any) || null,
			perEventN: editTournamentData.perEventN || undefined
		};
		sendData({
			method: 'PATCH',
			body: sendTournamentData,
			msgs: {
				info: 'Updating tournament...',
				success: 'Tournament updated!',
				error: 'Failed to update tournament!'
			}
		});
	}
	function requestApproval() {
		sendData({
			method: 'PATCH',
			body: { requestingApproval: true },
			msgs: {
				info: 'Requesting approval...',
				success: 'Approval requested!',
				error: 'Failed to request approval!'
			}
		});
	}
</script>

<Head
	title="TD Dashboard | {data.tournament.year} {data.tournament.shortName} {data
		.tournament.division} | Duosmium Scoring"
/>

<Heading tag="h1" class="text-4xl"
	>{data.tournament.year}
	{data.tournament.name}
	{data.tournament.division}</Heading
>

<!-- TODO: make this pretty -->
{#if data.role.role !== 'ES'}
	<div class="grid grid-cols-1 gap-4 xl:grid-cols-3 md:grid-cols-2 items-start">
		<Card size="xl">
			<P class="mb-2 text-2xl">{data.teams?.length} Teams</P>
			<P class="mb-2 text-2xl"
				>{data.events?.filter((e) => e.scores.length > 0)?.length} / {data
					.events?.length} Events With Scores</P
			>
			<P class="mb-2 text-2xl"
				>{data.events?.filter((e) => e.locked)?.length} / {data.events?.length} Events
				Done Grading</P
			>
			<P class="mb-2 text-2xl"
				>{data.events?.filter((e) => e.audited != null)?.length} / {data.events
					?.length} Events Audited</P
			>
		</Card>
		<Card size="xl">
			<Heading tag="h2" class="mb-2 text-2xl">Scores In</Heading>
			<List tag="ul">
				{#each data.events ?? [] as event}
					{@const color = event.audited
						? 'text-green-700 dark:text-green-400'
						: event.scores.length === data.teams?.length
							? 'text-blue-700 dark:text-blue-400'
							: event.scores.length > 0
								? 'text-amber-600 dark:text-amber-400'
								: 'text-red-700 dark:text-red-400'}
					<Li class={color}>
						{event.name}: {event.scores.length} / {data.teams?.length}
					</Li>
				{:else}
					<Li>No events!</Li>
				{/each}
			</List>
		</Card>
		<Card size="xl">
			<span class="flex justify-between flex-row">
				<Heading tag="h2" class="mb-2 text-2xl w-fit">About Tournament</Heading>
				<div>
					{#if (data.role.role === 'TD' || data.role.role === 'SM') && !data.tournament.approved && !data.tournament.requestingApproval}
						<Button size="sm" color="green" on:click={requestApproval}
							>Request Approval</Button
						>
					{/if}
					{#if data.role.role === 'TD'}
						<Button size="sm" on:click={openEditTournament}>Edit</Button>
					{/if}
				</div>
			</span>
			<!-- TODO: Make this pretty -->
			<List
				tag="dl"
				class="text-gray-700 dark:text-gray-300 divide-y divide-gray-200 dark:divide-gray-700"
			>
				<div class="flex flex-col pb-3">
					<DescriptionList tag="dt">Approval Status</DescriptionList>
					<DescriptionList tag="dd"
						>{data.tournament.approved
							? 'Approved'
							: data.tournament.requestingApproval
								? 'Pending'
								: 'Not Requested'}</DescriptionList
					>
				</div>
				<div class="flex flex-col pb-3">
					<DescriptionList tag="dt">Name</DescriptionList>
					<DescriptionList tag="dd">{data.tournament.name}</DescriptionList>
				</div>
				<div class="flex flex-col pb-3">
					<DescriptionList tag="dt">Short Name</DescriptionList>
					<DescriptionList tag="dd">{data.tournament.shortName}</DescriptionList
					>
				</div>
				<div class="flex flex-col pb-3">
					<DescriptionList tag="dt">Location</DescriptionList>
					<DescriptionList tag="dd">{data.tournament.location}</DescriptionList>
				</div>
				<div class="flex flex-col pb-3">
					<DescriptionList tag="dt">State</DescriptionList>
					<DescriptionList tag="dd">{data.tournament.state}</DescriptionList>
				</div>
				<div class="flex flex-col pb-3">
					<DescriptionList tag="dt">Level</DescriptionList>
					<DescriptionList tag="dd"
						>{data.tournament.level[0] +
							data.tournament.level.slice(1).toLowerCase()}</DescriptionList
					>
				</div>
				<div class="flex flex-col pb-3">
					<DescriptionList tag="dt">Division</DescriptionList>
					<DescriptionList tag="dd">{data.tournament.division}</DescriptionList>
				</div>
				<div class="flex flex-col pb-3">
					<DescriptionList tag="dt">Year</DescriptionList>
					<DescriptionList tag="dd">{data.tournament.year}</DescriptionList>
				</div>
				<div class="flex flex-col pb-3">
					<DescriptionList tag="dt">Start Date</DescriptionList>
					<DescriptionList tag="dd"
						>{data.tournament.startDate
							.toUTCString()
							.split(' ')
							.slice(0, 4)
							.join(' ')}</DescriptionList
					>
				</div>
				<div class="flex flex-col pb-3">
					<DescriptionList tag="dt">End Date</DescriptionList>
					<DescriptionList tag="dd"
						>{data.tournament.endDate
							.toUTCString()
							.split(' ')
							.slice(0, 4)
							.join(' ')}</DescriptionList
					>
				</div>
				<div class="flex flex-col pb-3">
					<DescriptionList tag="dt">Awards Date</DescriptionList>
					<DescriptionList tag="dd"
						>{data.tournament.awardsDate
							.toUTCString()
							.split(' ')
							.slice(0, 4)
							.join(' ')}</DescriptionList
					>
				</div>
				<div class="flex flex-col pb-3">
					<DescriptionList tag="dt">Tracks Enabled?</DescriptionList>
					<DescriptionList tag="dd"
						>{data.tournament.enableTracks ? 'Yes' : 'No'}</DescriptionList
					>
				</div>
				<div class="flex flex-col pb-3">
					<DescriptionList tag="dt">Medals</DescriptionList>
					<DescriptionList tag="dd">{data.tournament.medals}</DescriptionList>
				</div>
				<div class="flex flex-col pb-3">
					<DescriptionList tag="dt">Trophies</DescriptionList>
					<DescriptionList tag="dd">{data.tournament.trophies}</DescriptionList>
				</div>
				<div class="flex flex-col pb-3">
					<DescriptionList tag="dt">Bids</DescriptionList>
					<DescriptionList tag="dd"
						>{data.tournament.bids ?? 'None'}</DescriptionList
					>
				</div>
				<div class="flex flex-col pb-3">
					<DescriptionList tag="dt">Bids Per School</DescriptionList>
					<DescriptionList tag="dd"
						>{data.tournament.bidsPerSchool ?? 'None'}</DescriptionList
					>
				</div>
				<div class="flex flex-col pb-3">
					<DescriptionList tag="dt">Drops</DescriptionList>
					<DescriptionList tag="dd"
						>{data.tournament.drops ?? 'None'}</DescriptionList
					>
				</div>
				<div class="flex flex-col pb-3">
					<DescriptionList tag="dt">N Offset</DescriptionList>
					<DescriptionList tag="dd"
						>{data.tournament.nOffset ?? 'None'}</DescriptionList
					>
				</div>
				<div class="flex flex-col pb-3">
					<DescriptionList tag="dt">Per-event N</DescriptionList>
					<DescriptionList tag="dd"
						>{data.tournament.perEventN[0] +
							data.tournament.perEventN.slice(1).toLowerCase()}</DescriptionList
					>
				</div>
			</List>
		</Card>
	</div>

	<Modal
		title="Edit Tournament Info"
		bind:open={showEditTournament}
		autoclose
		outsideclose
	>
		<Label>
			Name: <Input
				type="text"
				name="name"
				bind:value={editTournamentData.name}
				required
			/>
		</Label>
		<Label>
			Short Name: <Input
				type="text"
				name="shortName"
				bind:value={editTournamentData.shortName}
				required
			/>
		</Label>
		<Label>
			Location: <Input
				type="text"
				name="location"
				bind:value={editTournamentData.location}
				required
			/>
		</Label>
		<Label>
			State:
			<Select
				name="state"
				items={stateOrgs}
				bind:value={editTournamentData.state}
				required
			/>
		</Label>
		<Label>
			Level:
			<Select
				name="level"
				items={levels}
				bind:value={editTournamentData.level}
				required
			/>
		</Label>
		<Label>
			Division:
			<Select
				name="division"
				items={divisions}
				bind:value={editTournamentData.division}
				required
			/>
		</Label>
		<Label>
			Year: <Input
				type="number"
				name="year"
				bind:value={editTournamentData.year}
				required
			/>
		</Label>
		<Label>
			Start Date: <Input
				type="date"
				name="startDate"
				bind:value={editTournamentData.startDate}
				required
			/>
		</Label>
		<Label>
			End Date: <Input
				type="date"
				name="endDate"
				bind:value={editTournamentData.endDate}
				required
			/>
		</Label>
		<Label>
			Awards Date: <Input
				type="date"
				name="awardsDate"
				bind:value={editTournamentData.awardsDate}
				required
			/>
		</Label>
		<Checkbox name="enableTracks" bind:checked={editTournamentData.enableTracks}
			>Enable Tracks</Checkbox
		>
		<Label>
			Medals: <Input
				type="number"
				name="medals"
				bind:value={editTournamentData.medals}
			/>
		</Label>
		<Label>
			Trophies: <Input
				type="number"
				name="trophies"
				bind:value={editTournamentData.trophies}
			/>
		</Label>
		<Label>
			Bids: <Input
				type="number"
				name="bids"
				bind:value={editTournamentData.bids}
			/>
		</Label>
		<Label>
			Bids Per School: <Input
				type="number"
				name="bidsPerSchool"
				bind:value={editTournamentData.bidsPerSchool}
			/>
		</Label>
		<Label>
			Drops: <Input
				type="number"
				name="drops"
				bind:value={editTournamentData.drops}
			/>
		</Label>
		<Label>
			N-Offset: <Input
				type="number"
				name="nOffset"
				bind:value={editTournamentData.nOffset}
			/>
		</Label>
		<Label>
			Per-event N (Optional): <Select
				name="perEventN"
				items={perEventNOptions}
				bind:value={editTournamentData.perEventN}
			/>
		</Label>

		<svelte:fragment slot="footer">
			<!-- TODO: validation -->
			<Button color="green" on:click={editTournament}>Save</Button>
			<Button color="alternative">Cancel</Button>
		</svelte:fragment>
	</Modal>
{:else if data.role}
	<Heading tag="h2" class="text-2xl">Your Events</Heading>
	<List tag="ul">
		{#each data.role.supEvents as event}
			<Li><A href="/t/{$page.params.id}/events/{event.id}">{event.name}</A></Li>
		{:else}
			<P>
				You have not yet been assigned to any events! Contact the tournament
				director if you believe this is an error.
			</P>
		{/each}
	</List>
{:else}
	<P>
		You have not yet been assigned to any events! Contact the tournament
		director if you believe this is an error.
	</P>
{/if}
