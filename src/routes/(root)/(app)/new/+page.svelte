<script lang="ts">
	import Head from '$lib/components/Head.svelte';
	import {
		Button,
		Checkbox,
		Input,
		Label,
		Radio,
		Select,
		Timeline
	} from 'flowbite-svelte';
	import Step from '$lib/components/Step.svelte';

	import type { Tournament } from '$drizzle/types';
	import type { Snapshot } from './$types';
	import { divisions, levels, states } from './consts';
	import { shortName } from '$lib/sciolyffHelpers';
	import { redirect } from '@sveltejs/kit';

	let fields: Partial<Omit<Tournament, 'id'>> = {};
	let dirty: { [k in keyof Tournament]?: boolean } = {};

	let step = 0;
	function commit() {
		fields.shortName = dirty.shortName
			? fields.shortName
			: shortName(fields.name);
		fields.endDate = dirty.endDate ? fields.endDate : fields.startDate;
		fields.awardsDate = dirty.awardsDate ? fields.awardsDate : fields.endDate;

		step = Object.values(fields).filter((v) => v).length;
	}

	export const snapshot: Snapshot<typeof fields> = {
		capture: () => fields,
		restore: (value) => (fields = value)
	};

	async function createTournament() {
		// TODO: Validate fields
		console.log(fields);
		const formData = new FormData();
		for (const [key, value] of Object.entries(fields)) {
			formData.append(key, value?.toString() ?? '');
		}
		const resp = await fetch('/new', {
			method: 'POST',
			body: formData
		});
		if (resp.ok) {
			redirect(303, '/dashboard');
		} else {
			// TODO: Handle error
		}
	}
</script>

<Head title="Create Tournament | Duosmium Scoring" />

<h1 class="text-center">Create a new tournament!</h1>

<Timeline class="mt-14 max-w-3xl mx-auto">
	<Step {step} thisStep={0} title="First, what type of tournament is this?">
		<ul
			class="items-center w-full rounded-lg border border-gray-200 sm:flex dark:bg-gray-800 dark:border-gray-600 divide-x rtl:divide-x-reverse divide-gray-200 dark:divide-gray-600"
		>
			{#each levels as { value, name }}
				<li class="w-full">
					<Radio
						on:change={() => {
							dirty.level = true;
							commit();
						}}
						bind:group={fields.level}
						{value}
						name="tournament-level"
						class="p-3">{name}</Radio
					>
				</li>
			{/each}
		</ul>
	</Step>
	<Step {step} thisStep={1} title="Where is this tournament being held?">
		<Select
			on:change={() => {
				dirty.state = true;
				commit();
			}}
			name="state"
			items={states}
			bind:value={fields.state}
			required
		/>
	</Step>
	<Step {step} thisStep={2} title="Now for a name.">
		<Input
			on:change={() => {
				dirty.name = true;
				commit();
			}}
			type="text"
			name="name"
			bind:value={fields.name}
			required
		/>
	</Step>
	<Step {step} thisStep={3} title="Short Name">
		<Input
			on:change={() => {
				dirty.shortName = true;
				commit();
			}}
			type="text"
			name="shortName"
			bind:value={fields.shortName}
			required
		/>
	</Step>
	<Step {step} thisStep={4} title="Location">
		<Input
			on:change={() => {
				dirty.location = true;
				commit();
			}}
			type="text"
			name="location"
			bind:value={fields.location}
			required
		/>
	</Step>
	<Step {step} thisStep={5} title="Division">
		<Select
			on:change={() => {
				dirty.division = true;
				commit();
			}}
			name="division"
			items={divisions}
			bind:value={fields.division}
			required
		/>
	</Step>
	<Step {step} thisStep={6} title="Year">
		<Input
			on:change={() => {
				dirty.year = true;
				commit();
			}}
			type="number"
			name="year"
			bind:value={fields.year}
			required
		/>
	</Step>
	<Step {step} thisStep={7} title="When does your tournament start and end?">
		<p>If your tournament is one day, set them to the same day.</p>
		<div class="flex flex-wrap items-center gap-4">
			<Input
				class="flex-1"
				on:change={() => {
					dirty.startDate = true;
					commit();
				}}
				type="date"
				bind:value={fields.startDate}
				required
			/>
			<span>to</span>
			<Input
				class="flex-1"
				on:change={() => {
					dirty.endDate = true;
					commit();
				}}
				type="date"
				bind:value={fields.endDate}
				required
			/>
		</div>
	</Step>
	<Step {step} thisStep={8} title="What day is your awards ceremony?">
		<Input
			on:change={() => {
				dirty.awardsDate = true;
				commit();
			}}
			type="date"
			bind:value={fields.awardsDate}
			required
		/>
	</Step>
	<Step {step} thisStep={9} title="Optional settings">
		<Checkbox
			on:change={() => {
				dirty.enableTracks = true;
				commit();
			}}
			name="enableTracks"
			bind:checked={fields.enableTracks}>Enable Tracks</Checkbox
		>
		<Label>
			Number of Medals Awarded (Optional, default 6): <Input
				on:change={() => {
					dirty.medals = true;
					commit();
				}}
				type="number"
				name="medals"
				bind:value={fields.medals}
			/>
		</Label>
		<Label>
			Number of Trophies Awarded (Optional, default 3): <Input
				on:change={() => {
					dirty.trophies = true;
					commit();
				}}
				type="number"
				name="trophies"
				bind:value={fields.trophies}
			/>
		</Label>
		<Label>
			Bids (Optional): <Input
				on:change={() => {
					dirty.bids = true;
					commit();
				}}
				type="number"
				name="bids"
				bind:value={fields.bids}
			/>
		</Label>
		<Label>
			N-Offset (Optional): <Input
				on:change={() => {
					dirty.nOffset = true;
					commit();
				}}
				type="number"
				name="nOffset"
				bind:value={fields.nOffset}
			/>
		</Label>
		<Label>
			Drops (Optional): <Input
				on:change={() => {
					dirty.drops = true;
					commit();
				}}
				type="number"
				name="drops"
				bind:value={fields.drops}
			/>
		</Label>
	</Step>
	<Step {step} thisStep={10} title="Finish!">
		<p>
			Please review your tournament information. If everything looks good, click
			"Create Tournament" to create your tournament.
		</p>
		<Button on:click={createTournament}>Create Tournament</Button>
	</Step>
</Timeline>

<style>
</style>
