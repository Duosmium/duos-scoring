<script lang="ts">
	import Head from '$lib/components/Head.svelte';
	import {
		Button,
		Input,
		Label,
		Radio,
		Select,
		Timeline,
		Toggle
	} from 'flowbite-svelte';
	import Step from '$lib/components/Step.svelte';

	import type { Tournament } from '$drizzle/types';
	import type { Snapshot } from './$types';
	import { divisions, levels, stateOrgs, states } from '$lib/data/consts';
	import { seasonYear, shortName } from '$lib/sciolyffHelpers';
	import { addToastMessage, clearToasts } from '$lib/components/Toasts.svelte';
	import { setContext, tick } from 'svelte';
	import { writable } from 'svelte/store';
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';

	let defaults = {
		medals: 6,
		trophies: 3
	};
	let fields: Partial<Omit<Tournament, 'id'>> = Object.assign({}, defaults);
	let dirty: { [k in keyof Tournament]?: boolean } = {};
	let step = 0;

	let renumberFuncs: (() => void)[] = [];
	setContext('renumber', renumberFuncs);
	let stepStore = writable(0);
	setContext('step', stepStore);

	function renumber() {
		dirty = {};
		dirty.level = true;
		fields = Object.assign({ level: fields.level }, defaults);
		commit();
		stepStore.set(step - 1);
		renumberFuncs.forEach((r) => r());
	}

	function commit() {
		fields.shortName = dirty.shortName
			? fields.shortName
			: shortName(fields.name);
		fields.startDate = dirty.startDate ? fields.startDate : fields.endDate;
		fields.endDate = dirty.endDate ? fields.endDate : fields.startDate;
		fields.awardsDate = dirty.awardsDate ? fields.awardsDate : fields.endDate;
		fields.year = dirty.year
			? fields.year
			: fields.startDate &&
				seasonYear(new Date(fields.startDate || Date.now()));

		if (fields.level === 'NATIONAL') {
			fields.name = 'National Tournament';
			fields.shortName = 'Nationals';
		}
		if (fields.level === 'STATE') {
			fields.name = `${stateOrgs.find((s) => s.value === fields.state)?.name} Science Olympiad State Tournament`;
			fields.shortName = `${fields.state} States`;
		}

		step = Object.values(fields).filter((v) => v != undefined).length;
	}

	export const snapshot: Snapshot<typeof fields> = {
		capture: () => fields,
		restore: (value) => (fields = value)
	};

	let creating = false;
	async function createTournament() {
		// TODO: Validate fields
		if (creating || invalid) return;
		creating = true;
		addToastMessage('Creating tournament...', 'info');
		const formData = new FormData();
		for (const [key, value] of Object.entries(fields)) {
			formData.append(key, value?.toString() ?? '');
		}
		const resp = await fetch('/new', {
			method: 'POST',
			body: formData
		});
		creating = false;
		if (resp.ok) {
			goto('/dashboard', { invalidateAll: true });
			clearToasts();
			addToastMessage('Tournament created!', 'success');
		} else {
			clearToasts();
			addToastMessage('Failed to create tournament!', 'error');
			// TODO: Handle error
		}
	}

	let invalid = false;
	$: tick().then(() => {
		invalid =
			fields && browser && document.querySelectorAll('.note').length > 0;
	});
</script>

<Head title="Create Tournament | Duosmium Scoring" />

<h1 class="text-center">Create a new tournament!</h1>

<Timeline class="mt-14 max-w-3xl mx-auto">
	<Step {step} title="First, what type of tournament is this?">
		<ul
			class="items-center w-full rounded-lg border border-gray-200 sm:flex dark:bg-gray-800 dark:border-gray-600 divide-x rtl:divide-x-reverse divide-gray-200 dark:divide-gray-600"
		>
			{#each levels as { value, name }}
				<li class="w-full">
					<Radio
						on:change={() => {
							renumber();
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
	<Step {step} title="In which state is this tournament being held?">
		{#if fields.level === 'INVITATIONAL'}
			<p>
				For virtual invitationals, this is the state organization that the
				tournament is registered under.
			</p>
		{:else if fields.level === 'NATIONAL'}
			<p>This should be the state of the hosting university.</p>
		{/if}
		<Select
			on:change={() => {
				dirty.state = true;
				commit();
			}}
			items={fields.level === 'INVITATIONAL' ? states : stateOrgs}
			bind:value={fields.state}
		/>
		{#if dirty.state && !fields.state}
			<p class="note">State is required!</p>
		{/if}
	</Step>
	<Step
		{step}
		hide={fields.level === 'STATE' || fields.level === 'NATIONAL'}
		title="Now for a name."
	>
		{#if fields.level === 'INVITATIONAL'}
			<p>
				Names should be title case and should end in "Science Olympiad
				Invitational".
			</p>
		{:else}
			<p>
				Names should be title case, and should end in "Regional Tournament".
			</p>
		{/if}
		<Input
			on:change={() => {
				dirty.name = true;
				commit();
			}}
			type="text"
			bind:value={fields.name}
			placeholder={fields.level === 'INVITATIONAL'
				? 'Local School Science Olympiad Invitational'
				: 'Local County Regional Tournament'}
		/>
		{#if dirty.name && !fields.name}
			<p class="note">Name is required!</p>
		{/if}
	</Step>
	<Step
		{step}
		hide={fields.level === 'STATE' || fields.level === 'NATIONAL'}
		title="Optional Short Name"
	>
		<p>
			If your tournament goes by a shorter common name, enter it here. We've
			generated one based on the full name.
		</p>
		<Input
			on:change={() => {
				dirty.shortName = true;
				commit();
			}}
			type="text"
			bind:value={fields.shortName}
		/>
		{#if (fields.shortName?.length ?? 0) > (fields.name?.length ?? 0)}
			<p class="note">Your short name should be shorter than the full name!</p>
		{/if}
	</Step>
	<Step {step} title="Tournament Location">
		<p>
			This is typically the name of the host school or university. For virtual
			tournaments, put "Online".
		</p>
		<Input
			on:change={() => {
				dirty.location = true;
				commit();
			}}
			type="text"
			bind:value={fields.location}
		/>
		{#if dirty.location && !fields.location}
			<p class="note">Location is required!</p>
		{/if}
	</Step>
	<Step {step} title="Division">
		<p>
			If your tournament is running multiple divisions, you'll have to a new
			tournament for each division.
		</p>
		<Select
			on:change={() => {
				dirty.division = true;
				commit();
			}}
			items={divisions}
			bind:value={fields.division}
		/>
		{#if dirty.division && !fields.division}
			<p class="note">Division is required!</p>
		{/if}
	</Step>
	<Step {step} fieldCount={2} title="When does your tournament start and end?">
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
			/>
		</div>
		{#if (fields.startDate ?? 0) > (fields.endDate ?? Infinity)}
			<p class="note">Tournament should start before it ends!</p>
		{/if}
		{#if (dirty.startDate && !fields.startDate) || (dirty.endDate && !fields.endDate)}
			<p class="note">Dates are required!</p>
		{/if}
	</Step>
	<Step {step} title="What day is your awards ceremony?">
		<Input
			on:change={() => {
				dirty.awardsDate = true;
				commit();
			}}
			type="date"
			bind:value={fields.awardsDate}
		/>
		{#if (fields.endDate ?? 0) > (fields.awardsDate ?? Infinity)}
			<p class="note">Awards should come after the tournament ends!</p>
		{/if}
		{#if dirty.awardsDate && !fields.awardsDate}
			<p class="note">Dates are required!</p>
		{/if}
	</Step>
	<Step {step} title="Season Year">
		<p>This is the year of the Rules Manual your tournament is using.</p>
		<Input
			on:change={() => {
				dirty.year = true;
				commit();
			}}
			type="number"
			bind:value={fields.year}
		/>
		{#if dirty.year && !fields.year}
			<p class="note">Season year is required!</p>
		{/if}
	</Step>
	<Step
		{step}
		hide={fields.level === 'NATIONAL' || fields.level === 'INVITATIONAL'}
		title="How many schools are progressing to the {fields.level === 'STATE'
			? 'National'
			: 'State'} Tournament from this competition?"
	>
		<div class="flex flex-wrap items-center gap-4">
			<Input
				on:change={() => {
					dirty.bids = true;
					commit();
				}}
				type="number"
				bind:value={fields.bids}
			/>
		</div>
		{#if dirty.bids && !fields.bids}
			<p class="note">Bids are required!</p>
		{/if}
	</Step>
	<Step
		{step}
		fieldCount={0}
		title="How many medals and trophies are you awarding?"
	>
		<p>
			These values will help generate award slides and highlight results, and
			can be changed later too.
		</p>
		<div class="flex flex-wrap items-center gap-4">
			<Label class="flex-1">
				Medals:
				<Input
					on:change={() => {
						dirty.medals = true;
						commit();
					}}
					type="number"
					bind:value={fields.medals}
				/>
			</Label>
			<Label class="flex-1">
				Trophies:
				<Input
					on:change={() => {
						dirty.trophies = true;
						commit();
					}}
					type="number"
					bind:value={fields.trophies}
				/>
			</Label>
		</div>
	</Step>
	<Step {step} fieldCount={0} title="Additional settings">
		<p>
			If you don't know what these are, they probably don't apply. You can also
			change these settings later at any time.
		</p>
		<Toggle
			class="mb-2"
			on:change={() => {
				dirty.enableTracks = true;
				commit();
			}}
			bind:checked={fields.enableTracks}>Enable Tracks</Toggle
		>

		<Label class="mb-2">
			Drops (Optional): <Input
				on:change={() => {
					dirty.drops = true;
					commit();
				}}
				type="number"
				bind:value={fields.drops}
			/>
		</Label>
		<Label>
			N-Offset (Optional): <Input
				on:change={() => {
					dirty.nOffset = true;
					commit();
				}}
				type="number"
				bind:value={fields.nOffset}
			/>
		</Label>
	</Step>
	<Step {step} title="Finish!">
		<p>
			Please review your tournament information. If everything looks good, click
			"Create Tournament" to create your tournament.
		</p>
		<Button disabled={invalid || creating} on:click={createTournament}
			>Create Tournament</Button
		>
		{#if invalid}
			<p class="text-sm text-red-700 dark:text-red-400">
				Please fix the errors above before continuing.
			</p>
		{/if}
	</Step>
</Timeline>

<style lang="postcss">
	.note {
		@apply text-sm text-red-700 dark:text-red-400;
	}
</style>
