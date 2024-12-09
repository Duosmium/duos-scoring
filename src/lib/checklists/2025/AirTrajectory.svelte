<script lang="ts">
	import type { ScoreStatus } from '$drizzle/types';
	import { Status, type CheckboxValue } from '../components/Checkbox.svelte';
	import Checklist from '../components/Checklist.svelte';
	import Disqualified from '../components/Disqualified.svelte';
	import TF from '../components/questions/TF.svelte';
	import Number from '../components/questions/Number.svelte';
	import Section from '../components/Section.svelte';

	export let teamNumber: number;
	export let teamName: string;
	export let checklistData: DbJson.ChecklistData;

	let score: number;
	let tier: number;
	let status: ScoreStatus;
	let tiebreak: number[];

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

	const bucketColor = (status: Status | undefined) => {
		if (status === 'True') {
			return 'green';
		}
		return 'gray';
	};

	$: nts1 =
		(2000 - (near1Dist ?? 2000)) * ($meetsNear1Rules === 'False' ? 0.9 : 1);
	$: nts2 =
		$nearBucket === 'True'
			? 0
			: (2000 - (near2Dist ?? 2000)) * ($meetsNear2Rules === 'False' ? 0.9 : 1);
	$: bestNTS = Math.max(0, nts1, nts2);

	$: fts1 =
		(4000 - (far1Dist ?? 4000)) * ($meetsFar1Rules === 'False' ? 0.9 : 1);
	$: fts2 =
		$farBucket === 'True'
			? 0
			: (4000 - (far2Dist ?? 4000)) * ($meetsFar2Rules === 'False' ? 0.9 : 1);
	$: bestFTS = Math.max(0, fts1, fts2);

	$: bucketScore = [
		$nearBucket === 'True' && $nearBucketHit === 'True' ? 200 : 0,
		$nearBucket === 'True' && $nearBucketInside === 'True' ? 300 : 0,
		$farBucket === 'True' && $farBucketHit === 'True' ? 200 : 0,
		$farBucket === 'True' && $farBucketInside === 'True' ? 300 : 0
	].reduce((a, b) => a + b, 0);

	$: score =
		$hasDevice === 'False' || dqed ? 0 : bestNTS + bestFTS + bucketScore;
	$: tier = $impounded === 'False' ? 3 : $meetsParams === 'False' ? 2 : 1;
	$: status = dqed
		? 'DISQUALIFICATION'
		: $hasDevice === 'Blank'
			? 'NOSHOW'
			: $hasDevice === 'False' || score <= 0
				? 'PARTICIPATION'
				: 'COMPETED';
	$: tiebreak = [
		bestNTS + bestFTS,
		Math.max(bestNTS, bestFTS),
		Math.max(0, Math.min(fts1, fts2)),
		Math.max(0, Math.min(nts1, nts2))
	];
</script>

<Checklist
	event="Air Trajectory B/C"
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
		<TF bind:checkbox={hasDevice} rule="7.g." numberItem
			>Team operates safely.</TF
		>
	</Section>

	<Section title="Construction Parameters">
		<TF linkChildren bind:checkbox={meetsParams} rule="3." numberItem>
			<strong
				>DEVICE MEETS ALL CONSTRUCTION PARAMETERS AT THE TIME OF FIRST LAUNCH.</strong
			>

			<svelte:fragment slot="children">
				<TF rule="3.a."
					>When ready-to-launch, the launch device, projectiles, stabilizing
					weights, and all other device components fit in a 75.0 cm (B) or 85.0
					cm (C) per side cube. The #2 pencil, supplied by the ES, may extend
					beyond these dimensions.</TF
				>
				<TF rule="3.b."
					>Launch force is entirely supplied by gravitational potential energy
					from a falling mass ≤ 5.0 kg (B) or 3.5 kg (C).</TF
				>
				<TF rule="3.d."
					>The gravitational potential energy is converted to air pressure or
					air movement, which is then used to launch the projectile.</TF
				>
				<TF rule="3.e."
					>All device air chambers start each launch at ambient air pressure and
					automatically return to ambient air pressure.</TF
				>
				<TF rule="3.f."
					>The device is triggered with an unsharpened #2 pencil to actuate a
					release mech. for the falling mass and does not contribute significant
					energy to launch.</TF
				>
				<TF rule="3.g."
					>Teams prepare a spherical projectile for launch greater than 1 in.
					and less than 3 in. in diameter, which does not damage the floor.</TF
				>
				<TF rule="3.h."
					>The launch device is designed and operated in such a way to not
					damage or alter the floor.</TF
				>
				<TF rule="3.i."
					>Electrical components are not part of the device or triggering
					device, with the exception of electronic sighting devices removed
					before launch.</TF
				>
			</svelte:fragment>
		</TF>

		<TF bind:checkbox={impounded} rule="2.b." numberItem
			><strong
				>Team impounds one launch device with the mass(es) detached,
				projectiles, calibration (if prep.)</strong
			></TF
		>
	</Section>

	{@const rules = {
		'5.b.':
			'Team places their device at a location they select in the launch area.',
		'5.c.':
			'No part of the launch device extends outside of the launch area' +
			' before or after a shot. Any part of the launching device extending beyond' +
			' the launch area during the launching action returns to and remains in the' +
			' launch area immediately after the launch without assistance of the' +
			' competitors.',
		'5.d.':
			'When triggering the device, competitors do not touch the device or' +
			' triggering mechanism, except for the #2 pencil.',
		nDist:
			'Straight line distance, in mm, from the center of the initial impact of the' +
			' projectile to the center of the target. If projectile does not impact the' +
			' elevated surface, put 2000.',
		fDist:
			'Straight line distance, in mm, from the center of the initial impact of the' +
			' projectile to the center of the target.',
		bucket:
			'For Launch 2 only: If Launch 1 at a target lands within 500mm, a bucket shot may be ' +
			' requested in place of the second shot. If this is a bucket shot, circle T and fill out ' +
			' the items below and leave 7.b. blank. Otherwise, leave the items below blank and fill ' +
			' out 7.b.',
		'7.d.1': 'The projectile hits the bucket at first impact.',
		'7.d.2':
			'The projectile contacts with the inside bottom surface of the bucket.'
	}}
	<Section title="Near Target: Launch 1">
		<TF linkChildren bind:checkbox={meetsNear1Rules} rule="5." numberItem>
			<strong>DEVICE MEETS ALL COMPETITION RULES FOR THIS LAUNCH</strong>

			<svelte:fragment slot="children">
				<TF rule="5.b.">{rules['5.b.']}</TF>
				<TF rule="5.c.">{rules['5.c.']}</TF>
				<TF rule="5.d.">{rules['5.d.']}</TF>
			</svelte:fragment>
		</TF>
		<Number bind:value={near1Dist} rule="7.b." numberItem min={0}
			>{rules.nDist}</Number
		>
	</Section>
	<Section title="Near Target: Launch 2">
		<TF linkChildren bind:checkbox={meetsNear2Rules} rule="5." numberItem>
			<strong>DEVICE MEETS ALL COMPETITION RULES FOR THIS LAUNCH</strong>

			<svelte:fragment slot="children">
				<TF rule="5.b.">{rules['5.b.']}</TF>
				<TF rule="5.c.">{rules['5.c.']}</TF>
				<TF rule="5.d.">{rules['5.d.']}</TF>
			</svelte:fragment>
		</TF>
		<Number
			bind:value={near2Dist}
			rule="7.b."
			numberItem
			min={0}
			blankOk={$nearBucket === 'True'}>{rules.nDist}</Number
		>
		<TF
			bind:checkbox={nearBucket}
			highlightFunction={bucketColor}
			rule="5.g."
			numberItem
		>
			{rules.bucket}

			<svelte:fragment slot="summary">Bucket shot parameters:</svelte:fragment>
			<svelte:fragment slot="children">
				<TF
					bind:checkbox={nearBucketHit}
					rule="7.d."
					numberItem
					blankOk={$nearBucket === 'False'}>{rules['7.d.1']}</TF
				>
				<TF
					bind:checkbox={nearBucketInside}
					rule="7.d."
					numberItem
					blankOk={$nearBucket === 'False'}>{rules['7.d.2']}</TF
				>
			</svelte:fragment>
		</TF>
	</Section>
	<Section title="Far Target: Launch 1">
		<TF linkChildren bind:checkbox={meetsFar1Rules} rule="5." numberItem>
			<strong>DEVICE MEETS ALL COMPETITION RULES FOR THIS LAUNCH</strong>

			<svelte:fragment slot="children">
				<TF rule="5.b.">{rules['5.b.']}</TF>
				<TF rule="5.c.">{rules['5.c.']}</TF>
				<TF rule="5.d.">{rules['5.d.']}</TF>
			</svelte:fragment>
		</TF>
		<Number bind:value={far1Dist} rule="7.b." numberItem min={0}
			>{rules.fDist}</Number
		>
	</Section>
	<Section title="Far Target: Launch 2">
		<TF linkChildren bind:checkbox={meetsFar2Rules} rule="5." numberItem>
			<strong>DEVICE MEETS ALL COMPETITION RULES FOR THIS LAUNCH</strong>

			<svelte:fragment slot="children">
				<TF rule="5.b.">{rules['5.b.']}</TF>
				<TF rule="5.c.">{rules['5.c.']}</TF>
				<TF rule="5.d.">{rules['5.d.']}</TF>
			</svelte:fragment>
		</TF>
		<Number
			bind:value={far2Dist}
			rule="7.b."
			numberItem
			min={0}
			blankOk={$farBucket === 'True'}>{rules.fDist}</Number
		>
		<TF
			bind:checkbox={farBucket}
			highlightFunction={bucketColor}
			rule="5.g."
			numberItem
		>
			{rules.bucket}

			<svelte:fragment slot="summary">Bucket shot parameters:</svelte:fragment>
			<svelte:fragment slot="children">
				<TF
					bind:checkbox={farBucketHit}
					rule="7.d."
					numberItem
					blankOk={$farBucket === 'False'}>{rules['7.d.1']}</TF
				>
				<TF
					bind:checkbox={farBucketInside}
					rule="7.d."
					numberItem
					blankOk={$farBucket === 'False'}>{rules['7.d.2']}</TF
				>
			</svelte:fragment>
		</TF>
	</Section>

	<Disqualified {status} bind:checked={dqed} />
</Checklist>
