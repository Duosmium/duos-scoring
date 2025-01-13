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
		Alert,
		Radio
	} from 'flowbite-svelte';
	import papaparse from 'papaparse';
	import type { Team } from '$drizzle/types';
	import SelectableTable from '$lib/components/SelectableTable.svelte';
	import ConfirmModal from '$lib/components/ConfirmModal.svelte';
	import { sendData } from '../helpers';
	import { states } from '$lib/data/consts';
	import { ExclamationCircleSolid } from 'flowbite-svelte-icons';
	import { distance } from 'fastest-levenshtein';
	import { normalize } from './shared';
	import { formatSchool } from '$lib/sciolyffHelpers';

	export let data: PageData;

	const stateLookup = states.reduce(
		(a, s) => a.set(s.name.toLowerCase(), s.value),
		new Map<string, string>()
	);

	function canonicalize<T>(
		teams: {
			state: string;
			school: string;
			city: string | null;
			id: T;
		}[]
	) {
		return new Map(
			teams.flatMap<[T, [string, string, string][]]>((t) => {
				const matched = data.canonicalNames.flatMap<
					[string, string, string] | true
				>(([n, original, city, state]) =>
					state === t.state && original === t.school && city === (t.city ?? '')
						? [true]
						: state === t.state && distance(n, normalize(t.school)) <= 2
							? [[original, city, state]]
							: []
				);
				return matched.length > 0 && matched.some((m) => m === true)
					? []
					: [[t.id, matched as [string, string, string][]]];
			})
		);
	}

	$: tracks = [{ value: '', name: 'None' }].concat(
		data.tracks.map((track) => ({
			value: track.id.toString(),
			name: track.name
		}))
	);

	let selected: typeof teams = [];
	$: teams = data.teams;

	$: nonCanonicalTeams = canonicalize(teams);
	$: schools = new Map(
		[
			...new Set(teams.map((t) => `${t.school}|${t.city ?? ''}|${t.state}`))
		].map(
			(s, i) =>
				[
					i,
					teams.flatMap((t) =>
						s === `${t.school}|${t.city ?? ''}|${t.state}` ? [t.id] : []
					)
				] as const
		)
	);
	$: teamSchools = new Map(
		[...schools.entries()].flatMap(([i, ids]) => ids.map((id) => [id, i]))
	);

	let showConfirmDelete = false;
	function confirmDelete() {
		const ids = selected.map((t) => t.id.toString());
		sendData({
			method: 'DELETE',
			body: { teams: ids },
			msgs: {
				info: 'Deleting teams...',
				success: 'Teams deleted!',
				error: 'Failed to delete teams!'
			}
		}).then(() => {
			selected = [];
		});
		teams = teams.filter((t) => !ids.includes(t.id.toString()));
	}

	let showAddTeam = false;
	let addTeamData: { [k in keyof Team]?: string } & { exhibition?: boolean } =
		{};
	$: addTeamValid =
		addTeamData.number &&
		addTeamData.school &&
		addTeamData.city &&
		addTeamData.state &&
		addTeamData.number.match(/\d+/) &&
		teams.every(
			(t) => t.number !== parseInt(/\d+/.exec(addTeamData.number!)?.[0] ?? '')
		) &&
		[...stateLookup.values()].find((s) => s === addTeamData.state);
	function openAddTeam() {
		showAddTeam = true;
	}
	function addTeam() {
		// TODO: validation, canonicalization
		const payloadData = {
			...addTeamData,
			number: parseInt(/\d+/.exec(addTeamData.number!)?.[0] ?? ''),
			trackId: addTeamData.trackId?.toString() || null
		};
		sendData({
			method: 'PUT',
			body: [payloadData],
			msgs: {
				info: 'Adding team...',
				success: 'Team added!',
				error: 'Failed to add team!'
			}
		}).then(() => {
			addTeamData = {};
		});
	}

	let showEditTeam = false;
	let editTeamData: Partial<Omit<Team, 'trackId'> & { trackId?: string }> = {};
	let editTeamObject: (typeof teams)[0] | undefined;
	function openEditTeam(team: bigint) {
		showEditTeam = true;
		editTeamObject = teams.find((t) => t.id === team);
		editTeamData = {
			...editTeamObject,
			trackId: editTeamObject?.trackId?.toString()
		};
	}
	function editTeam() {
		// TODO: validation, canonicalization

		const otherTeams =
			schools
				.get(teamSchools.get(editTeamData.id ?? BigInt(-1)) ?? -1)
				?.flatMap((id) =>
					id !== editTeamData.id
						? [
								{
									id: id.toString(),
									data: {
										school: editTeamData.school?.trim(),
										abbreviation: editTeamData.abbreviation?.trim() || null,
										city: editTeamData.city?.trim() || null,
										state: editTeamData.state
									}
								}
							]
						: []
				) ?? [];

		const sendTeamData = {
			number: parseInt(editTeamData.number as any),
			school: editTeamData.school?.trim(),
			abbreviation: editTeamData.abbreviation?.trim() || null,
			suffix: editTeamData.suffix?.trim() || null,
			city: editTeamData.city?.trim() || null,
			state: editTeamData.state,
			trackId: editTeamData.trackId || null,
			exhibition: editTeamData.exhibition,
			penalties: editTeamData.penalties
				? parseInt(editTeamData.penalties as any)
				: null
		};
		sendData({
			method: 'PATCH',
			body: [
				...otherTeams,
				{
					id: editTeamData.id?.toString(),
					data: sendTeamData
				}
			],
			multiple: true,
			msgs: {
				info: 'Updating team...',
				success: 'Team updated!',
				error: 'Failed to update team!'
			}
		});
	}

	let showImportTeams = false;
	let importTeamsData = '';
	let importGenerateNumbers = true;
	$: nextNumber = teams.reduce((acc, t) => Math.max(acc, t.number), 0) + 1;
	let parsedImportTeams: {
		Number: string | undefined;
		School: string | undefined;
		Abbreviation: string | undefined;
		Suffix: string | undefined;
		City: string | undefined;
		State: string | undefined;
		Track: string | undefined;
		Exhibition: string | undefined;
	}[] = [];
	let parsedError = '';
	$: {
		parsedError = '';
		parsedImportTeams = papaparse.parse(importTeamsData, {
			header: true,
			transformHeader: (h) =>
				[
					['number', 'Number'],
					['#', 'Number'],
					['school', 'School'],
					['abbrev', 'Abbreviation'],
					['suffix', 'Suffix'],
					['team', 'Suffix'],
					['city', 'City'],
					['state', 'State'],
					['track', 'Track'],
					['exhibition', 'Exhibition']
				].find((m) => h.toLowerCase().includes(m[0]))?.[1] ?? h,
			transform: (d) => d.trim()
		}).data as any;
		const missingFields: Set<string> = new Set();
		const invalidStates: Set<string> = new Set();
		const invalidTracks: Set<string> = new Set();
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
			if (
				t.State &&
				!stateLookup.has(t.State.toLowerCase()) &&
				![...stateLookup.values()].includes(t.State)
			) {
				invalidStates.add(t.State);
			}
			if (
				data.tournament.enableTracks &&
				t.Track &&
				!tracks.some((track) => track.name === t.Track)
			) {
				invalidTracks.add(t.Track);
			}
		});
		if (missingFields.size > 0) {
			parsedError += `Missing fields: ${[...missingFields].join(', ')}\n`;
		}
		if (invalidStates.size > 0) {
			parsedError = `Invalid states: ${[...invalidStates].join(', ')}\n`;
		}
		if (invalidTracks.size > 0) {
			parsedError = `Invalid tracks: ${[...invalidTracks].join(', ')}\n`;
		}
		if (!parsedError) {
			parsedImportTeams.forEach(async (t, i) => {
				if (importGenerateNumbers && !t.Number) {
					t.Number = (nextNumber + i).toString();
				} else {
					t.Number = parseInt(/\d+/.exec(t.Number!)?.[0] ?? '').toString();
				}
				if (stateLookup.has(t.State!.toLowerCase())) {
					t.State = stateLookup.get(t.State!.toLowerCase()) ?? t.State;
				}

				t.Exhibition &&= ['n', 'f', 'no', 'false', 'none'].includes(
					t.Exhibition.trim().toLowerCase()
				)
					? ''
					: 'true';
			});
		}
	}
	function openImportTeams() {
		showImportTeams = true;
	}
	function importTeams() {
		if (parsedError) return;
		sendData({
			method: 'PUT',
			body: parsedImportTeams.map((t) => ({
				number: parseInt(t.Number!),
				school: t.School,
				abbreviation: t.Abbreviation || null,
				suffix: t.Suffix || null,
				city: t.City || null,
				state: t.State,
				trackId: data.tournament.enableTracks
					? (tracks?.find((track) => track.name === t.Track)?.value ?? null)
					: null,
				exhibition: !!t.Exhibition
			})),
			msgs: {
				info: 'Adding teams...',
				success: 'Teams added!',
				error: 'Failed to add teams!'
			}
		}).then(() => {
			importTeamsData = '';
		});
	}

	let showCanonicalization = false;
	let canonicalSelection: Record<number, number> = {};
	function openCanonicalization() {
		canonicalSelection = {};
		showCanonicalization = true;
	}
	function saveCanonicalizations() {
		const data = Object.entries(canonicalSelection).flatMap(
			([schoolIdx, entryIdx]) => {
				return (
					schools.get(parseInt(schoolIdx))?.flatMap((id) => {
						const selected = nonCanonicalTeams.get(BigInt(id))?.[entryIdx];
						if (!selected) return [];
						return [
							{
								id: id.toString(),
								data: {
									school: selected[0],
									city: selected[1] || null,
									state: selected[2]
								}
							}
						];
					}) ?? []
				);
			}
		);
		sendData({
			method: 'PATCH',
			body: data,
			multiple: true,
			msgs: {
				info: 'Fixing canonicalizations...',
				success: 'Canonicalizations fixed!',
				error: 'Failed to fix canonicalizations!'
			}
		});
	}
</script>

<Head
	title="Teams | {data.tournament.year} {data.tournament.shortName} {data
		.tournament.division} | Duosmium Scoring"
/>

<div class="w-full flex justify-between flex-wrap mb-2">
	<Heading tag="h2" class="w-fit">Teams</Heading>
	<span class="space-x-4">
		<Button color="blue" on:click={openImportTeams}>Import Teams</Button>
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
		<TableBodyCell class="py-0 px-2">
			{formatSchool(team, 45)}
			{team.suffix
				? team.suffix.slice(0, 38) + (team.suffix.length > 38 ? '…' : '')
				: ''}{#if nonCanonicalTeams?.has(team.id)}<button
					on:click={openCanonicalization}
					><ExclamationCircleSolid
						size="sm"
						class="text-yellow-400 ml-1 inline align-text-top"
					/></button
				>
			{/if}
		</TableBodyCell>
		<TableBodyCell class="py-0 px-2"
			>{team.city ? team.city + ', ' : ''}{team.state}</TableBodyCell
		>
		{#if data.tournament.enableTracks}
			<TableBodyCell class="py-0 px-2"
				>{tracks.find((t) => t.value === team.trackId?.toString())?.name ??
					'None'}</TableBodyCell
			>
		{/if}
		<TableBodyCell class="py-0 px-2"
			>{team.exhibition ? 'Exhib. Team' : 'No'}</TableBodyCell
		>
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
	Are you sure you want to delete {selected.length} team{selected.length > 1
		? 's'
		: ''}? This action cannot be undone.
</ConfirmModal>

<Modal title="Add Team" bind:open={showAddTeam} autoclose outsideclose>
	<P><span class="text-red-600">*</span> Indicates required field.</P>

	<Label>
		Team Number: <span class="text-red-600">*</span>
		<Input
			class="mt-2 {!addTeamData.number ? 'ring-2 ring-red-600' : ''}"
			type="text"
			required
			bind:value={addTeamData.number}
		/>
		<span class="text-red-600 dark:text-red-400"
			>{#if addTeamData.number && !addTeamData.number.match(/\d+/)}
				Team number must have a number!
			{:else if teams.some((t) => t.number === parseInt(/\d+/.exec(addTeamData.number ?? '')?.[0] ?? ''))}
				Team {addTeamData.number} already exists!
			{/if}</span
		>
	</Label>
	<Label>
		School Name: <span class="text-red-600">*</span>
		<Input
			class="mt-2 {!addTeamData.school ? 'ring-2 ring-red-600' : ''}"
			type="text"
			required
			bind:value={addTeamData.school}
		/>
	</Label>
	<Label>
		<div>School Abbreviation:</div>
		<div class="text-sm">
			Optional, only if a school has a long name and common abbreviation.
		</div>
		<Input class="mt-2" type="text" bind:value={addTeamData.abbreviation} />
	</Label>
	<Label>
		<div>Team Name:</div>
		<div class="text-sm">Optional if a school only has one team.</div>
		<Input class="mt-2" type="text" bind:value={addTeamData.suffix} />
	</Label>
	<Label>
		City: <span class="text-red-600">*</span>
		<Input
			class="mt-2 {!addTeamData.city ? 'ring-2 ring-red-600' : ''}"
			type="text"
			required
			bind:value={addTeamData.city}
		/>
	</Label>
	<Label>
		State: <span class="text-red-600">*</span>
		<Select
			underline
			class="mt-2 rounded-lg {!addTeamData.state ? 'ring-2 ring-red-600' : ''}"
			items={states}
			bind:value={addTeamData.state}
		/>
	</Label>
	{#if data.tournament.enableTracks}
		<Label>
			Track:
			<Select
				underline
				class="mt-2"
				items={tracks}
				bind:value={addTeamData.trackId}
			/>
		</Label>
	{/if}
	<Checkbox bind:checked={addTeamData.exhibition}>Exhibition Team</Checkbox>
	<svelte:fragment slot="footer">
		<!-- TODO: validation -->
		<Button color="green" disabled={!addTeamValid} on:click={addTeam}
			>Add Team</Button
		>
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
		<div class="text-sm">
			Optional, only if a school has a long name and common abbreviation.
		</div>
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
		<Select
			underline
			class="mt-2"
			items={states}
			bind:value={editTeamData.state}
		/>
	</Label>
	{#if data.tournament.enableTracks}
		<Label>
			Track
			<Select
				underline
				class="mt-2"
				items={tracks}
				bind:value={editTeamData.trackId}
			/>
		</Label>
	{/if}
	<Checkbox bind:checked={editTeamData.exhibition}>Exhibition Team</Checkbox>
	<Label>
		Penalties
		<Input
			class="mt-2"
			type="number"
			required
			bind:value={editTeamData.penalties}
		/>
	</Label>

	<svelte:fragment slot="footer">
		<!-- TODO: validation -->
		<Button color="green" disabled={false} on:click={editTeam}>Save</Button>
		<Button color="alternative">Cancel</Button>
	</svelte:fragment>
</Modal>

<Modal title="Import Teams" bind:open={showImportTeams} autoclose outsideclose>
	<P>
		To import teams, paste in a CSV or TSV of team data. Include the following
		headings:
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
				<i>(Optional)</i>: If a school name is long and has a common
				abbreviation</Li
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
				<i>(Optional)</i>: Whether a team is an exhibition team, leave blank for
				non exhibition teams</Li
			>
		</List>
	</P>
	<Checkbox required bind:checked={importGenerateNumbers}
		>Generate Team Numbers</Checkbox
	>
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
						>{team.Track && data.tournament.enableTracks
							? `[${team.Track}] `
							: ''}</span
					><span class="dark:text-green-300 text-green-700">{team.School}</span
					><span class="dark:text-blue-300 text-blue-700"
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
		<Button
			color="green"
			disabled={parsedError.length !== 0}
			on:click={importTeams}>Save</Button
		>
		<Button color="alternative">Cancel</Button>
	</svelte:fragment>
</Modal>

<Modal
	title="Canonicalization Warnings"
	size="lg"
	bind:open={showCanonicalization}
	autoclose
	outsideclose
	classFooter="justify-end"
>
	<p>
		Schools that have not appeared in Duosmium Results are listed below. This
		could be because of an error in data entry, or simply because this is the
		first time a school is competing.
	</p>
	<p>
		Similar schools are suggested; if a suggestion is a match, please select and
		fix the issue below. We prefer the more specific entry with the city, if
		possible.
	</p>
	<p>
		If there are no suggestions, double check the school name and city. If
		everything is correct, you can safely ignore these warnings.
	</p>
	<ul class="list-disc pl-4 space-y-4 text-slate-800 dark:text-slate-200">
		{#each teams as team}
			{#if nonCanonicalTeams.has(team.id)}
				<li>
					<span class="font-bold">Team {team.number}:</span>
					<span class="text-orange-700 dark:text-orange-200"
						>{team.school},
						{team.city ? team.city + ', ' : ''}{team.state}</span
					>
					not found,
					{#if (nonCanonicalTeams.get(team.id)?.length ?? 0) > 0}
						did you mean:
						<ul class="ml-4">
							{#each nonCanonicalTeams.get(team.id) ?? [] as match, i}
								<li class="mt-1">
									<Radio
										name="T{team.id}"
										value={i}
										bind:group={canonicalSelection[
											teamSchools.get(team.id) ?? -1
										]}
										class="text-green-700 dark:text-green-200 text-base"
									>
										{match[0]}, {match[1] ? match[1] + ', ' : ''}{match[2]}
									</Radio>
								</li>
							{/each}
						</ul>
					{:else}
						are you sure this is the correct name?
					{/if}
				</li>
			{/if}
		{/each}
	</ul>
	<svelte:fragment slot="footer">
		{@const numSelected = Object.entries(canonicalSelection).length}
		{#if numSelected > 0}
			<Button color="green" on:click={saveCanonicalizations}
				>Save {numSelected} canonicalization{numSelected === 1
					? ''
					: 's'}</Button
			>
		{/if}
		<Button color="alternative">Cancel</Button>
	</svelte:fragment>
</Modal>
