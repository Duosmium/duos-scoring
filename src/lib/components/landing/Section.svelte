<script lang="ts">
	export let wrapperClass: string = '';
	export let contentClass: string = '';
	export let innerClass: string = '';
	export let id: string | undefined = undefined;
</script>

<section class="{wrapperClass} px-8" {id}>
	<div class="max-w-7xl mx-auto w-full pt-14 pb-8 {innerClass}">
		<h2 class="text-4xl font-bold text-center mb-8 leading-snug">
			<slot name="title" />
		</h2>
		<div
			class="{contentClass} text-slate-700 leading-relaxed dark:text-slate-100"
		>
			<slot name="content" />
		</div>
	</div>
</section>
