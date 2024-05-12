<script lang="ts">
	import type { PageData } from './$types';
	import Head from '$lib/components/Head.svelte';

	import {
		TableBodyCell,
		TableHeadCell,
		Checkbox,
		Label,
		Select,
		Button,
		Heading,
		Modal,
		Input,
		Textarea,
		List,
		Li,
		P,
		Alert
	} from 'flowbite-svelte';
	import papaparse from 'papaparse';
	import { page } from '$app/stores';
	import { invalidateAll } from '$app/navigation';
	import type { Team } from '@prisma/client';
	import SelectableTable from '$lib/components/SelectableTable.svelte';
	import { addToastMessage } from '$lib/components/Toasts.svelte';
	import ConfirmModal from '$lib/components/ConfirmModal.svelte';

	export let data: PageData;

	const states = [
		{ value: 'AL', name: 'Alabama' },
		{ value: 'AK', name: 'Alaska' },
		{ value: 'AZ', name: 'Arizona' },
		{ value: 'AR', name: 'Arkansas' },
		{ value: 'CA', name: 'California' },
		{ value: 'CO', name: 'Colorado' },
		{ value: 'CT', name: 'Connecticut' },
		{ value: 'DE', name: 'Delaware' },
		{ value: 'FL', name: 'Florida' },
		{ value: 'GA', name: 'Georgia' },
		{ value: 'HI', name: 'Hawaii' },
		{ value: 'ID', name: 'Idaho' },
		{ value: 'IL', name: 'Illinois' },
		{ value: 'IN', name: 'Indiana' },
		{ value: 'IA', name: 'Iowa' },
		{ value: 'KS', name: 'Kansas' },
		{ value: 'KY', name: 'Kentucky' },
		{ value: 'LA', name: 'Louisiana' },
		{ value: 'ME', name: 'Maine' },
		{ value: 'MD', name: 'Maryland' },
		{ value: 'MA', name: 'Massachusetts' },
		{ value: 'MI', name: 'Michigan' },
		{ value: 'MN', name: 'Minnesota' },
		{ value: 'MS', name: 'Mississippi' },
		{ value: 'MO', name: 'Missouri' },
		{ value: 'MT', name: 'Montana' },
		{ value: 'NE', name: 'Nebraska' },
		{ value: 'NV', name: 'Nevada' },
		{ value: 'NH', name: 'New Hampshire' },
		{ value: 'NJ', name: 'New Jersey' },
		{ value: 'NM', name: 'New Mexico' },
		{ value: 'NY', name: 'New York' },
		{ value: 'NC', name: 'North Carolina' },
		{ value: 'ND', name: 'North Dakota' },
		{ value: 'OH', name: 'Ohio' },
		{ value: 'OK', name: 'Oklahoma' },
		{ value: 'OR', name: 'Oregon' },
		{ value: 'PA', name: 'Pennsylvania' },
		{ value: 'RI', name: 'Rhode Island' },
		{ value: 'SC', name: 'South Carolina' },
		{ value: 'SD', name: 'South Dakota' },
		{ value: 'TN', name: 'Tennessee' },
		{ value: 'TX', name: 'Texas' },
		{ value: 'UT', name: 'Utah' },
		{ value: 'VT', name: 'Vermont' },
		{ value: 'VA', name: 'Virginia' },
		{ value: 'WA', name: 'Washington' },
		{ value: 'WV', name: 'West Virginia' },
		{ value: 'WI', name: 'Wisconsin' },
		{ value: 'WY', name: 'Wyoming' }
	];
	const stateLookup = states.reduce(
		(a, s) => a.set(s.name.toLowerCase(), s.value),
		new Map<string, string>()
	);

	$: tracks = [{ value: '', name: 'None' }].concat(
		data.tracks.map((track) => ({
			value: track.id.toString(),
			name: track.name
		}))
	);

	let selected: typeof teams = [];
	$: teams = data.teams;

	let showConfirmDelete = false;
	function confirmDelete() {
		const ids = selected.map((t) => t.id.toString());
		fetch(`/t/${$page.params['id']}/teams`, {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				teams: ids
			})
		}).then((res) => {
			if (res.status === 200) {
				teams = teams.filter((t) => !ids.includes(t.id.toString()));
				addToastMessage('Teams deleted!', 'success');
			} else {
				addToastMessage('Failed to delete teams!', 'error');
			}
		});
	}

	let showAddTeam = false;
	let addTeamData: Partial<Team> = {};
	function openAddTeam() {
		showAddTeam = true;
	}
	function addTeam() {
		// TODO: validation, canonicalization
		const payloadData = {
			...addTeamData,
			number: parseInt(/\d+/.exec(addTeamData.number as any)?.[0] ?? ''),
			trackId: addTeamData.trackId?.toString() || null
		};
		fetch(`/t/${$page.params['id']}/teams`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify([payloadData]) // TODO: validate
		}).then((res) => {
			if (res.status === 200) {
				addTeamData = {};
				addToastMessage('Team added!', 'success');
				invalidateAll();
			} else {
				addToastMessage('Failed to add team!', 'error');
			}
		});
	}

	let showEditTeam = false;
	let editTeamData: Partial<Omit<Team, 'trackId'> & { trackId?: string }> = {};
	function openEditTeam(team: bigint) {
		showEditTeam = true;
		const teamData = teams.find((t) => t.id === team);
		editTeamData = { ...teamData, trackId: teamData?.trackId?.toString() };
	}
	function editTeam() {
		// TODO: validation, canonicalization

		const sendTeamData = {
			number: parseInt(editTeamData.number as any),
			school: editTeamData.school,
			abbreviation: editTeamData.abbreviation || null,
			suffix: editTeamData.suffix || null,
			city: editTeamData.city || null,
			state: editTeamData.state,
			trackId: editTeamData.trackId || null,
			exhibition: editTeamData.exhibition,
			penalties: editTeamData.penalties ? parseInt(editTeamData.penalties as any) : null
		};
		fetch(`/t/${$page.params['id']}/teams`, {
			method: 'PATCH',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ id: editTeamData.id?.toString(), data: sendTeamData }) // TODO: validate
		}).then((res) => {
			if (res.status === 200) {
				addToastMessage('Team updated!', 'success');
				invalidateAll();
			} else {
				addToastMessage('Failed to update team!', 'error');
			}
		});
	}

	let showImportTeams = false;
	let importTeamsData = '';
	let importGenerateNumbers = true;
	$: nextNumber = teams.reduce((acc, t) => Math.max(acc, t.number), 0) + 1;
	let parsedImportTeams: {
		Number: string;
		School: string;
		Abbreviation: string;
		Suffix: string;
		City: string;
		State: string;
		Track: string;
		Exhibition: string;
	}[] = [];
	let parsedError = '';
	$: {
		parsedError = '';
		parsedImportTeams = papaparse.parse(importTeamsData, { header: true }).data as any;
		const missingFields: Set<string> = new Set();
		const invalidStates: Set<string> = new Set();
		// TODO: validate numbers, suffix, exhibition; canonicalization
		parsedImportTeams.forEach((t) => {
			if (!importGenerateNumbers && !t.Number) {
				missingFields.add('Number');
			}
			if (!t.School) {
				missingFields.add('School');
			}
			if (!t.State) {
				missingFields.add('State');
			}
			if (!stateLookup.has(t.State.toLowerCase()) && ![...stateLookup.values()].includes(t.State)) {
				invalidStates.add(t.State);
			}
		});
		if (missingFields.size > 0) {
			parsedError += `Missing fields: ${[...missingFields].join(', ')}\n`;
		}
		if (invalidStates.size > 0) {
			parsedError = `Invalid states: ${[...invalidStates].join(', ')}\n`;
		}
		if (!parsedError) {
			parsedImportTeams.forEach((t, i) => {
				if (importGenerateNumbers) {
					t.Number = (nextNumber + i).toString();
				} else {
					t.Number = parseInt(/\d+/.exec(t.Number)?.[0] ?? '').toString();
				}
				if (stateLookup.has(t.State.toLowerCase())) {
					t.State = stateLookup.get(t.State.toLowerCase()) ?? t.State;
				}
			});
		}
	}
	function openImportTeams() {
		showImportTeams = true;
	}
	function importTeams() {
		if (parsedError) return;
		fetch(`/t/${$page.params['id']}/teams`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(
				parsedImportTeams.map((t) => ({
					number: parseInt(t.Number),
					school: t.School,
					abbreviation: t.Abbreviation || null,
					suffix: t.Suffix || null,
					city: t.City || null,
					state: t.State,
					trackId: data.tournament.enableTracks
						? tracks?.find((track) => track.name === t.Track)?.value ?? null
						: null,
					exhibition: !!t.Exhibition
				}))
			)
		}).then((res) => {
			if (res.status === 200) {
				importTeamsData = '';
				addToastMessage('Team added!', 'success');
				invalidateAll();
			} else {
				addToastMessage('Failed to add team!', 'error');
			}
		});
	}
</script>

<Head
	title="Teams | {data.tournament.year} {data.tournament.shortName} {data.tournament
		.division} | Duosmium Scoring"
/>

<div class="w-full flex justify-between flex-wrap mb-2">
	<Heading tag="h2" class="w-fit">Teams</Heading>
	<span class="space-x-4">
		<Button color="green" on:click={openImportTeams}>Import Teams</Button>
		<Button color="green" on:click={openAddTeam}>Add Team</Button>
	</span>
</div>

<SelectableTable items={teams} bind:selected cols={8}>
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
		<TableHeadCell class="px-2">Team #</TableHeadCell>
		<TableHeadCell class="px-2">Team Name</TableHeadCell>
		<TableHeadCell class="px-2">Location</TableHeadCell>
		{#if data.tournament.enableTracks}
			<TableHeadCell class="px-2">Track</TableHeadCell>
		{/if}
		<TableHeadCell class="px-2">Exhibition</TableHeadCell>
		<TableHeadCell class="px-2">Penalties</TableHeadCell>
		<TableHeadCell class="px-2">
			<span class="sr-only"> Edit </span>
		</TableHeadCell>
	</svelte:fragment>
	<svelte:fragment slot="item" let:item={team}>
		<TableBodyCell class="py-0 px-2">{team.number}</TableBodyCell>
		<TableBodyCell class="py-0 px-2"
			>{team.abbreviation ??
				team.school.slice(0, 45) + (team.school.length > 45 ? '…' : '')}{team.suffix
				? ' ' + team.suffix.slice(0, 38) + (team.suffix.length > 38 ? '…' : '')
				: ''}</TableBodyCell
		>
		<TableBodyCell class="py-0 px-2">{team.city ? team.city + ', ' : ''}{team.state}</TableBodyCell>
		{#if data.tournament.enableTracks}
			<TableBodyCell class="py-0 px-2"
				>{tracks.find((t) => t.value === team.trackId?.toString())?.name ?? 'None'}</TableBodyCell
			>
		{/if}
		<TableBodyCell class="py-0 px-2">{team.exhibition ? 'Exhib. Team' : 'No'}</TableBodyCell>
		<TableBodyCell class="py-0 px-2">{team.penalties ?? 'None'}</TableBodyCell>
		<TableBodyCell class="py-0 px-2">
			<Button
				color="alternative"
				class="border-none p-1 font-medium text-primary-600 hover:underline dark:text-primary-500"
				on:click={() => {
					openEditTeam(team.id);
				}}
			>
				Edit
			</Button>
		</TableBodyCell>
	</svelte:fragment>
</SelectableTable>

<ConfirmModal
	title="Delete Teams"
	actionMessage="delete these teams"
	bind:open={showConfirmDelete}
	onConfirm={confirmDelete}
>
	Are you sure you want to delete {selected.length} team{selected.length > 1 ? 's' : ''}? This
	action cannot be undone.
</ConfirmModal>

<Modal title="Add Team" bind:open={showAddTeam} autoclose outsideclose>
	<P><span class="text-red-600">*</span> Indicates required field.</P>

	<Label>
		Team Number: <span class="text-red-600">*</span>
		<Input class="mt-2" type="text" required bind:value={addTeamData.number} />
	</Label>
	<Label>
		School Name: <span class="text-red-600">*</span>
		<Input class="mt-2" type="text" required bind:value={addTeamData.school} />
	</Label>
	<Label>
		<div>School Abbreviation:</div>
		<div class="text-sm">Optional, only if a school has a long name and common abbreviation.</div>
		<Input class="mt-2" type="text" bind:value={addTeamData.abbreviation} />
	</Label>
	<Label>
		<div>Team Name:</div>
		<div class="text-sm">Optional if a school only has one team.</div>
		<Input class="mt-2" type="text" bind:value={addTeamData.suffix} />
	</Label>
	<Label>
		City: <span class="text-red-600">*</span>
		<Input class="mt-2" type="text" required bind:value={addTeamData.city} />
	</Label>
	<Label>
		State: <span class="text-red-600">*</span>
		<Select underline class="mt-2" items={states} bind:value={addTeamData.state} />
	</Label>
	{#if data.tournament.enableTracks}
		<Label>
			Track:
			<Select underline class="mt-2" items={tracks} bind:value={addTeamData.trackId} />
		</Label>
	{/if}
	<Checkbox bind:checked={addTeamData.exhibition}>Exhibition Team</Checkbox>

	<svelte:fragment slot="footer">
		<!-- TODO: validation -->
		<Button color="green" disabled={false} on:click={addTeam}>Add Team</Button>
		<Button color="alternative">Cancel</Button>
	</svelte:fragment>
</Modal>

<Modal title="Edit Team" bind:open={showEditTeam} autoclose outsideclose>
	<Label>
		Team Number
		<Input class="mt-2" type="text" required bind:value={editTeamData.number} />
	</Label>
	<Label>
		School Name
		<Input class="mt-2" type="text" required bind:value={editTeamData.school} />
	</Label>
	<Label>
		<div>School Abbreviation</div>
		<div class="text-sm">Optional, only if a school has a long name and common abbreviation.</div>
		<Input class="mt-2" type="text" bind:value={editTeamData.abbreviation} />
	</Label>
	<Label>
		<div>Team Name</div>
		<div class="text-sm">Optional if a school only has one team.</div>
		<Input class="mt-2" type="text" bind:value={editTeamData.suffix} />
	</Label>
	<Label>
		City
		<Input class="mt-2" type="text" required bind:value={editTeamData.city} />
	</Label>
	<Label>
		State
		<Select underline class="mt-2" items={states} bind:value={editTeamData.state} />
	</Label>
	{#if data.tournament.enableTracks}
		<Label>
			Track
			<Select underline class="mt-2" items={tracks} bind:value={editTeamData.trackId} />
		</Label>
	{/if}
	<Checkbox bind:checked={editTeamData.exhibition}>Exhibition Team</Checkbox>
	<Label>
		Penalties
		<Input class="mt-2" type="number" required bind:value={editTeamData.penalties} />
	</Label>

	<svelte:fragment slot="footer">
		<!-- TODO: validation -->
		<Button color="green" disabled={false} on:click={editTeam}>Save</Button>
		<Button color="alternative">Cancel</Button>
	</svelte:fragment>
</Modal>

<Modal title="Import Teams" bind:open={showImportTeams} autoclose outsideclose>
	<P>
		To import teams, paste in a CSV or TSV of team data. Include the following headings:
		<List tag="ul" class="space-y-1 mt-2">
			<Li
				><code>Number</code>
				<i>(Optional if using "Generate Team Numbers")</i></Li
			>
			<Li
				><code class="dark:text-green-300 text-green-700">School</code>
				<i>(Required)</i>: The school's name</Li
			>
			<Li
				><code class="dark:text-blue-300 text-blue-700">Abbreviation</code>
				<i>(Optional)</i>: If a school name is long and has a common abbreviation</Li
			>
			<Li
				><code class="dark:text-pink-300 text-pink-700">Suffix</code>
				<i>(Required if the school has multiple teams)</i>: A team name
			</Li>
			<Li
				><code class="dark:text-violet-300 text-violet-700">City</code>
				<i>(Optional but recommended)</i>: The school's city
			</Li>
			<Li
				><code class="dark:text-violet-300 text-violet-700">State</code>
				<i>(Required)</i>: The school's state, 2-letter postal abbreviation
			</Li>
			{#if data.tournament.enableTracks}
				<Li
					><code class="dark:text-red-300 text-red-700">Track</code>
					<i>(Optional)</i>: The name of the track the team is competing in
				</Li>
			{/if}
			<Li
				><code class="dark:text-orange-300 text-orange-700">Exhibition</code>
				<i>(Optional)</i>: Whether a team is an exhibition team, leave blank for non exhibition
				teams</Li
			>
		</List>
	</P>
	<Checkbox required bind:checked={importGenerateNumbers}>Generate Team Numbers</Checkbox>
	<Label>
		Teams
		<Textarea class="mt-2" required bind:value={importTeamsData} />
	</Label>

	<Heading tag="h3" class="text-md">Preview</Heading>

	{#if parsedError}
		<Alert class="mt-2" color="red">{parsedError}</Alert>
	{:else if parsedImportTeams.length !== 0}
		<ol>
			{#each parsedImportTeams as team}
				<li>
					<span class="tabular-nums">#{team.Number}:</span>
					<span class="dark:text-red-300 text-red-700"
						>{team.Track && data.tournament.enableTracks ? `[${team.Track}] ` : ''}</span
					><span class="dark:text-green-300 text-green-700">{team.School}</span><span
						class="dark:text-blue-300 text-blue-700"
						>{team.Abbreviation ? ` (${team.Abbreviation})` : ''}</span
					><span class="dark:text-pink-300 text-pink-700"
						>{team.Suffix ? ` ${team.Suffix}` : ''}</span
					>
					<span class="dark:text-violet-300 text-violet-700"
						>[{team.City ? `${team.City}, ` : ''}{team.State}]</span
					><span class="dark:text-orange-300 text-orange-700"
						>{team.Exhibition ? ' [Exhib.]' : ''}</span
					>
				</li>
			{/each}
		</ol>
	{:else}
		<P>Waiting for teams input...</P>
	{/if}

	<svelte:fragment slot="footer">
		<!-- TODO: validation -->
		<Button color="green" disabled={parsedError.length !== 0} on:click={importTeams}>Save</Button>
		<Button color="alternative">Cancel</Button>
	</svelte:fragment>
</Modal>
