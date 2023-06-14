<script lang="ts">
	import '../app.postcss';
	// import './app.css';

	import { invalidate } from '$app/navigation';
	import { onMount } from 'svelte';
	import type { LayoutData } from './$types';

	export let data: LayoutData;

	$: ({ supabase, session } = data);

	onMount(() => {
		const {
			data: { subscription }
		} = supabase.auth.onAuthStateChange((event, _session) => {
			if (_session?.expires_at !== session?.expires_at) {
				invalidate('supabase:auth');
			}
		});

		return () => subscription.unsubscribe();
	});
</script>

<div class="wrapper">
	<div class="bar" />
	<slot />
</div>
<footer>Duosmium Scoring System</footer>

<style>
	footer {
		display: grid;
		place-items: center;
		background-color: #1f1b35;
		color: #f5f5f4;
		padding: 64px;
		font-size: 1.1rem;
	}
	div.bar {
		position: sticky;
		top: 0;
		height: 12px;
		background: radial-gradient(
			circle at 50% 50%,
			#15658c,
			#196088,
			#20557c,
			#25466b,
			#263658,
			#242846,
			#211f3a,
			#1f1b35
		);
	}
	div.wrapper {
		min-height: 100vh;
		padding: 0;
	}
</style>
