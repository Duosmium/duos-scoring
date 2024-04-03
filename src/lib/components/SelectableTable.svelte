<script lang="ts">
	import {
		Table,
		TableBody,
		TableBodyCell,
		TableBodyRow,
		TableHead,
		TableHeadCell,
		Checkbox,
		Button
	} from 'flowbite-svelte';

	type T = $$Generic<{ id: any; disabled?: boolean; initiallyChecked?: boolean }>;

	export let cols: number;
	export let items: T[];
	export let selected: typeof items;
	$: selected = items.filter((item) => checked.get(item.id));

	let checked = new Map(items.map((item) => [item.id, !!item.initiallyChecked]));

	$: checked = items.reduce((acc, cur) => {
		if (acc.has(cur.id)) return acc;
		acc.set(cur.id, false);
		return acc;
	}, checked);

	let selectAll = false;

	let lastIndex = -1;
	function toggleCheck(id: string) {
		selectAll = false;
		if (!shiftDown) {
			lastIndex = items.findIndex((item) => item.id === id);
			if (items[lastIndex].disabled === true) return;
			checked.set(id, !checked.get(id));
			checked = checked;
		} else {
			const currentIndex = items.findIndex((item) => item.id === id);
			if (currentIndex === -1) return;
			const currentStatus = checked.get(items[currentIndex].id);
			const minIndex = Math.min(currentIndex, lastIndex);
			const maxIndex = Math.max(currentIndex, lastIndex);
			items
				.filter((_, i) => i >= minIndex && i <= maxIndex)
				.forEach((item) => {
					if (item.disabled !== true) checked.set(item.id, !currentStatus);
				});
			checked = checked;
			lastIndex = currentIndex;
		}
	}

	function toggleAll() {
		selectAll = !selectAll;
		checked = new Map(items.map((item) => [item.id, item.disabled === true ? false : selectAll]));
	}

	let shiftDown = false;
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Shift') {
			shiftDown = true;
		}
	}
	function handleKeyup(event: KeyboardEvent) {
		if (event.key === 'Shift') {
			shiftDown = false;
		}
	}
</script>

<svelte:window on:keydown={handleKeydown} on:keyup={handleKeyup} />

{#if selected.length > 0}
	<div
		class="fixed bottom-12 left-1/2 -translate-x-1/2 bg-slate-300 dark:bg-slate-700 z-40 rounded-lg p-4 flex items-center space-x-4"
	>
		<span>{selected.length} selected</span>
		<Button
			size="sm"
			color="alternative"
			btnClass="bg-transparent border-none underline p-2"
			on:click={() => {
				checked = new Map(items.map((item) => [item.id, false]));
				selectAll = false;
			}}>Clear</Button
		>
		<slot name="buttons" />
	</div>
{/if}
<Table divClass="relative overflow-x-auto" hoverable={true}>
	<!-- top-[92px] lg:top-[116px] -->
	<TableHead>
		<TableHeadCell class="py-4 pl-4 pr-2">
			<Checkbox on:click={toggleAll} checked={selectAll} />
		</TableHeadCell>
		<slot name="headers" />
	</TableHead>
	<TableBody tableBodyClass="divide-y">
		{#if items.length === 0}
			<TableBodyRow>
				<TableBodyCell colspan={cols} class="text-center">
					<p>This table is empty!</p>
				</TableBodyCell>
			</TableBodyRow>
		{:else}
			{#each items as item}
				<TableBodyRow>
					<TableBodyCell class="py-4 pl-4 pr-2">
						<Checkbox
							disabled={item.disabled === true}
							on:click={() => {
								toggleCheck(item.id);
							}}
							checked={checked.get(item.id)}
						/>
					</TableBodyCell>
					<slot name="item" {item} />
				</TableBodyRow>
			{/each}
		{/if}
	</TableBody>
</Table>
