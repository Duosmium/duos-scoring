import { invalidateAll } from '$app/navigation';
import { page } from '$app/stores';
import { addToastMessage, clearToasts } from '$lib/components/Toasts.svelte';
import { get } from 'svelte/store';

export function sendData(opts: {
	path?: string;
	method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
	body: any;
	multiple?: boolean;
	msgs?: {
		info?: string;
		success?: string;
		error?: string;
	};
}) {
	if (opts.msgs?.info) {
		addToastMessage(opts.msgs.info, 'info');
	}
	return new Promise<string>(async (res, rej) => {
		const currentPage = get(page);
		let ok = false;
		let msg = '';
		if (opts.multiple) {
			const resp = await Promise.all(
				(opts.body as any[]).map(async (body: any) => {
					return await fetch(opts.path ?? currentPage.url.pathname, {
						method: opts.method,
						body: JSON.stringify(body),
						headers: {
							'Content-Type': 'application/json'
						}
					});
				})
			);
			ok = resp.every((r) => r.ok);
		} else {
			const resp = await fetch(opts.path ?? currentPage.url.pathname, {
				method: opts.method,
				body: JSON.stringify(opts.body),
				headers: {
					'Content-Type': 'application/json'
				}
			});
			ok = resp.ok;
			msg = await resp.text();
		}
		if (ok) {
			res(msg);
			await invalidateAll();
			if (opts.msgs?.info) {
				clearToasts();
			}
			if (opts.msgs?.success) {
				addToastMessage(opts.msgs.success, 'success');
			}
		} else {
			rej(msg);
			await invalidateAll();
			if (opts.msgs?.info) {
				clearToasts();
			}
			if (opts.msgs?.error) {
				addToastMessage(opts.msgs.error, 'error');
			}
		}
	});
}
