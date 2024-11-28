export const normalize = (name: string) =>
	name
		.trim()
		.toLowerCase()
		.replaceAll(/[^a-z0-9]+/g, ' ')
		.split(' ')
		.flatMap((n) =>
			['school', 'academy', 'of', 'and', 'for', 'the', ''].includes(n)
				? []
				: [
						[
							['hs', 'high'],
							['ms', 'middle'],
							['es', 'elementary'],
							['ems', 'elementary middle'],
							['jhs', 'junior high'],
							['mhs', 'middle high'],
							['jr', 'junior'],
							['sr', 'senior'],
							['jrsr', 'junior senior']
						].find(([from]) => n === from)?.[1] ?? n
					]
		)
		.join(' ');
