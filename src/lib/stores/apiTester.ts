import { writable } from 'svelte/store';
import type { ApiEndpoint } from '$lib/types/api';

export const activeEndpoint = writable<ApiEndpoint | null>(null);

/** Increment to trigger a send in the ApiTesterPanel */
export const triggerSend = writable(0);
