<script lang="ts">
	import type { ScoreStatus } from '$drizzle/types';
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

	let hasDevice: CheckboxValue;
	let meetsParams: CheckboxValue;
	let impounded: CheckboxValue;

	let meetsNear1Rules: CheckboxValue;
	let near1Dist: number | null;

	let meetsNear2Rules: CheckboxValue;
	let near2Dist: number | null;
	let nearBucket: CheckboxValue;
	let nearBucketHit: CheckboxValue;
	let nearBucketInside: CheckboxValue;

	let meetsFar1Rules: CheckboxValue;
	let far1Dist: number | null;

	let meetsFar2Rules: CheckboxValue;
	let far2Dist: number | null;
	let farBucket: CheckboxValue;
	let farBucketHit: CheckboxValue;
	let farBucketInside: CheckboxValue;

	let logBasePoints: number | null;
	let logDataSpansVar: number | null;
	let logDataPts: number | null;
	let logLabeled: number | null;
	let logDistinctTables: number | null;
	let logDiagram: number | null;
	let logExCalcs: number | null;

	let dqed: boolean;

	const bucketColor = (_: number | null, status: Status | undefined) => {
		if (status === 'True') {
			return 'green';
		}
		if (status === 'False') {
			return 'yellow';
		}
		return 'gray';
	};
	const l = (num: number | null, min: number, max: number, def: number = 0) =>
		Math.max(min, Math.min(max, num ?? def));

	$: bestNTS =
		Math.max(
			0,
			(2000 - (near1Dist ?? 2000)) * ($meetsNear1Rules === 'False' ? 0.9 : 1),
			$nearBucket === 'True'
				? 0
				: (2000 - (near2Dist ?? 2000)) *
						($meetsNear2Rules === 'False' ? 0.9 : 1)
		) * ($impounded === 'False' ? 0.7 : 1);
	$: bestFTS =
		Math.max(
			0,
			(4000 - (far1Dist ?? 4000)) * ($meetsFar1Rules === 'False' ? 0.9 : 1),
			$farBucket === 'True'
				? 0
				: (4000 - (far2Dist ?? 4000)) * ($meetsFar2Rules === 'False' ? 0.9 : 1)
		) * ($impounded === 'False' ? 0.7 : 1);
	$: logScore = [
		l(logBasePoints, 0, 30),
		l(logDataSpansVar, 0, 60),
		l(logDataPts, 0, 55),
		l(logLabeled, 0, 40),
		l(logDistinctTables, 0, 120),
		l(logDiagram, 0, 45),
		l(logExCalcs, 0, 50)
	].reduce((a, b) => a + b, 0);
	$: bucketScore = [
		$nearBucket === 'True' && $nearBucketHit === 'True' ? 200 : 0,
		$nearBucket === 'True' && $nearBucketInside === 'True' ? 300 : 0,
		$farBucket === 'True' && $farBucketHit === 'True' ? 200 : 0,
		$farBucket === 'True' && $farBucketInside === 'True' ? 300 : 0
	].reduce((a, b) => a + b, 0);

	$: score =
		($hasDevice === 'False' || dqed ? 0 : bestNTS + bestFTS + bucketScore) +
		logScore;
	$: tier = $meetsParams === 'False' ? 2 : 1;
	$: status = (
		dqed
			? 'DISQUALIFICATION'
			: $hasDevice === 'False' || score < 0
				? 'PARTICIPATION'
				: $hasDevice === 'Blank'
					? 'NOSHOW'
					: 'COMPETED'
	) as ScoreStatus;
</script>

<Checklist
	event="Air Trajectory B/C"
	year={2025}
	{score}
	{tier}
	{status}
	{teamNumber}
	{teamName}
	bind:checklistData
>
	<Section title="Check In">
		<Question bind:checkbox={hasDevice} rule="7.g." checklistItem={1}
			>Team operates safely & has a device within spec before the end of the
			allotted competition period.</Question
		>
	</Section>

	<Section title="Construction Parameters">
		<Question
			linkChildren={true}
			bind:checkbox={meetsParams}
			rule="3."
			checklistItem={2}
		>
			<strong>Were all construction parameters met?</strong>
			(If any construction violations are not corrected during the competition period,
			circle F. teams may still be permitted to compete but will be ranked behind
			every team.)

			<svelte:fragment slot="children">
				<Question rule="3.a."
					>When ready-to-launch, the launch device, projectiles, stabilizing
					weights, and all other device components fit in a 75.0 cm (Div C) or
					85.0 cm (Div B) per side cube, in any orientation chosen by the team.</Question
				>
				<Question rule="3.b."
					>Launch force is entirely supplied by gravitational potential energy
					from a falling mass ≤ 3.500 kg (Div C) or 5.000 kg (Div B).</Question
				>
				<Question rule="3.d."
					>The gravitational potential energy is converted to air pressure or
					air movement, which is then used to launch the projectile.</Question
				>
				<Question rule="3.e."
					>All device air chambers start each launch at ambient air pressure and
					automatically return to ambient air pressure.</Question
				>
				<Question rule="3.f."
					>Activating the triggering device does not contribute significant
					energy to the launch. It extends out of the launch area, allow for
					competitors to remain at least 75 cm away from the launch area. The
					triggering device does not pose a danger due to flying parts or
					excessive movement outside of the launch area.</Question
				>
				<Question rule="3.g."
					>Team provides unmodified, standard tennis, racquet, and/or Ping Pong
					balls to be used as projectiles.</Question
				>
				<Question rule="3.h."
					>The launch device is designed and operated in such a way to not
					damage or alter the floor.</Question
				>
				<Question rule="3.i."
					>Electrical components are not part of the device or triggering
					device.</Question
				>
			</svelte:fragment>
		</Question>

		<Question bind:checkbox={impounded} rule="2.b." checklistItem={3}
			><strong
				>Team impounds one launch device with the mass(es) detached, design log,
				and any projectiles.</strong
			></Question
		>
	</Section>

	{@const rules = {
		'5.b.':
			'Team places their device at a location they select in the launch area. Competitors are ' +
			'not within 75 cm of launch area or in front of the front edge of launch area during a ' +
			'launch. Competitors only touch the part of the triggering device that extends at least ' +
			'75cm outside of launch area.',
		'5.c.':
			'No part of the launch device extends outside of the launch area before or after a shot. ' +
			'Any part of the launching device extending beyond launch area during the launching ' +
			'action returns to and remains in launch area immediately after the launch without ' +
			'assistance of the competitors. ',
		dist:
			'Straight line distance, in mm, from the center of the initial impact of the projectile ' +
			'to the center of the target.',
		bucket:
			'For Launch 2 only: If Launch 1 at a target lands within 500mm, a bucket shot may be ' +
			'requested in place of the second shot. If this is a bucket shot, circle T and fill out ' +
			'the items below and leave 7.b. blank. Otherwise, leave the items below blank and fill ' +
			'out 7.b.',
		'7.e.1': 'The projectile hits the bucket at first impact.',
		'7.e.2':
			'The projectile contacts with the inside bottom surface of the bucket.'
	}}
	<Section title="Near Target: Launch 1">
		<Question
			linkChildren={true}
			bind:checkbox={meetsNear1Rules}
			rule="5."
			checklistItem={4}
		>
			<strong>Were all competition parameters met for this launch?</strong>

			<svelte:fragment slot="children">
				<Question rule="5.b.">{rules['5.b.']}</Question>
				<Question rule="5.c.">{rules['5.c.']}</Question>
			</svelte:fragment>
		</Question>
		<Question
			bind:inputValue={near1Dist}
			input={true}
			rule="7.b."
			checklistItem={5}
			min={0}
			max={2000}>{rules.dist}</Question
		>
	</Section>
	<Section title="Near Target: Launch 2">
		<Question
			linkChildren={true}
			bind:checkbox={meetsNear2Rules}
			rule="5."
			checklistItem={6}
		>
			<strong>Were all competition parameters met for this launch?</strong>

			<svelte:fragment slot="children">
				<Question rule="5.b.">{rules['5.b.']}</Question>
				<Question rule="5.c.">{rules['5.c.']}</Question>
			</svelte:fragment>
		</Question>
		<Question
			bind:inputValue={near2Dist}
			input={true}
			rule="7.b."
			checklistItem={7}
			min={0}
			max={2000}>{rules.dist}</Question
		>
		<Question
			bind:checkbox={nearBucket}
			highlightFunction={bucketColor}
			rule="5."
			checklistItem={8}
		>
			{rules.bucket}

			<svelte:fragment slot="summary">Bucket shot parameters:</svelte:fragment>
			<svelte:fragment slot="children">
				<Question bind:checkbox={nearBucketHit} rule="7.e." checklistItem={9}
					>{rules['7.e.1']}</Question
				>
				<Question
					bind:checkbox={nearBucketInside}
					rule="7.e."
					checklistItem={10}>{rules['7.e.2']}</Question
				>
			</svelte:fragment>
		</Question>
	</Section>
	<Section title="Far Target: Launch 1">
		<Question
			linkChildren={true}
			bind:checkbox={meetsFar1Rules}
			rule="5."
			checklistItem={11}
		>
			<strong>Were all competition parameters met for this launch?</strong>

			<svelte:fragment slot="children">
				<Question rule="5.b.">{rules['5.b.']}</Question>
				<Question rule="5.c.">{rules['5.c.']}</Question>
			</svelte:fragment>
		</Question>
		<Question
			bind:inputValue={far1Dist}
			input={true}
			rule="7.b."
			checklistItem={12}
			min={0}
			max={4000}>{rules.dist}</Question
		>
	</Section>
	<Section title="Far Target: Launch 2">
		<Question
			linkChildren={true}
			bind:checkbox={meetsFar2Rules}
			rule="5."
			checklistItem={13}
		>
			<strong>Were all competition parameters met for this launch?</strong>

			<svelte:fragment slot="children">
				<Question rule="5.b.">{rules['5.b.']}</Question>
				<Question rule="5.c.">{rules['5.c.']}</Question>
			</svelte:fragment>
		</Question>
		<Question
			bind:inputValue={far2Dist}
			input={true}
			rule="7.b."
			checklistItem={14}
			min={0}
			max={4000}>{rules.dist}</Question
		>
		<Question
			bind:checkbox={farBucket}
			highlightFunction={bucketColor}
			rule="5."
			checklistItem={15}
		>
			{rules.bucket}

			<svelte:fragment slot="summary">Bucket shot parameters:</svelte:fragment>
			<svelte:fragment slot="children">
				<Question bind:checkbox={farBucketHit} rule="7.e." checklistItem={16}
					>{rules['7.e.1']}</Question
				>
				<Question bind:checkbox={farBucketInside} rule="7.e." checklistItem={17}
					>{rules['7.e.2']}</Question
				>
			</svelte:fragment>
		</Question>
	</Section>

	<Section title="Log Score">
		<Question
			bind:inputValue={logBasePoints}
			input={true}
			checklistItem={18}
			rule="7.d.i."
			min={0}
			max={30}
			>Properly formatted Design Log containing all the required elements is
			submitted (up to 30 points)</Question
		>
		<Question
			bind:inputValue={logDataSpansVar}
			input={true}
			checklistItem={19}
			rule="7.d.ii."
			min={0}
			max={60}
			>Of one graphs/tables selected by the Event Sup, it includes data spanning
			≥ 1 variable range in 4.a.iii. (up to 60 points)</Question
		>
		<Question
			bind:inputValue={logDataPts}
			input={true}
			checklistItem={20}
			rule="7.d.iii."
			min={0}
			max={55}
			>Of one graphs/tables selected by the Event Sup, it includes at least 10
			data points in each data series (up to 55 points)</Question
		>
		<Question
			bind:inputValue={logLabeled}
			input={true}
			checklistItem={21}
			rule="7.d.iv."
			min={0}
			max={40}
			>Of one graphs/tables selected by the Event Sup, it is properly labeled
			(e.g. title, units) (up to 40 points)</Question
		>
		<Question
			bind:inputValue={logDistinctTables}
			input={true}
			checklistItem={22}
			rule="7.d.v."
			min={0}
			max={120}
			>Points for each distinct graph/table turned in (30 points for each, up to
			120 points total)</Question
		>
		<Question
			bind:inputValue={logDiagram}
			input={true}
			checklistItem={23}
			rule="7.d.vi."
			min={0}
			max={45}
			>Includes a labeled device picture or diagram (up to 45 points)</Question
		>
		<Question
			bind:inputValue={logExCalcs}
			input={true}
			checklistItem={24}
			rule="7.d.vii."
			min={0}
			max={50}
			>Includes at least 2 example calculations (up to 50 points)</Question
		>
	</Section>

	<Disqualified checklistItem={25} {status} bind:checked={dqed} />
</Checklist>
