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
		Select,
		Button,
		Heading,
		Modal,
		Input,
		Toast,
		Textarea,
		List,
		Li,
		P,
		Alert
	} from 'flowbite-svelte';
	import { parse } from 'papaparse';
	import { page } from '$app/stores';
	import { slide } from 'svelte/transition';
	import { invalidateAll } from '$app/navigation';
	import type { Team } from '@prisma/client';

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
	$: tracks = data.tournament.tracks.map((track) => ({
		value: track.id.toString(),
		name: track.name
	}));

	let selectAll = false;
	$: teams = data.tournament.teams.map((t, i) => ({ ...t, index: i, checked: false }));

	let lastIndex = -1;
	function toggleCheck(id: bigint) {
		selectAll = false;
		if (!shiftDown) {
			lastIndex = teams.findIndex((t) => t.id === id);
			teams = teams.map((t) => (t.id === id ? { ...t, checked: !t.checked } : t));
		} else {
			const currentTeam = teams.find((t) => t.id === id);
			if (!currentTeam) return;
			const currentIndex = currentTeam.index;
			const currentStatus = currentTeam.checked;
			const minIndex = Math.min(currentIndex, lastIndex);
			const maxIndex = Math.max(currentIndex, lastIndex);
			teams = teams.map((t, i) =>
				i >= minIndex && i <= maxIndex ? { ...t, checked: !currentStatus } : t
			);
			lastIndex = currentIndex;
		}
	}

	function toggleAll() {
		selectAll = !selectAll;
		teams = teams.map((t) => ({ ...t, checked: selectAll }));
	}

	$: selected = teams.filter((t) => t.checked);

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
		const ids = selected.map((t) => t.id.toString());
		fetch(`/td/${$page.params['id']}/teams`, {
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

		addTeamData.number = parseInt(addTeamData.number as any);
		addTeamData.trackId = addTeamData.trackId || null;
		fetch(`/td/${$page.params['id']}/teams`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify([addTeamData]) // TODO: validate
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
	let editTeamData: Partial<Team> = {};
	function openEditTeam(team: bigint) {
		showEditTeam = true;
		editTeamData = { ...teams.find((t) => t.id === team) };
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
		fetch(`/td/${$page.params['id']}/teams`, {
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
		parsedImportTeams = parse(importTeamsData, { header: true }).data as any;
		const missingFields: Set<string> = new Set();
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
		});
		if (missingFields.size > 0) {
			parsedError = `Missing fields: ${[...missingFields].join(', ')}`;
		} else {
			parsedError = '';
		}
		if (importGenerateNumbers) {
			parsedImportTeams.forEach((t, i) => {
				t.Number = (nextNumber + i).toString();
			});
		}
	}
	function openImportTeams() {
		showImportTeams = true;
	}
	function importTeams() {
		if (parsedError) return;
		fetch(`/td/${$page.params['id']}/teams`, {
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
					// TODO: implement tracks
					// trackId: ,
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

	let messages: { text: string; type: 'success' | 'error' }[] = [];
	function addToastMessage(message: string, type: 'success' | 'error' = 'success') {
		messages = [...messages, { text: message, type }];
		setTimeout(() => {
			messages = messages.slice(1);
		}, 3000);
	}
</script>

<Head
	title="Teams | {data.tournament.year} {data.tournament.shortName} {data.tournament
		.division} | Duosmium Scoring"
/>

<svelte:window on:keydown={handleKeydown} on:keyup={handleKeyup} />

<div class="w-full flex justify-between flex-wrap mb-2">
	<Heading tag="h2" class="w-fit">Teams</Heading>
	<span class="space-x-4">
		<Button color="green" on:click={openImportTeams}>Import Teams</Button>
		<Button color="green" on:click={openAddTeam}>Add Team</Button>
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
				teams = teams.map((t) => ({ ...t, checked: false }));
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
		<TableHeadCell>Team #</TableHeadCell>
		<TableHeadCell>Team Name</TableHeadCell>
		<TableHeadCell>Location</TableHeadCell>
		<TableHeadCell>Track</TableHeadCell>
		<TableHeadCell>Exhibition</TableHeadCell>
		<TableHeadCell>Penalties</TableHeadCell>
		<TableHeadCell>
			<span class="sr-only"> Edit </span>
		</TableHeadCell>
	</TableHead>
	<TableBody tableBodyClass="divide-y">
		{#if teams.length === 0}
			<TableBodyRow>
				<TableBodyCell colspan="7" class="text-center">
					<p>No teams have been added yet.</p>
				</TableBodyCell>
			</TableBodyRow>
		{:else}
			{#each teams as team}
				<TableBodyRow>
					<TableBodyCell class="!p-4">
						<Checkbox
							on:click={() => {
								toggleCheck(team.id);
							}}
							checked={team.checked}
						/>
					</TableBodyCell>
					<TableBodyCell>{team.number}</TableBodyCell>
					<TableBodyCell
						>{team.abbreviation ??
							team.school.slice(0, 45) + (team.school.length > 45 ? '…' : '')}{team.suffix
							? ' ' + team.suffix.slice(0, 38) + (team.suffix.length > 38 ? '…' : '')
							: ''}</TableBodyCell
					>
					<TableBodyCell>{team.city ? team.city + ', ' : ''}{team.state}</TableBodyCell>
					<TableBodyCell>{team.trackId ?? 'None'}</TableBodyCell>
					<TableBodyCell>{team.exhibition ? 'Exhib. Team' : 'No'}</TableBodyCell>
					<TableBodyCell>{team.penalties ?? 'None'}</TableBodyCell>
					<TableBodyCell>
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
	title="Delete Teams"
	bind:open={showConfirmDelete}
	autoclose
	outsideclose
	on:close={() => {
		confirmDeleteText = '';
	}}
>
	<p class="text-base leading-relaxed text-gray-500 dark:text-gray-400">
		Are you sure you want to delete {selected.length} team{selected.length > 1 ? 's' : ''}? This
		action cannot be undone.
	</p>
	<Label>
		Type "confirm" to delete these teams.
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
			}}>I accept</Button
		>
		<Button color="alternative">Cancel</Button>
	</svelte:fragment>
</Modal>

<Modal title="Add Team" bind:open={showAddTeam} autoclose outsideclose>
	<Label>
		Team Number
		<Input class="mt-2" type="text" required bind:value={addTeamData.number} />
	</Label>
	<Label>
		School Name
		<Input class="mt-2" type="text" required bind:value={addTeamData.school} />
	</Label>
	<Label>
		<div>School Abbreviation</div>
		<div class="text-sm">Optional, only if a school has a long name and common abbreviation.</div>
		<Input class="mt-2" type="text" bind:value={addTeamData.abbreviation} />
	</Label>
	<Label>
		<div>Team Name</div>
		<div class="text-sm">Optional if a school only has one team.</div>
		<Input class="mt-2" type="text" bind:value={addTeamData.suffix} />
	</Label>
	<Label>
		City
		<Input class="mt-2" type="text" required bind:value={addTeamData.city} />
	</Label>
	<Label>
		State
		<Select underline class="mt-2" items={states} bind:value={addTeamData.state} />
	</Label>
	<Label>
		Track
		<Select underline class="mt-2" items={tracks} bind:value={addTeamData.trackId} />
	</Label>
	<Label>
		Exhibition Team
		<Checkbox class="ml-2" bind:checked={addTeamData.exhibition} />
	</Label>

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
	<Label>
		Track
		<Select underline class="mt-2" items={tracks} bind:value={editTeamData.trackId} />
	</Label>
	<Label>
		Exhibition Team
		<Checkbox class="ml-2" bind:checked={editTeamData.exhibition} />
	</Label>
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
			<Li
				><code class="dark:text-red-300 text-red-700">Track</code>
				<i>(Optional)</i>: The name of the track the team is competing in
			</Li>
			<Li
				><code class="dark:text-orange-300 text-orange-700">Exhibition</code>
				<i>(Optional)</i>: Whether a team is an exhibition team, leave blank for non exhibition
				teams</Li
			>
		</List>
	</P>
	<Label>
		Generate Team Numbers
		<Checkbox class="ml-2" required bind:checked={importGenerateNumbers} />
	</Label>
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
					<span class="dark:text-red-300 text-red-700">{team.Track ? `[${team.Track}] ` : ''}</span
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
