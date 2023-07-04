<script lang="ts">
	import type { ActionData } from './$types';
	import Head from '$lib/components/Head.svelte';
	import { enhance } from '$app/forms';
	import { Button, Checkbox, Input, Label, Select } from 'flowbite-svelte';

	export let form: ActionData;

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
</script>

<Head title="Create Tournament | Duosmium Scoring" />

<h1>Create a new tournament!</h1>

<h2>General Info</h2>

<form use:enhance method="post">
	<Label>
		Name: <Input type="text" name="name" value={form?.returned.name} required />
	</Label>
	<Label>
		Short Name: <Input type="text" name="shortName" value={form?.returned.shortName} required />
	</Label>
	<Label>
		Location: <Input type="text" name="location" value={form?.returned.location} required />
	</Label>
	<Label>
		State:
		<Select name="state" items={states} value={form?.returned.state} required />
	</Label>
	<Label>
		Level:
		<Select name="level" items={levels} value={form?.returned.level} required />
	</Label>
	<Label>
		Division:
		<Select name="division" items={divisions} value={form?.returned.division} required />
	</Label>
	<Label>
		Year: <Input type="number" name="year" value={form?.returned.year} required />
	</Label>
	<Label>
		Start Date: <Input type="date" name="startDate" value={form?.returned.startDate} required />
	</Label>
	<Label>
		End Date: <Input type="date" name="endDate" value={form?.returned.endDate} required />
	</Label>
	<Label>
		Awards Date: <Input type="date" name="awardsDate" value={form?.returned.awardsDate} required />
	</Label>
	<Checkbox name="enableTracks" checked={form?.returned.enableTracks}>Enable Tracks</Checkbox>
	<Label>
		Medals: <Input type="number" name="medals" value={form?.returned.medals} />
	</Label>
	<Label>
		Trophies: <Input type="number" name="trophies" value={form?.returned.trophies} />
	</Label>
	<Label>
		Bids: <Input type="number" name="bids" value={form?.returned.bids} />
	</Label>
	<Label>
		N-Offset: <Input type="number" name="nOffset" value={form?.returned.nOffset} />
	</Label>
	<Label>
		Drops: <Input type="number" name="drops" value={form?.returned.drops} />
	</Label>
	<Button type="submit">Save</Button>
</form>

<style>
	form {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}
</style>
