<script lang="ts">
	import type { ScoreStatus } from '$drizzle/types';
	import type { CheckboxValue } from '../components/Checkbox.svelte';
	import Checklist from '../components/Checklist.svelte';
	import Disqualified from '../components/Disqualified.svelte';
	import Number from '../components/questions/Number.svelte';
	import Select from '../components/questions/Select.svelte';
	import TF from '../components/questions/TF.svelte';
	import Section from '../components/Section.svelte';

	export let teamNumber: number;
	export let teamName: string;
	export let checklistData: DbJson.ChecklistData;

	let score: number;
	let tier: number;
	let status: ScoreStatus;
	let tiebreak: number[];
	let dqed: boolean;

	const designLogOptions = ['Complete', 'Partial', 'Missing'] as const;
	const heliOptions = ['A', 'B'] as const;
	const logHighlight = (
		value: (typeof designLogOptions)[number] | null | undefined
	) => {
		if (value === 'Complete') {
			return 'green';
		}
		if (value === 'Partial') {
			return 'yellow';
		}
		if (value === 'Missing') {
			return 'yellow';
		}
		if (value === null) {
			return 'red';
		}
		return 'gray';
	};

	let metParamsA: CheckboxValue;
	let metParamsB: CheckboxValue;
	let designLog: (typeof designLogOptions)[number] | null;
	let plane1: (typeof heliOptions)[number] | null;
	let plane2: (typeof heliOptions)[number] | null;
	let time11: number | null;
	let time12: number | null;
	let time13: number | null;
	let time21: number | null;
	let time22: number | null;
	let time23: number | null;

	$: bonus = designLog === 'Complete' ? 1.2 : designLog === 'Partial' ? 1.1 : 1;
	$: score1 =
		([time11, time12, time13]
			.filter((t) => t != null)
			.sort((a, b) => a - b)[1] ?? 0) * bonus;
	$: penalty1 =
		(plane1 === 'A' && !metParamsA) || (plane1 === 'B' && !metParamsB) ? 0 : 1;
	$: score2 =
		([time21, time22, time23]
			.filter((t) => t != null)
			.sort((a, b) => a - b)[1] ?? 0) * bonus;
	$: penalty2 =
		(plane2 === 'A' && !metParamsA) || (plane2 === 'B' && !metParamsB) ? 0 : 1;

	$: console.log({ bonus, score1, penalty1, score2, penalty2 });

	$: score =
		Math.max(score1 * penalty1, score2 * penalty2) || Math.max(score1, score2);
	$: tier = penalty1 + penalty2 === 0 ? 2 : 1;
	$: status = dqed
		? 'DISQUALIFICATION'
		: $metParamsA === 'Blank' && $metParamsB === 'Blank'
			? 'NOSHOW'
			: 'COMPETED';
	$: tiebreak = [Math.min(score1 * penalty1, score2 * penalty2)];
</script>

<Checklist
	event="Helicopter B/C"
	year={2025}
	{score}
	{tier}
	{status}
	{teamNumber}
	{teamName}
	{tiebreak}
	{...$$restProps}
	bind:checklistData
>
	<Section title="Check In (UP TO 2 HELICOPTERS)">
		{@const rules = {
			'3.a.':
				'If kits are used, they do not contain any pre-glued joints or pre-covered surfaces.',
			'3.b.':
				'A flat balsa wood disc, large enough to cover a dime, is the upper most part of the helicopter, the part that would touch a flat ceiling first during flight.',
			'3.c.':
				'Boron filaments are not used in the construction of the aircraft or box.',
			'3.d.':
				'The aircraft in its flight configuration & during flight fit into a team-provided rectangular box of 32.0 cm x 24.0 cm x 47.0 cm.',
			'3.e.':
				'No change in chord, span, length, or total lifting area can occur after removing the helicopter from its box and throughout the flight itself.',
			'3.f.':
				'No other lifting surfaces, except for up to three fixed pitch rotors are used.',
			'3.g.':
				'Total mass of the aircraft, excluding the rubber motor(s), is 4.00 g or more.',
			'3.h.':
				'Rotors are constructed by the participants. Commercially available rotors or propellers are not used in whole or part. Commercial rotor thrust bearings may be used.',
			'3.i.':
				'The helicopter is powered by rubber motor(s). Motor(s) must be removable for check-in.',
			'3.k.':
				'Students are able to answer questions regarding the design, construction, and operation of the device per the Building Policy found on www.soinc.org',
			'3.l.':
				'Aircraft are labeled so the Event Supervisor can easily identify to which team it belongs.',
			'5.b.':
				'Participants do not receive outside assistance, materials, or communication once they enter the cordoned off competition area to practice, to trim, for inspection, or to compete.',
			'5.e.ix.': 'Participants do not steer the helicopter during flight.',
			'5.e.x.':
				'Students are on the floor to launch and do not use aids to increase launch height.'
		}}
		<TF bind:checkbox={metParamsA} linkChildren numberItem>
			<strong
				>DEVICE A MEETS ALL CONSTRUCTION AND COMPETITION PARAMETERS.</strong
			>
			<svelte:fragment slot="children">
				{#each Object.entries(rules) as [rule, text]}
					<TF {rule}>{text}</TF>
				{/each}
			</svelte:fragment>
		</TF>
		<TF bind:checkbox={metParamsB} linkChildren numberItem>
			<strong
				>DEVICE B MEETS ALL CONSTRUCTION AND COMPETITION PARAMETERS.</strong
			>
			<svelte:fragment slot="children">
				{#each Object.entries(rules) as [rule, text]}
					<TF {rule}>{text}</TF>
				{/each}
			</svelte:fragment>
		</TF>
	</Section>

	<Section title="Design Log">
		<Select
			bind:value={designLog}
			highlightFunction={logHighlight}
			options={designLogOptions}
			rule="4."
			numberItem
		>
			Is the Flight Log complete, incomplete, or not present?
		</Select>
	</Section>

	<Section title="1st Flight">
		<Select bind:value={plane1} options={heliOptions} numberItem>
			Which helicopter from above was used?
		</Select>
		<Number bind:value={time11} numberItem min={0}>Timer 1</Number>
		<Number bind:value={time12} numberItem min={0}>Timer 2</Number>
		<Number bind:value={time13} numberItem min={0}>Timer 3</Number>
	</Section>

	<Section title="2nd Flight">
		<Select bind:value={plane2} options={heliOptions} numberItem>
			Which helicopter from above was used?
		</Select>
		<Number bind:value={time21} numberItem min={0}>Timer 1</Number>
		<Number bind:value={time22} numberItem min={0}>Timer 2</Number>
		<Number bind:value={time23} numberItem min={0}>Timer 3</Number>
	</Section>

	<Disqualified {status} bind:checked={dqed} />
</Checklist>
