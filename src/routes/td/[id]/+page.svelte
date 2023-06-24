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
		Select
	} from 'flowbite-svelte';

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
	// TODO: implement this
</script>

<Head
	title="TD Dashboard | {data.tournament.year} {data.tournament.shortName} {data.tournament
		.division} | Duosmium Scoring"
/>

<Heading tag="h1" class="text-4xl"
	>{data.tournament.year} {data.tournament.name} {data.tournament.division}</Heading
>

<!-- TODO: make this pretty -->
<div class="flex flex-row flex-wrap items-start gap-4">
	<Card size="sm">
		<P class="mb-2 text-2xl">{data.tournament.teams.length} Teams</P>
		<P class="mb-2 text-2xl"
			>{data.tournament.events.filter((e) => e.audited.length !== 0).length} Events Audited</P
		>
		<P class="mb-2 text-2xl"
			>{data.tournament.events.filter((e) => e.sorted.length !== 0).length} Events Sorted</P
		>
	</Card>
	<Card size="xs">
		<Heading tag="h2" class="mb-2 text-2xl">Events</Heading>
		<List tag="ul">
			{#each data.tournament.events as event}
				<Li>
					{event.name}: {event.scores.length}
				</Li>
			{/each}
		</List>
	</Card>
	<Card size="lg">
		<span class="flex justify-between flex-row">
			<Heading tag="h2" class="mb-2 text-2xl w-fit">About Tournament</Heading>
			<Button
				size="sm"
				on:click={() => {
					showEditTournament = true;
				}}>Edit</Button
			>
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
		Name: <Input type="text" name="name" value={data.tournament.name} required />
	</Label>
	<Label>
		Short Name: <Input type="text" name="shortName" value={data.tournament.shortName} required />
	</Label>
	<Label>
		Location: <Input type="text" name="location" value={data.tournament.location} required />
	</Label>
	<Label>
		State:
		<Select name="state" items={states} value={data.tournament.state} required />
	</Label>
	<Label>
		Level:
		<Select name="level" items={levels} value={data.tournament.level} required />
	</Label>
	<Label>
		Division:
		<Select name="division" items={divisions} value={data.tournament.division} required />
	</Label>
	<Label>
		Year: <Input type="number" name="year" value={data.tournament.year} required />
	</Label>
	<Label>
		Start Date: <Input
			type="date"
			name="startDate"
			value={data.tournament.startDate.toISOString().slice(0, 10)}
			required
		/>
	</Label>
	<Label>
		End Date: <Input
			type="date"
			name="endDate"
			value={data.tournament.endDate.toISOString().slice(0, 10)}
			required
		/>
	</Label>
	<Label>
		Awards Date: <Input
			type="date"
			name="awardsDate"
			value={data.tournament.awardsDate.toISOString().slice(0, 10)}
			required
		/>
	</Label>
	<Label>
		Enable Tracks: <Checkbox name="enableTracks" checked={data.tournament.enableTracks} />
	</Label>
	<Label>
		Medals: <Input type="number" name="medals" value={data.tournament.medals} />
	</Label>
	<Label>
		Trophies: <Input type="number" name="trophies" value={data.tournament.trophies} />
	</Label>
	<Label>
		Bids: <Input type="number" name="bids" value={data.tournament.bids} />
	</Label>
	<Label>
		N-Offset: <Input type="number" name="nOffset" value={data.tournament.nOffset} />
	</Label>
	<Label>
		Drops: <Input type="number" name="drops" value={data.tournament.drops} />
	</Label>
	<Button type="submit">Save</Button>
</Modal>
