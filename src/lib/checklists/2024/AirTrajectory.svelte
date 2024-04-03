<script lang="ts">
	import Checkbox, { type CheckboxValue } from '../components/Checkbox.svelte';
	import Checklist from '../components/Checklist.svelte';
	import Disqualified from '../components/Disqualified.svelte';
	import Parameter from '../components/Parameter.svelte';
	import ParameterTable from '../components/ParameterTable.svelte';
	import Section from '../components/Section.svelte';

	import type { ScoreStatus } from '@prisma/client';

	export let status: ScoreStatus;

	let hasDevice: CheckboxValue;
	let meetsParams: CheckboxValue;
	let impounded: CheckboxValue;

	let meetsNear1Rules: CheckboxValue;
	let near1Dist: string;

	let meetsNear2Rules: CheckboxValue;
	let near2Dist: string;
	let nearBucket: CheckboxValue;
	let nearBucketHit: CheckboxValue;
	let nearBucketInside: CheckboxValue;

	let meetsFar1Rules: CheckboxValue;
	let far1Dist: string;

	let meetsFar2Rules: CheckboxValue;
	let far2Dist: string;
	let farBucket: CheckboxValue;
	let farBucketHit: CheckboxValue;
	let farBucketInside: CheckboxValue;

	let logBasePoints: string;
	let logDataSpansVar: string;
	let logDataPts: string;
	let logLabeled: string;
	let logDistinctTables: string;
	let logDiagram: string;
	let logExCalcs: string;
</script>

<Checklist event="Air Trajectory B/C" year={2024}>
	<Section title="Check In">
		<ParameterTable>
			<Parameter bind:value={hasDevice} rule="7.g." checklistItem={1}
				>Team operates safely & has a device within spec before the end of the allotted competition
				period.</Parameter
			>
		</ParameterTable>
	</Section>

	<Section title="Construction Parameters">
		<ParameterTable>
			<Parameter parent={meetsParams} rule="3.a."
				>When ready-to-launch, the launch device, projectiles, stabilizing weights, and all other
				device components fit in a 75.0 cm (Div C) or 85.0 cm (Div B) per side cube, in any
				orientation chosen by the team.</Parameter
			>
			<Parameter parent={meetsParams} rule="3.b."
				>Launch force is entirely supplied by gravitational potential energy from a falling mass ≤
				3.500 kg (Div C) or 5.000 kg (Div B).</Parameter
			>
			<Parameter parent={meetsParams} rule="3.d."
				>The gravitational potential energy is converted to air pressure or air movement, which is
				then used to launch the projectile.</Parameter
			>
			<Parameter parent={meetsParams} rule="3.e."
				>All device air chambers start each launch at ambient air pressure and automatically return
				to ambient air pressure.</Parameter
			>
			<Parameter parent={meetsParams} rule="3.f."
				>Activating the triggering device does not contribute significant energy to the launch. It
				extends out of the launch area, allow for competitors to remain at least 75 cm away from the
				launch area. The triggering device does not pose a danger due to flying parts or excessive
				movement outside of the launch area.</Parameter
			>
			<Parameter parent={meetsParams} rule="3.g."
				>Team provides unmodified, standard tennis, racquet, and/or Ping Pong balls to be used as
				projectiles.</Parameter
			>
			<Parameter parent={meetsParams} rule="3.h."
				>The launch device is designed and operated in such a way to not damage or alter the floor.</Parameter
			>
			<Parameter parent={meetsParams} rule="3.i."
				>Electrical components are not part of the device or triggering device.</Parameter
			>
			<Parameter bind:value={meetsParams} checklistItem={2}
				><strong
					>DEVICE MEETS ALL CONSTRUCTION PARAMETERS ABOVE BY THE END OF THE COMPETITION PERIOD (If
					any construction violations are not corrected during the competition period, circle F.
					teams may still be permitted to compete but will be ranked behind every team.)</strong
				></Parameter
			>
			<Parameter bind:value={impounded} rule="2.b." checklistItem={3}
				><strong
					>Team impounds one launch device with the mass(es) detached, design log, and any
					projectiles.</strong
				></Parameter
			>
		</ParameterTable>
	</Section>

	<Section title="Competition">
		<table>
			<thead>
				<tr>
					<td><span class="sr-only">Rule Number</span></td>
					<td><span class="sr-only">Rule</span></td>
					<td colspan="4"><strong class="mx-auto block w-fit">Near Target</strong></td>
					<td colspan="4"><strong class="mx-auto block w-fit">Far Target</strong></td>
				</tr>
				<tr>
					<td></td>
					<td></td>
					<td></td>
					<td><strong>Launch 1</strong></td>
					<td></td>
					<td><strong>Launch 2</strong></td>
					<td></td>
					<td><strong>Launch 1</strong></td>
					<td></td>
					<td><strong>Launch 2</strong></td>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td>5.b.</td>
					<td
						>Team places their device at a location they select in the launch area. Competitors are
						not within 75 cm of launch area or in front of the front edge of launch area during a
						launch. Competitors only touch the part of the triggering device that extends at least
						75cm outside of launch area.</td
					>
					<td></td>
					<td><Checkbox parent={meetsNear1Rules} /></td>
					<td></td>
					<td><Checkbox parent={meetsNear2Rules} /></td>
					<td></td>
					<td><Checkbox parent={meetsFar1Rules} /></td>
					<td></td>
					<td><Checkbox parent={meetsFar2Rules} /></td>
				</tr>
				<tr>
					<td>5.c.</td>
					<td
						>No part of the launch device extends outside of the launch area before or after a shot.
						Any part of the launching device extending beyond launch area during the launching
						action returns to and remains in launch area immediately after the launch without
						assistance of the competitors.</td
					>
					<td></td>
					<td><Checkbox parent={meetsNear1Rules} /></td>
					<td></td>
					<td><Checkbox parent={meetsNear2Rules} /></td>
					<td></td>
					<td><Checkbox parent={meetsFar1Rules} /></td>
					<td></td>
					<td><Checkbox parent={meetsFar2Rules} /></td>
				</tr>
				<tr>
					<td></td>
					<td><strong>DEVICE MEETS ALL COMPETITION RULES FOR THIS LAUNCH</strong></td>
					<td><strong>4.</strong></td>
					<td><Checkbox bind:value={meetsNear1Rules} /></td>
					<td><strong>6.</strong></td>
					<td><Checkbox bind:value={meetsNear2Rules} /></td>
					<td><strong>11.</strong></td>
					<td><Checkbox bind:value={meetsFar1Rules} /></td>
					<td><strong>13.</strong></td>
					<td><Checkbox bind:value={meetsFar2Rules} /></td>
				</tr>
				<tr>
					<td></td>
					<td
						>Straight line distance, in mm, from the center of the initial impact of the projectile
						to the center of the target.</td
					>
					<td><strong>5.</strong></td>
					<td><input bind:value={near1Dist} type="text" inputmode="numeric" /></td>
					<td><strong>7.</strong></td>
					<td><input bind:value={near2Dist} type="text" inputmode="numeric" /></td>
					<td><strong>12.</strong></td>
					<td><input bind:value={far1Dist} type="text" inputmode="numeric" /></td>
					<td><strong>14.</strong></td>
					<td><input bind:value={far2Dist} type="text" inputmode="numeric" /></td>
				</tr>
				<tr>
					<td></td>
					<td
						>For Launch 2 only: If Launch 1 at a target lands within 500mm, a bucket shot may be
						requested in place of the second shot. If this is a bucket shot, circle T and fill out
						the items below and leave 7.b. blank. Otherwise, leave the items below blank and fill
						out 7.b.</td
					>
					<td></td>
					<td></td>
					<td><strong>8.</strong></td>
					<td><Checkbox bind:value={nearBucket} /></td>
					<td></td>
					<td></td>
					<td><strong>15.</strong></td>
					<td><Checkbox bind:value={farBucket} /></td>
				</tr>
				<tr>
					<td>7.e.</td>
					<td>The projectile hits the bucket at first impact</td>
					<td></td>
					<td></td>
					<td><strong>9.</strong></td>
					<td><Checkbox bind:value={nearBucketHit} /></td>
					<td></td>
					<td></td>
					<td><strong>16.</strong></td>
					<td><Checkbox bind:value={farBucketHit} /></td>
				</tr>
				<tr>
					<td>7.e.</td>
					<td>The projectile contacts with the inside bottom surface of the bucket.</td>
					<td></td>
					<td></td>
					<td><strong>10.</strong></td>
					<td><Checkbox bind:value={nearBucketInside} /></td>
					<td></td>
					<td></td>
					<td><strong>17.</strong></td>
					<td><Checkbox bind:value={farBucketInside} /></td>
				</tr>
			</tbody>
		</table>
	</Section>

	<Section title="Log Score">
		<ParameterTable>
			<Parameter bind:value={logBasePoints} input={true} checklistItem={18} rule="7.d.i."
				>Properly formatted Design Log containing all the required elements is submitted (up to 30
				points)</Parameter
			>
			<Parameter bind:value={logDataSpansVar} input={true} checklistItem={19} rule="7.d.ii."
				>Of one graphs/tables selected by the Event Sup, it includes data spanning ≥ 1 variable
				range in 4.a.iii. (up to 60 points)</Parameter
			>
			<Parameter bind:value={logDataPts} input={true} checklistItem={20} rule="7.d.iii."
				>Of one graphs/tables selected by the Event Sup, it includes at least 10 data points in each
				data series (up to 55 points)</Parameter
			>
			<Parameter bind:value={logLabeled} input={true} checklistItem={21} rule="7.d.iv."
				>Of one graphs/tables selected by the Event Sup, it is properly labeled (e.g. title, units)
				(up to 40 points)</Parameter
			>
			<Parameter bind:value={logDistinctTables} input={true} checklistItem={22} rule="7.d.v."
				>Points for each distinct graph/table turned in (30 points for each, up to 120 points total)</Parameter
			>
			<Parameter bind:value={logDiagram} input={true} checklistItem={23} rule="7.d.vi."
				>Includes a labeled device picture or diagram (up to 45 points)</Parameter
			>
			<Parameter bind:value={logExCalcs} input={true} checklistItem={24} rule="7.d.vii."
				>Includes at least 2 example calculations (up to 50 points)</Parameter
			>
		</ParameterTable>
	</Section>

	<Disqualified checklistItem={25} {status} />
</Checklist>
