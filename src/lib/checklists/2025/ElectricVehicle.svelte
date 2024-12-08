<script lang="ts">
	import type { ScoreStatus } from '$drizzle/types';
	import { type CheckboxValue, Status } from '../components/Checkbox.svelte';
	import Checklist from '../components/Checklist.svelte';
	import Disqualified from '../components/Disqualified.svelte';
	import Question from '../components/Question.svelte';
	import Section from '../components/Section.svelte';

	export let teamNumber: number;
	export let teamName: string;
	export let checklistData: DbJson.ChecklistData;

	let score: number;
	let tier: number;
	let status: ScoreStatus;
	let tiebreak: number[];
	let dqed: boolean;

	let impounded: CheckboxValue;
	let batteryOk: CheckboxValue;
	let constParams1: Status[];
	let constParams2: Status[];
	let compParams1: Status[];
	let compParams2: Status[];
	let runTime1: number | null;
	let runTime2: number | null;
	let distance1: number | null;
	let distance2: number | null;
	let failed1: CheckboxValue;
	let failed2: CheckboxValue;

	$: constViolations1 = constParams1.filter((v) => v === Status.False).length;
	$: constViolations2 = constParams2.filter((v) => v === Status.False).length;
	$: compViolations1 = compParams1.filter((v) => v === Status.False).length;
	$: compViolations2 = compParams2.filter((v) => v === Status.False).length;

	$: dist1 = distance1 && $failed1 !== Status.True ? 2 * distance1 : 2500;
	$: dist2 = distance2 && $failed2 !== Status.True ? 2 * distance2 : 2500;
	$: time1 = runTime1 && $failed1 !== Status.True ? runTime1 : 0;
	$: time2 = runTime2 && $failed2 !== Status.True ? runTime2 : 0;

	$: run1 = dist1 + time1 + compViolations1 * 150 + constViolations1 * 300;
	$: run2 = dist2 + time2 + compViolations2 * 150 + constViolations2 * 300;

	$: penalties = $impounded === Status.False ? 5000 : 0;

	$: score = dqed ? Infinity : Math.min(run1, run2) + penalties;
	$: tier = 1;
	$: status = dqed
		? 'DISQUALIFICATION'
		: $impounded === Status.Blank
			? 'NOSHOW'
			: $batteryOk === Status.False
				? 'PARTICIPATION'
				: 'COMPETED';
	$: tiebreak = [
		run1 < run2 ? -dist1 : run2 < run1 ? -dist2 : -Math.min(dist1, dist2),
		run1 < run2 ? -time1 : run2 < run1 ? -time2 : -Math.min(time1, time2),
		run1 < run2 ? -dist2 : run2 < run1 ? -dist1 : -Math.max(dist1, dist2),
		run1 < run2 ? -time2 : run2 < run1 ? -time1 : -Math.max(time1, time2)
	];
</script>

<Checklist
	event="Electric Vehicle C"
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
	<Section title="Check In">
		<Question bind:checkbox={impounded} rule="2.a." numberItem>
			Team impounds one Vehicle (with batteries disconnected), any alignment
			devices, additional/spare parts and paper/practice logs (if used).
		</Question>
		<Question bind:checkbox={batteryOk} rule="3.b." numberItem>
			Batteries containing lithium or lead acid are not used. (If false, do not
			run and team receives participation points.)
		</Question>
	</Section>

	{@const constParams = {
		'3.a.':
			'Electrical energy is stored in a maximum of eight AA 1.2 to 1.5-volt common, commercially available batteries, individually labeled by the manufacturer. Rechargeable batteries are allowed. The batteries must be individual batteries and not a pre-assembled battery pack.',
		'3.b.': 'Batteries containing lithium or lead acid are not used.',
		'3.c.':
			'The batteries and Vehicle are separate until after the start of the team’s time slot. At Impound, the batteries to be used must be stored in a method that will prevent a short circuit.',
		'3.d.':
			'All energy for propulsion is electric and comes from batteries. All sources of energy are in easily accessible locations for inspection.',
		'3.e.':
			'If a microprocessor is used, competitors do not communicate over WiFi or Bluetooth connection.',
		'3.f.':
			'The distance from the front of the front wheel(s) to the back of the back wheel(s) must not be > 70.0 cm.',
		'3.g.': 'The Vehicle width must not exceed 35.0 cm at any point.',
		'3.h.':
			'The Vehicle has a Measurement Point at the front, made of any material, and is less than or equal to 1.0 cm above the Track.',
		'3.i.':
			'Participants design an activation trigger to be actuated with a #2 pencil in a perpendicular motion.',
		'3.k.':
			'The stopping mechanism works automatically. The Vehicle is not remotely controlled or tethered.',
		'3.l.': 'All parts of the Vehicle move as a whole.'
	}}
	{@const compParams = {
		'6.a.':
			'Once participants enter the event area to compete, they do not leave or receive outside assistance, materials, or communication until they are finished competing and have left the event area.',
		'6.b.':
			'Unauthorized, generative AI tools are not used to generate answers/code during the event.',
		'6.e.':
			'Participants do not use any AC outlet power during their Event Time.',
		'6.f.':
			"In ready-to-run configuration, the Vehicle's Measurement Point is over the Start Point.",
		'6.i.':
			'Sighting, alignment, and aiming devices are only used within the defined Track area.',
		'6.j.':
			'Team does not roll the Vehicle on the floor of Track on the day of the event without tournament permission.',
		'6.k.':
			'Any substances applied to the device are approved by the Event Supervisor prior to use and do not damage or leave residue on the floor, Track, and/or event area. The Track remains dry at all times.',
		'6.l.':
			"Teams start the Vehicle with a #2 pencil in a motion perpendicular to the floor to actuate the trigger. Competitors don't make contact with the Vehicle (besides with the #2 pencil). The Vehicle remains at the starting position without being touched until triggered.",
		'6.n.':
			'Once the run starts, team do not follow their Vehicle and waits until called by the ES to retrieve it.'
	}}

	<Section title="Run 1 (8 MINUTES FOR UP TO 2 RUNS)">
		<Question bind:childValues={constParams1} numberItem linkChildren>
			<strong>DEVICE MEETS ALL CONSTRUCTION PARAMETERS</strong>

			<svelte:fragment slot="children">
				{#each Object.entries(constParams) as [rule, text]}
					<Question {rule}>{text}</Question>
				{/each}
			</svelte:fragment>
		</Question>
		<Question bind:childValues={compParams1} numberItem linkChildren>
			<strong>TEAM MEETS ALL COMPETITION PARAMETERS</strong>

			<svelte:fragment slot="children">
				{#each Object.entries(compParams) as [rule, text]}
					<Question {rule}>{text}</Question>
				{/each}
			</svelte:fragment>
		</Question>
		<Question bind:inputValue={runTime1} rule="7.d." numberItem numeric min={0}>
			<strong>Run Time:</strong> Time (sec.) from when the vehicle moves to when
			the vehicle stops. Run Time is 0.00 sec. for failed runs.
		</Question>
		<Question
			bind:inputValue={distance1}
			rule="7.c."
			numberItem
			numeric
			min={0}
		>
			<strong>Vehicle Distance:</strong> point-to-point distance, in centimeters
			to the nearest 0.1 cm, from the Vehicle Measurement Point to the Target Point,
			measured to the nearest 0.1 cm.
		</Question>
		<Question bind:checkbox={failed1} rule="6.o." numberItem>
			<strong>Failed Run:</strong> any run where Vehicle starts before ES is ready,
			its distance or time cannot be measured, team pushes the Vehicle down track,
			the Vehicle travels in the wrong direction from the Start Point, or any run
			that does not occur in the 8 minutes.
		</Question>
	</Section>

	<Section title="Run 2">
		<Question bind:childValues={constParams2} numberItem linkChildren>
			<strong>DEVICE MEETS ALL CONSTRUCTION PARAMETERS</strong>

			<svelte:fragment slot="children">
				{#each Object.entries(constParams) as [rule, text]}
					<Question {rule}>{text}</Question>
				{/each}
			</svelte:fragment>
		</Question>
		<Question bind:childValues={compParams2} numberItem linkChildren>
			<strong>TEAM MEETS ALL COMPETITION PARAMETERS</strong>

			<svelte:fragment slot="children">
				{#each Object.entries(compParams) as [rule, text]}
					<Question {rule}>{text}</Question>
				{/each}
			</svelte:fragment>
		</Question>
		<Question bind:inputValue={runTime2} rule="7.d." numberItem numeric min={0}>
			<strong>Run Time:</strong> Time (sec.) from when the vehicle moves to when
			the vehicle stops. Run Time is 0.00 sec. for failed runs.
		</Question>
		<Question
			bind:inputValue={distance2}
			rule="7.c."
			numberItem
			numeric
			min={0}
		>
			<strong>Vehicle Distance:</strong> point-to-point distance, in centimeters
			to the nearest 0.1 cm, from the Vehicle Measurement Point to the Target Point,
			measured to the nearest 0.1 cm.
		</Question>
		<Question bind:checkbox={failed2} rule="6.o." numberItem>
			<strong>Failed Run:</strong> any run where Vehicle starts before ES is ready,
			its distance or time cannot be measured, team pushes the Vehicle down track,
			the Vehicle travels in the wrong direction from the Start Point, or any run
			that does not occur in the 8 minutes.
		</Question>
	</Section>

	<Disqualified {status} bind:checked={dqed} />
</Checklist>
