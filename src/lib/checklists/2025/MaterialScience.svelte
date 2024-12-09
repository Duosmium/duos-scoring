<script lang="ts">
	import type { ScoreStatus } from '$drizzle/types';
	import type { CheckboxValue } from '../components/Checkbox.svelte';
	import Checklist from '../components/Checklist.svelte';
	import Disqualified from '../components/Disqualified.svelte';
	import Number from '../components/questions/Number.svelte';
	import TF from '../components/questions/TF.svelte';
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
	let writtenScore: number | null;
	let labScore: number | null;

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
	$: wt = ((writtenScore ?? 0) / highestWritten) * 50;
	$: la = ((labScore ?? 0) / highestLab) * 32;

	$: score = dl + pt + wt + la;
	$: tier = 1;
	$: status = dqed ? 'DISQUALIFICATION' : score <= 0 ? 'NOSHOW' : 'COMPETED';
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
	tiebreak={[]}
	bind:checklistData
>
	<Section title="Design Log (DL)">
		<TF bind:checkbox={logCover} rule="4.b.i." numberItem
			>Design log has a front cover with school name, team number, and
			competitors' names.</TF
		>
		<TF bind:checkbox={logComponents} rule="4.b.ii." numberItem
			>Design log has a list of components (including quantities or ratios of
			each) used in the construction of puck.</TF
		>
		<TF bind:checkbox={logTable} rule="4.b.iii." numberItem
			>Design log has a data table with ≥10 trials of different amts. of
			materials used for different pucks and how they performed.</TF
		>
		<TF bind:checkbox={logGraph} rule="4.b.iv." numberItem
			>Design log has a graph of the data from 4.b.iii.</TF
		>
	</Section>

	<Section title="Puck Testing (PT)">
		<TF linkChildren bind:checkbox={meetsParams} rule="3.">
			<strong>Does the puck meet all below criteria?</strong>
			If any of the above rules are broken,
			<strong>do not score the rest of this section.</strong>

			<svelte:fragment slot="children">
				<TF rule="3.a.">The puck is 4.0 ± 0.2 cm in diameter.</TF>
				<TF rule="3.a."
					>The puck is some combination of Portland cement Type I or II, sand,
					gravel and water.</TF
				>
				<TF rule="3.a.">The puck is at least 10% cement.</TF>
				<TF rule="3.a.">The puck is totally dry.</TF>
				<TF rule="3.a."
					>Pucks can be up to 1.5 cm thick for Invitationals and Regionals, 1.0
					cm thick for State, and 0.5 thick for Nationals.</TF
				>
				<TF rule="3.a."
					>The puck is not found to be moist after breaking open.</TF
				>
			</svelte:fragment>
		</TF>
		<TF rule="5.1." numberItem noInput>
			Circle all distances that the puck survives the drop from in increasing
			order. Stop testing when the puck breaks.
			<svelte:fragment slot="children">
				<TF bind:checkbox={cm20}>20 cm</TF>
				<TF bind:checkbox={cm40}>40 cm</TF>
				<TF bind:checkbox={cm60}>60 cm</TF>
				<TF bind:checkbox={cm80}>80 cm</TF>
				<TF bind:checkbox={cm100}>100 cm</TF>
			</svelte:fragment>
		</TF>
	</Section>

	<Section title="Written Test (WT)">
		<Number bind:value={writtenScore} rule="5.2." numberItem
			>Raw Written Test Score</Number
		>
	</Section>
	<Section title="Lab Activities (LA)">
		<Number bind:value={labScore} rule="5.3." numberItem
			>Raw Lab Activity Score</Number
		>
	</Section>

	<Disqualified {status} bind:checked={dqed} />
</Checklist>
