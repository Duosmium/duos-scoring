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

	let dqed: boolean;

	const bucketColor = (_: any, status: Status | undefined) => {
		if (status === 'True') {
			return 'green';
		}
		return 'gray';
	};

	$: bestNTS = Math.max(
		0,
		(2000 - (near1Dist ?? 2000)) * ($meetsNear1Rules === 'False' ? 0.9 : 1),
		$nearBucket === 'True'
			? 0
			: (2000 - (near2Dist ?? 2000)) * ($meetsNear2Rules === 'False' ? 0.9 : 1)
	);
	$: bestFTS = Math.max(
		0,
		(4000 - (far1Dist ?? 4000)) * ($meetsFar1Rules === 'False' ? 0.9 : 1),
		$farBucket === 'True'
			? 0
			: (4000 - (far2Dist ?? 4000)) * ($meetsFar2Rules === 'False' ? 0.9 : 1)
	);
	$: bucketScore = [
		$nearBucket === 'True' && $nearBucketHit === 'True' ? 200 : 0,
		$nearBucket === 'True' && $nearBucketInside === 'True' ? 300 : 0,
		$farBucket === 'True' && $farBucketHit === 'True' ? 200 : 0,
		$farBucket === 'True' && $farBucketInside === 'True' ? 300 : 0
	].reduce((a, b) => a + b, 0);

	$: score =
		$hasDevice === 'False' || dqed ? 0 : bestNTS + bestFTS + bucketScore;
	$: tier = $impounded === 'False' ? 3 : $meetsParams === 'False' ? 2 : 1;
	$: status = (
		dqed
			? 'DISQUALIFICATION'
			: $hasDevice === 'Blank'
				? 'NOSHOW'
				: $hasDevice === 'False' || score <= 0
					? 'PARTICIPATION'
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
	{...$$restProps}
	bind:checklistData
>
	<Section title="Check In">
		<Question bind:checkbox={hasDevice} rule="7.g." numberItem
			>Team operates safely.</Question
		>
	</Section>

	<Section title="Construction Parameters">
		<Question linkChildren bind:checkbox={meetsParams} rule="3." numberItem>
			<strong
				>DEVICE MEETS ALL CONSTRUCTION PARAMETERS AT THE TIME OF FIRST LAUNCH.</strong
			>

			<svelte:fragment slot="children">
				<Question rule="3.a."
					>When ready-to-launch, the launch device, projectiles, stabilizing
					weights, and all other device components fit in a 75.0 cm (B) or 85.0
					cm (C) per side cube. The #2 pencil, supplied by the ES, may extend
					beyond these dimensions.</Question
				>
				<Question rule="3.b."
					>Launch force is entirely supplied by gravitational potential energy
					from a falling mass ≤ 5.0 kg (B) or 3.5 kg (C).</Question
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
					>The device is triggered with an unsharpened #2 pencil to actuate a
					release mech. for the falling mass and does not contribute significant
					energy to launch.</Question
				>
				<Question rule="3.g."
					>Teams prepare a spherical projectile for launch greater than 1 in.
					and less than 3 in. in diameter, which does not damage the floor.</Question
				>
				<Question rule="3.h."
					>The launch device is designed and operated in such a way to not
					damage or alter the floor.</Question
				>
				<Question rule="3.i."
					>Electrical components are not part of the device or triggering
					device, with the exception of electronic sighting devices removed
					before launch.</Question
				>
			</svelte:fragment>
		</Question>

		<Question bind:checkbox={impounded} rule="2.b." numberItem
			><strong
				>Team impounds one launch device with the mass(es) detached,
				projectiles, calibration (if prep.)</strong
			></Question
		>
	</Section>

	{@const rules = {
		'5.b.':
			'Team places their device at a location they select in the launch area.',
		'5.c.':
			'No part of the launch device extends outside of the launch area' +
			'before or after a shot. Any part of the launching device extending beyond' +
			'the launch area during the launching action returns to and remains in the' +
			'launch area immediately after the launch without assistance of the' +
			'competitors.',
		'5.d.':
			'When triggering the device, competitors do not touch the device or' +
			'triggering mechanism, except for the #2 pencil.',
		dist:
			'Straight line distance, in mm, from the center of the initial impact of the' +
			'projectile to the center of the target. If projectile does not impact the' +
			'elevated surface, put 2000.',
		bucket:
			'For Launch 2 only: If Launch 1 at a target lands within 500mm, a bucket shot may be ' +
			'requested in place of the second shot. If this is a bucket shot, circle T and fill out ' +
			'the items below and leave 7.b. blank. Otherwise, leave the items below blank and fill ' +
			'out 7.b.',
		'7.d.1': 'The projectile hits the bucket at first impact.',
		'7.d.2':
			'The projectile contacts with the inside bottom surface of the bucket.'
	}}
	<Section title="Near Target: Launch 1">
		<Question linkChildren bind:checkbox={meetsNear1Rules} rule="5." numberItem>
			<strong>DEVICE MEETS ALL COMPETITION RULES FOR THIS LAUNCH</strong>

			<svelte:fragment slot="children">
				<Question rule="5.b.">{rules['5.b.']}</Question>
				<Question rule="5.c.">{rules['5.c.']}</Question>
				<Question rule="5.d.">{rules['5.d.']}</Question>
			</svelte:fragment>
		</Question>
		<Question bind:inputValue={near1Dist} numeric rule="7.b." numberItem min={0}
			>{rules.dist}</Question
		>
	</Section>
	<Section title="Near Target: Launch 2">
		<Question linkChildren bind:checkbox={meetsNear2Rules} rule="5." numberItem>
			<strong>DEVICE MEETS ALL COMPETITION RULES FOR THIS LAUNCH</strong>

			<svelte:fragment slot="children">
				<Question rule="5.b.">{rules['5.b.']}</Question>
				<Question rule="5.c.">{rules['5.c.']}</Question>
				<Question rule="5.d.">{rules['5.d.']}</Question>
			</svelte:fragment>
		</Question>
		<Question
			bind:inputValue={near2Dist}
			numeric
			rule="7.b."
			numberItem
			min={0}
			blankOk={$nearBucket === 'True'}>{rules.dist}</Question
		>
		<Question
			bind:checkbox={nearBucket}
			highlightFunction={bucketColor}
			rule="5.g."
			numberItem
		>
			{rules.bucket}

			<svelte:fragment slot="summary">Bucket shot parameters:</svelte:fragment>
			<svelte:fragment slot="children">
				<Question
					bind:checkbox={nearBucketHit}
					rule="7.d."
					numberItem
					blankOk={$nearBucket === 'False'}>{rules['7.d.1']}</Question
				>
				<Question
					bind:checkbox={nearBucketInside}
					rule="7.d."
					numberItem
					blankOk={$nearBucket === 'False'}>{rules['7.d.2']}</Question
				>
			</svelte:fragment>
		</Question>
	</Section>
	<Section title="Far Target: Launch 1">
		<Question linkChildren bind:checkbox={meetsFar1Rules} rule="5." numberItem>
			<strong>DEVICE MEETS ALL COMPETITION RULES FOR THIS LAUNCH</strong>

			<svelte:fragment slot="children">
				<Question rule="5.b.">{rules['5.b.']}</Question>
				<Question rule="5.c.">{rules['5.c.']}</Question>
				<Question rule="5.d.">{rules['5.d.']}</Question>
			</svelte:fragment>
		</Question>
		<Question bind:inputValue={far1Dist} numeric rule="7.b." numberItem min={0}
			>{rules.dist}</Question
		>
	</Section>
	<Section title="Far Target: Launch 2">
		<Question linkChildren bind:checkbox={meetsFar2Rules} rule="5." numberItem>
			<strong>DEVICE MEETS ALL COMPETITION RULES FOR THIS LAUNCH</strong>

			<svelte:fragment slot="children">
				<Question rule="5.b.">{rules['5.b.']}</Question>
				<Question rule="5.c.">{rules['5.c.']}</Question>
				<Question rule="5.d.">{rules['5.d.']}</Question>
			</svelte:fragment>
		</Question>
		<Question
			bind:inputValue={far2Dist}
			numeric
			rule="7.b."
			numberItem
			min={0}
			blankOk={$farBucket === 'True'}>{rules.dist}</Question
		>
		<Question
			bind:checkbox={farBucket}
			highlightFunction={bucketColor}
			rule="5.g."
			numberItem
		>
			{rules.bucket}

			<svelte:fragment slot="summary">Bucket shot parameters:</svelte:fragment>
			<svelte:fragment slot="children">
				<Question
					bind:checkbox={farBucketHit}
					rule="7.d."
					numberItem
					blankOk={$farBucket === 'False'}>{rules['7.d.1']}</Question
				>
				<Question
					bind:checkbox={farBucketInside}
					rule="7.d."
					numberItem
					blankOk={$farBucket === 'False'}>{rules['7.d.2']}</Question
				>
			</svelte:fragment>
		</Question>
	</Section>

	<Disqualified {status} bind:checked={dqed} />
</Checklist>
