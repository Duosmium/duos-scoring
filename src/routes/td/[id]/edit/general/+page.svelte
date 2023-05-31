<script lang="ts">
	import type { ActionData, PageData } from './$types';
	import Head from '$lib/components/Head.svelte';

	export let data: PageData;
	export let form: ActionData;
</script>

<Head
	title="Edit General Info | {data.tournament.year} {data.tournament.shortName} {data.tournament
		.division} | Duosmium Scoring"
/>

{#if form?.success}
	<p>Changes saved!</p>
{/if}

<h2>General Info</h2>

<form method="post">
	<label>
		Name: <input type="text" name="name" value={data.tournament.name} required />
	</label>
	<label>
		Short Name: <input type="text" name="shortName" value={data.tournament.shortName} required />
	</label>
	<label>
		Location: <input type="text" name="location" value={data.tournament.location} required />
	</label>
	<label>
		State:
		<select name="state" value={data.tournament.state} required>
			<option value="AL">Alabama</option>
			<option value="AK">Alaska</option>
			<option value="AZ">Arizona</option>
			<option value="AR">Arkansas</option>
			<option value="CA">California</option>
			<option value="nCA">Northern California (for regionals/states only)</option>
			<option value="sCA">Southern California (for regionals/states only)</option>
			<option value="CO">Colorado</option>
			<option value="CT">Connecticut</option>
			<option value="DE">Delaware</option>
			<option value="DC">District of Columbia</option>
			<option value="FL">Florida</option>
			<option value="GA">Georgia</option>
			<option value="HI">Hawaii</option>
			<option value="ID">Idaho</option>
			<option value="IL">Illinois</option>
			<option value="IN">Indiana</option>
			<option value="IA">Iowa</option>
			<option value="KS">Kansas</option>
			<option value="KY">Kentucky</option>
			<option value="LA">Louisiana</option>
			<option value="ME">Maine</option>
			<option value="MD">Maryland</option>
			<option value="MA">Massachusetts</option>
			<option value="MI">Michigan</option>
			<option value="MN">Minnesota</option>
			<option value="MS">Mississippi</option>
			<option value="MO">Missouri</option>
			<option value="MT">Montana</option>
			<option value="NE">Nebraska</option>
			<option value="NV">Nevada</option>
			<option value="NH">New Hampshire</option>
			<option value="NJ">New Jersey</option>
			<option value="NM">New Mexico</option>
			<option value="NY">New York</option>
			<option value="NC">North Carolina</option>
			<option value="ND">North Dakota</option>
			<option value="OH">Ohio</option>
			<option value="OK">Oklahoma</option>
			<option value="OR">Oregon</option>
			<option value="PA">Pennsylvania</option>
			<option value="RI">Rhode Island</option>
			<option value="SC">South Carolina</option>
			<option value="SD">South Dakota</option>
			<option value="TN">Tennessee</option>
			<option value="TX">Texas</option>
			<option value="UT">Utah</option>
			<option value="VT">Vermont</option>
			<option value="VA">Virginia</option>
			<option value="WA">Washington</option>
			<option value="WV">West Virginia</option>
			<option value="WI">Wisconsin</option>
			<option value="WY">Wyoming</option>
		</select>
	</label>
	<label>
		Level:
		<select name="level" value={data.tournament.level} required>
			<option value="INVITATIONAL">Invitational</option>
			<option value="REGIONAL">Regional</option>
			<option value="STATE">State</option>
			<option value="NATIONAL">National</option>
		</select>
	</label>
	<label>
		Division:
		<select name="division" value={data.tournament.division} required>
			<option value="C">High School (Div. C)</option>
			<option value="B">Middle School (Div. B)</option>
			<option value="A">Elementary School (Div. A)</option>
		</select>
	</label>
	<label>
		Year: <input type="number" name="year" value={data.tournament.year} required />
	</label>
	<label>
		Start Date: <input
			type="date"
			name="startDate"
			value={data.tournament.startDate.toISOString().slice(0, 10)}
			required
		/>
	</label>
	<label>
		End Date: <input
			type="date"
			name="endDate"
			value={data.tournament.endDate.toISOString().slice(0, 10)}
			required
		/>
	</label>
	<label>
		Awards Date: <input
			type="date"
			name="awardsDate"
			value={data.tournament.awardsDate.toISOString().slice(0, 10)}
			required
		/>
	</label>
	<label>
		Medals: <input type="number" name="medals" value={data.tournament.medals} />
	</label>
	<label>
		Trophies: <input type="number" name="trophies" value={data.tournament.trophies} />
	</label>
	<label>
		Bids: <input type="number" name="bids" value={data.tournament.bids} />
	</label>
	<label>
		N-Offset: <input type="number" name="nOffset" value={data.tournament.nOffset} />
	</label>
	<label>
		Drops: <input type="number" name="drops" value={data.tournament.drops} />
	</label>
	<button type="submit">Save</button>
</form>

<style>
	form {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}
</style>
