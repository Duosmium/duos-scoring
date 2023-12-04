<script lang="ts">
	import type { PageData } from './$types';
	import Head from '$lib/components/Head.svelte';
	import {
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
		Select,
		Toast
	} from 'flowbite-svelte';
	import type { Tournament } from '@prisma/client';
	import { page } from '$app/stores';
	import { invalidateAll } from '$app/navigation';
	import { slide } from 'svelte/transition';

	export let data: PageData;

	const states = [
		{ value: 'AL', name: 'Alabama' },
		{ value: 'AK', name: 'Alaska' },
		{ value: 'AZ', name: 'Arizona' },
		{ value: 'AR', name: 'Arkansas' },
		{ value: 'CA', name: 'California' },
		{ value: 'nCA', name: 'Northern California (for regionals/states only)' },
		{ value: 'sCA', name: 'Southern California (for regionals/states only)' },
		{ value: 'CO', name: 'Colorado' },
		{ value: 'CT', name: 'Connecticut' },
		{ value: 'DE', name: 'Delaware' },
		{ value: 'DC', name: 'District of Columbia' },
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
	const levels = [
		{ value: 'INVITATIONAL', name: 'Invitational' },
		{ value: 'REGIONAL', name: 'Regional' },
		{ value: 'STATE', name: 'State' },
		{ value: 'NATIONAL', name: 'National' }
	];
	const divisions = [
		{ value: 'C', name: 'High School (Div. C)' },
		{ value: 'B', name: 'Middle School (Div. B)' },
		{ value: 'A', name: 'Elementary School (Div. A)' }
	];

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
			startDate: editTournamentData.startDate ? new Date(editTournamentData.startDate) : undefined,
			endDate: editTournamentData.endDate ? new Date(editTournamentData.endDate) : undefined,
			awardsDate: editTournamentData.awardsDate
				? new Date(editTournamentData.awardsDate)
				: undefined,
			enableTracks: editTournamentData.enableTracks || undefined,
			medals: parseInt(editTournamentData.medals as any) || undefined,
			trophies: parseInt(editTournamentData.trophies as any) || undefined,
			bids: parseInt(editTournamentData.bids as any) || undefined,
			drops: parseInt(editTournamentData.drops as any) || undefined,
			nOffset: parseInt(editTournamentData.nOffset as any) || undefined
		};
		fetch(`/t/${$page.params['id']}`, {
			method: 'PATCH',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(sendTournamentData) // TODO: validate
		}).then((res) => {
			if (res.status === 200) {
				addToastMessage('Tournament updated!', 'success');
				invalidateAll();
			} else {
				addToastMessage('Failed to update tournament!', 'error');
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
	title="TD Dashboard | {data.tournament.year} {data.tournament.shortName} {data.tournament
		.division} | Duosmium Scoring"
/>

<Heading tag="h1" class="text-4xl"
	>{data.tournament.year} {data.tournament.name} {data.tournament.division}</Heading
>

<!-- TODO: make this pretty -->
{#if data.role.role !== 'ES'}
	<div class="flex flex-row flex-wrap items-start gap-4">
		<Card size="sm">
			<P class="mb-2 text-2xl">{data.teams?.length} Teams</P>
			<P class="mb-2 text-2xl"
				>{data.events?.filter((e) => e.locked)?.length} / {data.events?.length} Events Done Grading</P
			>
			<P class="mb-2 text-2xl"
				>{data.events?.filter((e) => e.audited != null)?.length} / {data.events?.length} Events Audited</P
			>
		</Card>
		<Card size="xs">
			<Heading tag="h2" class="mb-2 text-2xl">Scores In</Heading>
			<List tag="ul">
				{#each data.events ?? [] as event}
					<Li>
						{event.name}: {event.scores.length} / {data.teams?.length}
					</Li>
				{:else}
					<Li>No events!</Li>
				{/each}
			</List>
		</Card>
		<Card size="lg">
			<span class="flex justify-between flex-row">
				<Heading tag="h2" class="mb-2 text-2xl w-fit">About Tournament</Heading>
				{#if data.role.role === 'TD'}
					<Button size="sm" on:click={openEditTournament}>Edit</Button>
				{/if}
			</span>
			<!-- TODO: Make this pretty -->
			<List
				tag="dl"
				class="text-gray-700 dark:text-gray-300 divide-y divide-gray-200 dark:divide-gray-700"
			>
				<div class="flex flex-col pb-3">
					<DescriptionList tag="dt">Name</DescriptionList>
					<DescriptionList tag="dd">{data.tournament.name}</DescriptionList>
				</div>
				<div class="flex flex-col pb-3">
					<DescriptionList tag="dt">Short Name</DescriptionList>
					<DescriptionList tag="dd">{data.tournament.shortName}</DescriptionList>
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
					<DescriptionList tag="dd">{data.tournament.level}</DescriptionList>
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
					<DescriptionList tag="dd">{data.tournament.startDate}</DescriptionList>
				</div>
				<div class="flex flex-col pb-3">
					<DescriptionList tag="dt">End Date</DescriptionList>
					<DescriptionList tag="dd">{data.tournament.endDate}</DescriptionList>
				</div>
				<div class="flex flex-col pb-3">
					<DescriptionList tag="dt">Awards Date</DescriptionList>
					<DescriptionList tag="dd">{data.tournament.awardsDate}</DescriptionList>
				</div>
				<div class="flex flex-col pb-3">
					<DescriptionList tag="dt">Tracks Enabled?</DescriptionList>
					<DescriptionList tag="dd">{data.tournament.enableTracks}</DescriptionList>
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
					<DescriptionList tag="dd">{data.tournament.bids}</DescriptionList>
				</div>
				<div class="flex flex-col pb-3">
					<DescriptionList tag="dt">Drops</DescriptionList>
					<DescriptionList tag="dd">{data.tournament.drops}</DescriptionList>
				</div>
				<div class="flex flex-col pb-3">
					<DescriptionList tag="dt">N Offset</DescriptionList>
					<DescriptionList tag="dd">{data.tournament.nOffset}</DescriptionList>
				</div>
			</List>
		</Card>
	</div>

	<Modal title="Edit Tournament Info" bind:open={showEditTournament} autoclose outsideclose>
		<Label>
			Name: <Input type="text" name="name" bind:value={editTournamentData.name} required />
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
			<Select name="state" items={states} bind:value={editTournamentData.state} required />
		</Label>
		<Label>
			Level:
			<Select name="level" items={levels} bind:value={editTournamentData.level} required />
		</Label>
		<Label>
			Division:
			<Select name="division" items={divisions} bind:value={editTournamentData.division} required />
		</Label>
		<Label>
			Year: <Input type="number" name="year" bind:value={editTournamentData.year} required />
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
			Medals: <Input type="number" name="medals" bind:value={editTournamentData.medals} />
		</Label>
		<Label>
			Trophies: <Input type="number" name="trophies" bind:value={editTournamentData.trophies} />
		</Label>
		<Label>
			Bids: <Input type="number" name="bids" bind:value={editTournamentData.bids} />
		</Label>
		<Label>
			N-Offset: <Input type="number" name="nOffset" bind:value={editTournamentData.nOffset} />
		</Label>
		<Label>
			Drops: <Input type="number" name="drops" bind:value={editTournamentData.drops} />
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
			<Li><a href="/t/{$page.params.id}/events/{event.id}">{event.name}</a></Li>
		{:else}
			<P>
				You have not yet been assigned to any events! Contact the tournament director if you believe
				this is an error.
			</P>
		{/each}
	</List>
{:else}
	<P>
		You have not yet been assigned to any events! Contact the tournament director if you believe
		this is an error.
	</P>
{/if}

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
