<script lang="ts">
	import Head from '$lib/components/Head.svelte';

	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import type { PageData } from './$types';

	let errorMessage = '';
	let successMessage = '';
	let view: 'sign_in' | 'sign_up' | 'forgot_pass' | 'pass_reset' = 'sign_in';

	const buttonText = {
		sign_in: 'Log In',
		sign_up: 'Sign Up',
		forgot_pass: 'Reset Password',
		pass_reset: 'Reset Password'
	};

	const headingText = {
		sign_in: 'Duosmium Scoring Login',
		sign_up: 'Create a Duosmium Scoring Account',
		forgot_pass: 'Reset Password',
		pass_reset: 'Reset Password'
	};

	export let data: PageData;
	$: ({ supabase } = data);

	onMount(() => {
		const code = $page.url.searchParams.get('code');

		if (code) {
			view = 'pass_reset';
		}
	});

	let loading = false;
	let name = '';
	let email = '';
	let password = '';
	let confirmPassword = '';

	$: {
		if (view === 'sign_up' || view === 'pass_reset') {
			if (password !== confirmPassword) {
				errorMessage = 'Passwords do not match!';
			} else {
				errorMessage = '';
			}
		}
	}

	const handleLogin = async () => {
		errorMessage = '';
		successMessage = '';
		try {
			loading = true;

			switch (view) {
				case 'sign_in': {
					const { error } = await supabase.auth.signInWithPassword({ email, password });
					if (error) throw error;
					goto('/dashboard');
					break;
				}
				case 'sign_up': {
					const { error } = await supabase.auth.signUp({
						email,
						password,
						options: {
							data: { name },
							emailRedirectTo: 'https://scoring.duosmium.org/dashboard'
						}
					});
					if (error) throw error;
					successMessage = 'Check your email for a confirmation link!';
					break;
				}
				case 'forgot_pass': {
					const { error } = await supabase.auth.resetPasswordForEmail(email, {
						redirectTo: 'https://scoring.duosmium.org/login'
					});
					if (error) throw error;
					successMessage = 'Check your email for a password reset link!';
					break;
				}
				case 'pass_reset': {
					const { error } = await supabase.auth.updateUser({ password });
					if (error) throw error;
					goto('/dashboard');
					break;
				}
			}
		} catch (error) {
			if (error instanceof Error) {
				errorMessage = error.message;
			}
		} finally {
			loading = false;
		}
	};
</script>

<Head title="Login | Duosmium Scoring" />

<main class="main">
	<div class="logo">
		<img class="dark:hidden inline-block" src="/logo_dark.png" alt="Duosmium Logo" />
		<img class="dark:inline-block hidden" src="/logo_light.png" alt="Duosmium Logo" />
	</div>
	<h1>{headingText[view]}</h1>
	{#if !successMessage}
		<form on:submit|preventDefault={handleLogin}>
			{#if view === 'sign_up'}
				<label>
					Preferred Full Name
					<input required type="text" bind:value={name} />
				</label>
			{/if}

			{#if view === 'sign_in' || view === 'sign_up' || view === 'forgot_pass'}
				<label>
					Email
					<input required type="email" bind:value={email} />
				</label>
			{/if}

			{#if view === 'sign_in' || view === 'sign_up' || view === 'pass_reset'}
				<label>
					Password
					<input required type="password" bind:value={password} />
				</label>
			{/if}

			{#if view === 'sign_up' || view === 'pass_reset'}
				<label>
					Confirm Password
					<input required type="password" bind:value={confirmPassword} />
				</label>
			{/if}

			<button
				class="px-4 py-2 border border-slate-500 rounded-md"
				type="submit"
				aria-live="polite"
				disabled={loading}
			>
				<span>{loading ? 'Loading' : buttonText[view]}</span>
			</button>
		</form>
	{/if}

	{#if errorMessage}
		<div class="error">{errorMessage}</div>
	{/if}

	{#if successMessage}
		<div class="success">{successMessage}</div>
	{/if}

	{#if view === 'sign_in'}
		<div class="mt-8 space-y-2 text-slate-800 dark:text-slate-400">
			<button
				class="block underline"
				on:click={() => {
					view = 'sign_up';
				}}>Don't have an account?</button
			>
			<button
				class="block underline"
				on:click={() => {
					view = 'forgot_pass';
				}}>Forgot password?</button
			>
		</div>
	{/if}
	{#if view === 'sign_up'}
		<div class="mt-8 text-slate-800 dark:text-slate-400">
			<button
				class="block underline"
				on:click={() => {
					view = 'sign_in';
				}}>Already have an account?</button
			>
		</div>
	{/if}
</main>

<style>
	main.main {
		max-width: 540px;
	}
	div.logo {
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

		border: 1px solid #64748b;
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
</style>
