import type { ParamMatcher } from '@sveltejs/kit';

export const match: ParamMatcher = (param) => {
	try {
		return /^\d+$/.test(param) || param === BigInt(param).toString();
	} catch {
		return false;
	}
};
