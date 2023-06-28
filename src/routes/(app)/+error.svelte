<script>
	import { page } from '$app/stores';
	import Head from '$lib/components/Head.svelte';
</script>

<Head title="An error occurred | Duosmium Scoring System" />

<main class="main">
	<h1>An error occurred.</h1>
	<p class="error">{$page.status}: {$page.error?.message}</p>

	<p>
		If this error persists, please contact us at <a href="mailto:support@duosmium.org"
			>support@duosmium.org</a
		>.
	</p>

	<p><a href="/dashboard">Back to dashboard.</a></p>
	<p><a href="/logout">Log Out</a></p>
</main>

<style>
	h1 {
		margin-bottom: 8px;
	}
	.error {
		font-weight: 500;
		margin-bottom: 24px;
	}
	p {
		margin-bottom: 16px;
	}
</style>
