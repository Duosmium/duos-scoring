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

	let score: number;
	let tier: number;
	let status: ScoreStatus;
	let tiebreak: number[];
	let dqed: boolean;

	let estimatedLoad: number | null;
	let testable: CheckboxValue;
	let mass: number | null;
	let meetsParams: CheckboxValue;
	let bonus: CheckboxValue;
	let load: number | null;

	$: score =
		$testable === 'False'
			? -(mass ?? Infinity)
			: ((load ?? 0) + ($bonus === 'True' && load === 15000 ? 5000 : 0)) /
				(mass ?? Infinity);
	$: tier = $testable === 'False' ? 3 : $meetsParams === 'False' ? 2 : 1;
	$: status = dqed
		? 'DISQUALIFICATION'
		: $testable === 'Blank'
			? 'NOSHOW'
			: 'COMPETED';
	$: tiebreak = [
		!estimatedLoad || !load || estimatedLoad > load
			? Infinity
			: estimatedLoad - load,
		-(mass ?? Infinity)
	];
</script>

<Checklist
	event="Tower B/C"
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
	<Section title="Check In (6 MINUTES TO SET UP AND TEST STRUCTURE)">
		<Number
			bind:value={estimatedLoad}
			rule="4.Part I.d."
			numberItem
			min={0}
			max={15000}
			>Team’s submitted Estimated Load Supported in grams (used as first
			tiebreaker)</Number
		>
		<TF bind:checkbox={testable} rule="6.d.iii." numberItem
			>Structure is able to be loaded (e.g. can accommodate and hold Loading
			Assembly, participants wear eye protection). (If false, team does not test
			and is placed in Tier 3.)</TF
		>
		<Number bind:value={mass} rule="4.Part I.b." numberItem min={0}
			>Mass of Structure (in grams to the nearest 0.01 g with minimum resolution
			of 0.1 g)</Number
		>
	</Section>

	<Section title="Construction & Competition Parameters">
		<TF linkChildren bind:checkbox={meetsParams} numberItem>
			<strong
				>ALL CONSTRUCTION AND COMPETITION PARAMETERS ARE MET (IF FALSE, TIER 2)</strong
			>

			<svelte:fragment slot="children">
				<TF rule="2.a."
					>Team enters only one Structure, built prior to the competition.
				</TF>
				<TF rule="2.c."
					>Participants do not bring any equipment such as levels or squares.
				</TF>

				<TF rule="3.a.">
					The Structure is a single structure with no separate, loose, sliding,
					or detachable pieces.
				</TF>
				<TF rule="3.a.i-iii.">
					The Structure is constructed of wood and bonded by adhesive with no
					other materials used. Besides ink barcodes or markings from the
					construction process, the wood is not painted, soaked or coated in
					glue, color enhanced, or affixed with tape/preprinted/paper labels.
					Adhesive tapes are not used.
				</TF>
				<TF rule="3.c.">
					Students are able to answer questions regarding the design,
					construction, and operation of the device.
				</TF>
				<TF rule="4.Part I.e.">
					Alterations, substitutions, and repairs are not made to the Structure
					after the check-in process is started.
				</TF>
				<TF rule="4.Part II.a.">
					Once participants enter the event area to compete, they do not leave
					or receive outside assistance, materials, or communication until they
					are finished competing.
				</TF>
				<TF rule="4.Part II.c./5.a.">
					Participants place the Structure on the Test Base and assemble the
					Loading Block Assembly and bucket as required to load the structure.
				</TF>
				<TF rule="3.b.i./5.a.">
					The Structure spans a 20 cm x 20 cm opening on a Test base and the
					loading chain is suspended within 2.5 cm of the center of the opening
					in the Test Base.
				</TF>
				<TF rule="3.b.iii (B) / 3.b.i.v (C)">
					The Structure supports the Loading Block a minimum of 50.0 cm above
					the Test Base.
				</TF>
				<TF rule="3.b.v.">
					The loading point on the Structure is constructed to permit placement
					of the Loading Block on the tower and constructed such that only the
					Loading Block supports the chain and bucket.
				</TF>
				<TF rule="3.b.vi. (B) / 3.b.ii. (C)">
					<div>
						<strong>Division B Only:</strong> The portion of the Tower &gt; 25.0
						cm above the Test Base passes through an 8.0 cm ring gauge.
					</div>
					<div>
						<strong>Division C Only:</strong> Tower has 3 points of contact with
						the Test Base and each tower leg must be in its own quadrant, not shared
						with any other leg.
					</div>
				</TF>
				<TF rule="4.Part II.d.">
					Once loading of sand has begun, the Structure is not further adjusted.
				</TF>
				<TF rule="4.Part II.g.">
					Participants do not directly contact the bucket and only stabilize the
					bucket by using the tips of the provided Bucket Stabilizing Sticks.
				</TF>
			</svelte:fragment>
		</TF>
	</Section>

	<Section title="Testing">
		<TF bind:checkbox={bonus} rule="6.c." numberItem>
			<strong>Bonus:</strong> The Structure spans a 29 cm diameter circle AND holds
			all 15 kg.
		</TF>
		<Number bind:value={load} rule="4.i." numberItem min={0} max={15000}>
			<strong>Load Supported:</strong> (mass of Loading Assembly, sand, bucket, in
			grams; up to 15,000 g)</Number
		>
	</Section>

	<Disqualified {status} bind:checked={dqed} />
</Checklist>
