<script lang="ts">
	export let event: string;
	export let year: number;
</script>

<div class="max-w-screen-lg mx-auto">
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
	* :global(input[type='text']),
	* :global(input[type='number']) {
		font-size: 16px;
		font-size: max(16px, 1em);
		font-family: inherit;
		padding: 0.25em 0.5em;
		background-color: transparent;
		line-height: 1;
		height: 2.25rem;
		max-width: 100%;
		@apply border-0 border-b-2 border-slate-900;
	}
	:global(.dark) * :global(input[type='text']),
	:global(.dark) * :global(input[type='number']) {
		@apply border-slate-200;
	}
	* :global(input[disabled]) {
		background-color: #eee;
		cursor: not-allowed;
	}
	* :global(input[inputmode='numeric']),
	* :global(input[type='number']) {
		width: 80px;
	}
	* :global(input[type='number']::-webkit-inner-spin-button),
	* :global(input[type='number']::-webkit-outer-spin-button) {
		-webkit-appearance: none;
		-moz-appearance: none;
		appearance: none;
		margin: 0;
	}
	* :global(input[type='number']) {
		appearance: none;
		-moz-appearance: textfield;
	}
	* :global(h3) {
		margin-top: 32px;
	}
</style>
