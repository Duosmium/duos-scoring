export const normalize = (name: string) =>
	name
		.trim()
		.toLowerCase()
		.split(' ')
		.filter((n) => !['school', 'of', 'academy', 'and', 'for', ''].includes(n))
		.join(' ');
