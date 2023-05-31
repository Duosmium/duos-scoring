<script lang="ts">
	import type { ActionData } from './$types';
	import slugify from 'slugify';
	import Head from '$lib/components/Head.svelte';
	import { enhance } from '$app/forms';

	export let form: ActionData;

	let shortName = form?.returned.shortName ?? '';
	$: slug = slugify(shortName, {
		lower: true,
		strict: true,
		trim: true
	});
</script>

<Head title="Create Tournament | Duosmium Scoring" />

<main class="main">
	<header>
		<img src="/logo.png" alt="Duosmium Logo" />
		<a class="btn" href="/logout">Log Out</a>
	</header>
	<h1>Create a new tournament!</h1>

	{#if form?.success}
		<p>Changes saved!</p>
	{/if}

	<h2>General Info</h2>

	<form use:enhance method="post">
		<label>
			Name: <input type="text" name="name" value={form?.returned.name} required />
		</label>
		<label>
			Short Name: <input type="text" name="shortName" bind:value={shortName} required />
		</label>
		<label>
			Slug: <input type="text" name="slug" bind:value={slug} required />
		</label>
		<label>
			Location: <input type="text" name="location" value={form?.returned.location} required />
		</label>
		<label>
			State:
			<select name="state" value={form?.returned.state} required>
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
			<select name="level" value={form?.returned.level} required>
				<option value="INVITATIONAL">Invitational</option>
				<option value="REGIONAL">Regional</option>
				<option value="STATE">State</option>
				<option value="NATIONAL">National</option>
			</select>
		</label>
		<label>
			Division:
			<select name="division" value={form?.returned.division} required>
				<option value="C">High School (Div. C)</option>
				<option value="B">Middle School (Div. B)</option>
				<option value="A">Elementary School (Div. A)</option>
			</select>
		</label>
		<label>
			Year: <input type="number" name="year" value={form?.returned.year} required />
		</label>
		<label>
			Start Date: <input type="date" name="startDate" value={form?.returned.startDate} required />
		</label>
		<label>
			End Date: <input type="date" name="endDate" value={form?.returned.endDate} required />
		</label>
		<label>
			Awards Date: <input
				type="date"
				name="awardsDate"
				value={form?.returned.awardsDate}
				required
			/>
		</label>
		<label>
			Medals: <input type="number" name="medals" value={form?.returned.medals} />
		</label>
		<label>
			Trophies: <input type="number" name="trophies" value={form?.returned.trophies} />
		</label>
		<label>
			Bids: <input type="number" name="bids" value={form?.returned.bids} />
		</label>
		<label>
			N-Offset: <input type="number" name="nOffset" value={form?.returned.nOffset} />
		</label>
		<label>
			Drops: <input type="number" name="drops" value={form?.returned.drops} />
		</label>
		<button type="submit">Save</button>
	</form>
</main>

<style>
	img {
		height: 84px;
	}
	header {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 36px;
		gap: 16px;
	}

	form {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}
</style>
