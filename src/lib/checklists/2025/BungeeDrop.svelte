<script lang="ts">
	import type { ScoreStatus } from '$drizzle/types';
	import type { CheckboxValue } from '../components/Checkbox.svelte';
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
	let elasticityLength: number | null;
	let elasticityPass: CheckboxValue;
	let drop1: number | null;
	let drop2: number | null;
	let bonusDrop: CheckboxValue;

	$: score =
		$impounded === 'False' || dqed
			? 20000
			: ((drop1 ?? 10000) + (drop2 ?? 10000)) *
				($bonusDrop === 'True' ? 0.8 : 1);
	$: tier = $elasticityPass === 'False' ? 2 : 1;
	$: status = dqed
		? 'DISQUALIFICATION'
		: $impounded === 'Blank'
			? 'NOSHOW'
			: 'COMPETED';
	$: tiebreak = [
		$bonusDrop === 'True' ? 1 : 0,
		-Math.min(drop1 ?? 10000, drop2 ?? 10000),
		elasticityLength ?? 0
	];
</script>

<Checklist
	event="Bungee Drop C"
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
		<Question bind:checkbox={impounded} rule="2.a." numberItem
			>One elastic cord with a closed metal ring, calibration data (if prep.),
			and tools (if used) are impounded.</Question
		>
	</Section>

	<Section title="Construction Parameters">
		<Question bind:inputValue={elasticityLength} rule="3.b." numberItem numeric
			><strong>Elasticity Test:</strong> Length of bottom meter of the cord during
			Elasticity Test (cm).</Question
		>
		<Question bind:checkbox={elasticityPass} rule="3.b." numberItem
			><strong>Elasticity Test:</strong> The bottom meter of the cord stretches at
			least 1.25 m when a single 500 g mass is attached to the cord section and returns
			to approximately original length after mass is removed. “Self-limiting-brake”
			mechanisms such as separate, parallel, non-elastic strands are not used.</Question
		>
	</Section>

	<Section title="Drops">
		<Question bind:inputValue={drop1} rule="3.c." numberItem numeric min={0}
			><strong>Drop Distance #1:</strong> Distance between lowest point of the
			bottle and surface.
			<strong>
				A drop that strikes the landing surface has a distance of 0.5 x drop
				height.
			</strong></Question
		>
		<Question bind:inputValue={drop2} rule="3.c." numberItem numeric min={0}
			><strong>Drop Distance #2:</strong> Distance between lowest point of the
			bottle and surface.
			<strong>
				A drop that strikes the landing surface has a distance of 0.5 x drop
				height.
			</strong></Question
		>
		<Question bind:checkbox={bonusDrop} rule="3.e." numberItem
			><strong>Bonus Drop:</strong> If either Drop Distance is within 30 cm
			(Regionals) / 20 cm (States) / 10 cm (Nationals), competitors get a bonus
			drop.
			<div>
				The competitors are within a predetermined window at the lowest point
				and is in the window determined by the ES.
			</div></Question
		>
	</Section>

	<Disqualified {status} bind:checked={dqed} />
</Checklist>
