import type { ComponentType } from 'svelte';
import lists2024 from './2024/index';

export default {
	2024: lists2024
} as Record<number, Record<string, ComponentType>>;
