<script>
	import '../app.postcss';
	import { page } from '$app/stores';
	import Head from '$lib/components/Head.svelte';
	import { DarkMode } from 'flowbite-svelte';
</script>

<Head title="An error occurred | Duosmium Scoring System" />

<div class="min-h-screen pb-2 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-200">
	<div class="bar" />

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
</div>
<footer>Duosmium Scoring System</footer>

<DarkMode
	btnClass="text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-700 rounded-lg text-lg p-2.5 fixed left-8 bottom-8 z-50"
/>

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
	footer {
		display: grid;
		place-items: center;
		background-color: #1f1b35;
		color: #f5f5f4;
		padding: 64px;
		font-size: 1.1rem;
	}
</style>
