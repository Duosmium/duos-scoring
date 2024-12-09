import type { SvelteComponent } from 'svelte';
import lists2025 from './2025/index';

export default {
	2025: lists2025
} as Record<
	number,
	Record<
		string,
		typeof SvelteComponent<{
			[prop: string]: any;
			teamNumber: number;
			teamName: string;
			checklistData: DbJson.ChecklistData | undefined;
		}>
	>
>;
