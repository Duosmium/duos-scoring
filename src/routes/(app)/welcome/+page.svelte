<script lang="ts">
	import type { ActionData, PageData } from './$types';
	import Head from '$lib/components/Head.svelte';

	export let form: ActionData;
	export let data: PageData;
</script>

<Head title="Welcome to Duosmium Scoring!" />

<main class="main">
	<header>
		<img src="/logo.png" alt="Duosmium Logo" />
		<a class="btn" href="/logout">Log Out</a>
	</header>
	<h1>Welcome to Duosmium Scoring!</h1>
	<p>Let's get you set up!</p>

	<h2>About You</h2>
	<p>First, we need to know a little bit about you.</p>
	<form method="post">
		<label>
			What's your preferred full name? <input name="name" type="text" required />
		</label>

		<button type="submit">Save</button>
	</form>
	{#if form?.errorMessage}
		<p class="error"><strong>Error:</strong> {form.errorMessage}</p>
	{/if}
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
	h2 {
		margin-top: 32px;
		margin-bottom: 12px;
	}
	p {
		margin-top: 16px;
		margin-bottom: 4px;
	}
	.error {
		background-color: #fecaca;
		color: #991b1b;
		border: 2px solid #991b1b;
		border-radius: 4px;

		padding: 8px 16px;
		margin-top: 32px;
	}
</style>
