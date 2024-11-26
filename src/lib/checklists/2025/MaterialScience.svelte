<script lang="ts">
	import type { ScoreStatus } from '$drizzle/types';
	import { get } from 'svelte/store';
	import { Status, type CheckboxValue } from '../components/Checkbox.svelte';
	import Checklist from '../components/Checklist.svelte';
	import Disqualified from '../components/Disqualified.svelte';
	import Question from '../components/Question.svelte';
	import Section from '../components/Section.svelte';

	export let teamNumber: number;
	export let teamName: string;
	export let checklistData: DbJson.ChecklistData;

	export let score: number;
	export let tier: number;
	export let status: ScoreStatus;

	let logCover: CheckboxValue;
	let logComponents: CheckboxValue;
	let logTable: CheckboxValue;
	let logGraph: CheckboxValue;
	let meetsParams: CheckboxValue;
	let cm20: CheckboxValue;
	let cm40: CheckboxValue;
	let cm60: CheckboxValue;
	let cm80: CheckboxValue;
	let cm100: CheckboxValue;
	let writtenScore: number;
	let labScore: number;

	let dqed: boolean;

	// TODO: implement shared high score, tiebreaking
	let highestWritten: number = 100;
	let highestLab: number = 100;

	$: dl = [$logCover, $logComponents, $logTable, $logGraph].reduce(
		(a, v) => (v === 'True' ? a + 2 : a),
		0
	);
	$: pt =
		$meetsParams === 'True'
			? [$cm20, $cm40, $cm60, $cm80, $cm100].reduce(
					(a, v) => (v === 'True' ? a + 2 : a),
					0
				)
			: 0;
	$: wt = (writtenScore / highestWritten) * 50;
	$: la = (labScore / highestLab) * 32;

	$: score = dl + pt + wt + la;
	$: tier = 1;
	$: status = (
		dqed ? 'DISQUALIFICATION' : score <= 0 ? 'NOSHOW' : 'COMPETED'
	) as ScoreStatus;
</script>

<Checklist
	event="Material Science C"
	year={2025}
	{score}
	{tier}
	{status}
	{teamNumber}
	{teamName}
	{...$$restProps}
	bind:checklistData
>
	<Section title="Design Log (DL)">
		<Question bind:checkbox={logCover} rule="4.b.i." numberItem
			>Design log has a front cover with school name, team number, and
			competitors' names.</Question
		>
		<Question bind:checkbox={logComponents} rule="4.b.ii." numberItem
			>Design log has a list of components (including quantities or ratios of
			each) used in the construction of puck.</Question
		>
		<Question bind:checkbox={logTable} rule="4.b.iii." numberItem
			>Design log has a data table with ≥10 trials of different amts. of
			materials used for different pucks and how they performed.</Question
		>
		<Question bind:checkbox={logGraph} rule="4.b.iv." numberItem
			>Design log has a graph of the data from 4.b.iii.</Question
		>
	</Section>

	<Section title="Puck Testing (PT)">
		<Question linkChildren bind:checkbox={meetsParams} rule="3.">
			<strong>Does the puck meet all below criteria?</strong>
			If any of the above rules are broken,
			<strong>do not score the rest of this section.</strong>

			<svelte:fragment slot="children">
				<Question rule="3.a.">The puck is 4.0 ± 0.2 cm in diameter.</Question>
				<Question rule="3.a."
					>The puck is some combination of Portland cement Type I or II, sand,
					gravel and water.</Question
				>
				<Question rule="3.a.">The puck is at least 10% cement.</Question>
				<Question rule="3.a.">The puck is totally dry.</Question>
				<Question rule="3.a."
					>Pucks can be up to 1.5 cm thick for Invitationals and Regionals, 1.0
					cm thick for State, and 0.5 thick for Nationals.</Question
				>
				<Question rule="3.a."
					>The puck is not found to be moist after breaking open.</Question
				>
			</svelte:fragment>
		</Question>
		<Question rule="5.1." numberItem noInput>
			Circle all distances that the puck survives the drop from in increasing
			order. Stop testing when the puck breaks.
			<svelte:fragment slot="children">
				<Question bind:checkbox={cm20}>20 cm</Question>
				<Question bind:checkbox={cm40}>40 cm</Question>
				<Question bind:checkbox={cm60}>60 cm</Question>
				<Question bind:checkbox={cm80}>80 cm</Question>
				<Question bind:checkbox={cm100}>100 cm</Question>
			</svelte:fragment>
		</Question>
	</Section>

	<Section title="Written Test (WT)">
		<Question bind:inputValue={writtenScore} numeric rule="5.2." numberItem
			>Raw Written Test Score</Question
		>
	</Section>
	<Section title="Lab Activities (LA)">
		<Question bind:inputValue={labScore} numeric rule="5.3." numberItem
			>Raw Lab Activity Score</Question
		>
	</Section>

	<Disqualified {status} bind:checked={dqed} />
</Checklist>
