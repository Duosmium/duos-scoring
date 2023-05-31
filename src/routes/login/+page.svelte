<script lang="ts">
	import Head from '$lib/components/Head.svelte';

	import { Auth } from '@supabase/auth-ui-svelte';
	import { ThemeSupa } from '@supabase/auth-ui-shared';
	import type { PageData } from './$types';

	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	export let data: PageData;
	$: {
		const redirectTo = $page.url.searchParams.get('redirect');

		// check if user has been set in session store then redirect
		if (browser && data.session) {
			goto(redirectTo ?? '/dashboard');
		}
	}
</script>

<Head title="Login | Duosmium Scoring" />

<main class="main">
	<div>
		<img src="/logo.png" alt="Duosmium Logo" />
	</div>
	<h1>Duosmium Scoring Login</h1>
	<Auth
		supabaseClient={data.supabase}
		view="sign_in"
		redirectTo={`${data.url}/login?redirect=/`}
		showLinks={false}
		appearance={{ theme: ThemeSupa }}
	/>
	<p><a href="/signup">Don't have an account? Sign up here!</a></p>
</main>

<style>
	main.main {
		max-width: 540px;
	}
	div {
		display: flex;
		justify-content: center;
	}
	img {
		height: 96px;
		margin: 32px 0;
	}
	h1 {
		margin-bottom: 32px;
	}
	input {
		display: block;
		font-size: 1rem;

		color: inherit;
		background-color: transparent;

		border: 2px solid #57534e;
		border-radius: 4px;
		margin-top: 6px;
		padding: 8px 16px;

		width: 100%;
	}
	label {
		display: block;
	}
	form * + * {
		margin-top: 24px;
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
