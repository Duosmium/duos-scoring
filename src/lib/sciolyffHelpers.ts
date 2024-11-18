export function shortName(name?: string): string | undefined {
	if (name == undefined) {
		return undefined;
	}
	const subs = [
		['University of', 'U of'],
		['Science Olympiad'],
		['Tournament'],
		['Elementary School'],
		['Middle School'],
		['High School'],
		['Academy'],
		['University'],
		[' at ']
	];
	return subs
		.reduce(
			(name, sub) =>
				name.toLowerCase().replace(sub[0].toLowerCase(), sub[1] || ''),
			name
		)
		.split(' ')
		.filter((w) => w.length > 0)
		.map((w) =>
			['at', 'of', 'and'].includes(w)
				? w
				: w.charAt(0).toUpperCase() + w.slice(1)
		)
		.join(' ');
}

export function seasonYear(date: Date): number {
	const seasonStart = new Date(date.getFullYear(), 6, 15); // july 15
	if (date >= seasonStart) {
		return date.getFullYear() + 1;
	}
	return date.getFullYear();
}
