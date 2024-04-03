<script lang="ts">
	export let event: string;
	export let year: number;
</script>

<div class="max-w-screen-lg mx-auto px-8">
	<h1>{event}</h1>
	<h2>Team Checklist - {year}</h2>

	<div>
		<label>
			<span>Team Number:</span>
			<input type="text" inputmode="numeric" />
		</label>

		<label>
			<span>School and Team Name:</span>
			<input type="text" />
		</label>

		<label>
			<span>Student Names:</span>
			<input type="text" />
		</label>

		<slot />
	</div>
</div>

<style lang="postcss">
	label {
		display: block;
	}
	* :global(input[type='text']) {
		font-size: 16px;
		font-size: max(16px, 1em);
		font-family: inherit;
		padding: 0.25em 0.5em;
		background-color: transparent;
		line-height: 1;
		height: 2.25rem;
		@apply border-0 border-b-2 border-slate-900;
	}
	:global(.dark) * :global(input[type='text']) {
		@apply border-slate-200;
	}
	* :global(input[disabled]) {
		background-color: #eee;
		cursor: not-allowed;
	}
	* :global(input[inputmode='numeric']) {
		width: 80px;
	}
	* :global(h3) {
		margin-top: 32px;
	}
	* :global(table) {
		border-collapse: collapse;
		width: 100%;
	}
	* :global(table td) {
		padding: 2px 8px;
	}
	* :global(table tr:nth-child(odd)) {
		@apply bg-slate-200;
	}
	:global(.dark) * :global(table tr:nth-child(odd)) {
		@apply bg-slate-700;
	}
</style>
