<script lang="ts">
	import type { ApiEndpoint } from '$lib/types/api';
	import { METHOD_COLORS, getStatusColor } from '$lib/types/api';
	import { highlight } from '$lib/highlight';
	import { triggerSend } from '$lib/stores/apiTester';

	let {
		endpoint
	}: {
		endpoint: ApiEndpoint;
	} = $props();

	let prevTrigger = 0;
	const unsubTrigger = triggerSend.subscribe((v) => {
		if (v > 0 && v !== prevTrigger) {
			prevTrigger = v;
			sendRequest();
		}
	});

	function buildInitialParams(ep: ApiEndpoint): Record<string, string> {
		const vals: Record<string, string> = {};
		for (const p of ep.params) {
			vals[p.name] = p.example ?? p.defaultValue ?? '';
		}
		return vals;
	}

	let paramValues = $state<Record<string, string>>(buildInitialParams(endpoint));
	let isLoading = $state(false);
	let responseStatus = $state<number | null>(null);
	let responseStatusText = $state('');
	let responseBody = $state('');
	let responseHighlighted = $state('');
	let responseError = $state('');
	let responseTime = $state<number | null>(null);
	let copied = $state(false);

	async function copyResponse() {
		if (!responseBody) return;
		try {
			await navigator.clipboard.writeText(responseBody);
			copied = true;
			setTimeout(() => (copied = false), 2000);
		} catch {}
	}

	// Re-initialize when endpoint changes
	let prevEndpointPath = $state(endpoint.method + endpoint.path);
	$effect(() => {
		const key = endpoint.method + endpoint.path;
		if (key !== prevEndpointPath) {
			prevEndpointPath = key;
			paramValues = buildInitialParams(endpoint);
		}
	});

	const methodColor = $derived(METHOD_COLORS[endpoint.method]);

	const resolvedUrl = $derived.by(() => {
		let url = endpoint.baseUrl + endpoint.path;
		// Substitute path params
		for (const p of endpoint.params) {
			if (p.location === 'path') {
				url = url.replace(`{${p.name}}`, encodeURIComponent(paramValues[p.name] || `{${p.name}}`));
			}
		}
		// Append query params
		const queryParams = endpoint.params.filter((p) => p.location === 'query');
		const searchParams = new URLSearchParams();
		for (const p of queryParams) {
			const val = paramValues[p.name];
			if (val) searchParams.set(p.name, val);
		}
		const qs = searchParams.toString();
		if (qs) url += '?' + qs;
		return url;
	});

	function coerceValue(val: string, type: string): string | number | boolean {
		if (!val) return val;
		if (type === 'integer') {
			const n = parseInt(val, 10);
			return isNaN(n) ? val : n;
		}
		if (type === 'number' || type === 'float') {
			const n = parseFloat(val);
			return isNaN(n) ? val : n;
		}
		if (type === 'boolean') {
			return val === 'true';
		}
		return val;
	}

	function buildBody(params: typeof endpoint.params): Record<string, string | number | boolean> {
		const body: Record<string, string | number | boolean> = {};
		for (const p of params) {
			const val = paramValues[p.name];
			if (val) body[p.name] = coerceValue(val, p.type);
		}
		return body;
	}

	const rawRequest = $derived.by(() => {
		const urlObj = (() => {
			try {
				return new URL(resolvedUrl);
			} catch {
				return null;
			}
		})();
		const pathAndQuery = urlObj ? urlObj.pathname + urlObj.search : endpoint.path;
		const host = urlObj?.host ?? endpoint.baseUrl;

		let lines = [`${endpoint.method} ${pathAndQuery} HTTP/1.1`, `Host: ${host}`];

		const bodyParams = endpoint.params.filter((p) => p.location === 'body');
		const hasBody = ['POST', 'PUT', 'PATCH'].includes(endpoint.method) || bodyParams.length > 0;

		if (hasBody) {
			lines.push('Content-Type: application/json');
		}

		if (hasBody && bodyParams.length > 0) {
			const body = buildBody(bodyParams);
			if (Object.keys(body).length > 0) {
				lines.push('');
				lines.push(JSON.stringify(body, null, 2));
			}
		}

		return lines.join('\n');
	});

	async function sendRequest() {
		isLoading = true;
		responseStatus = null;
		responseStatusText = '';
		responseBody = '';
		responseHighlighted = '';
		responseError = '';
		responseTime = null;

		const bodyParams = endpoint.params.filter((p) => p.location === 'body');
		const hasBody = ['POST', 'PUT', 'PATCH'].includes(endpoint.method) || bodyParams.length > 0;

		const start = performance.now();

		try {
			const options: RequestInit = {
				method: endpoint.method,
				headers: {}
			};

			if (hasBody) {
				const body = buildBody(bodyParams);
				options.headers = { 'Content-Type': 'application/json' };
				options.body = JSON.stringify(body);
			}

			const res = await fetch(resolvedUrl, options);
			responseTime = Math.round(performance.now() - start);
			responseStatus = res.status;
			responseStatusText = res.statusText;

			const text = await res.text();
			try {
				responseBody = JSON.stringify(JSON.parse(text), null, 2);
			} catch {
				responseBody = text;
			}

			responseHighlighted = await highlight(responseBody, 'json');
		} catch (err) {
			responseTime = Math.round(performance.now() - start);
			responseError = err instanceof Error ? err.message : 'Request failed';
		} finally {
			isLoading = false;
		}
	}
</script>

<div class="flex h-full flex-col">
	<!-- Header: Method + Path -->
	<div class="border-b border-zinc-800 px-4 py-3">
		<div class="flex items-center gap-2">
			<span
				class="inline-flex items-center rounded-md px-2 py-1 text-xs font-bold ring-1 ring-inset {methodColor.bg} {methodColor.text} {methodColor.ring}"
			>
				{endpoint.method}
			</span>
			<code class="truncate text-sm text-zinc-300">{endpoint.path}</code>
		</div>
		{#if endpoint.scopes && endpoint.scopes.length > 0}
			<div class="mt-2 flex flex-wrap gap-1">
				{#each endpoint.scopes as scope}
					<span
						class="inline-flex items-center rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-400"
					>
						{scope}
					</span>
				{/each}
			</div>
		{/if}
	</div>

	<!-- HTTP Request Preview -->
	<div class="border-b border-zinc-800 px-4 py-3">
		<p class="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">Request</p>
		<pre
			class="overflow-x-auto rounded-md bg-zinc-900 p-3 text-xs leading-relaxed text-zinc-400">{rawRequest}</pre>
	</div>

	<!-- Parameter Inputs -->
	{#if endpoint.params.length > 0}
		<div class="border-b border-zinc-800 px-4 py-3">
			<p class="mb-3 text-xs font-medium uppercase tracking-wider text-zinc-500">Parameters</p>
			<div class="space-y-3">
				{#each endpoint.params as param}
					<div>
						<label class="mb-1 flex items-center gap-1.5" for="param-{param.name}">
							<span class="text-xs font-medium text-zinc-300">{param.name}</span>
							<span class="text-[10px] text-zinc-600">{param.type}</span>
							{#if param.required}
								<span class="text-[10px] text-red-400">*</span>
							{/if}
						</label>
						<input
							id="param-{param.name}"
							type="text"
							bind:value={paramValues[param.name]}
							placeholder={param.example ?? param.defaultValue ?? ''}
							class="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-200 placeholder-zinc-600 outline-none transition-colors focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
						/>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Test Button -->
	<div class="border-b border-zinc-800 px-4 py-3">
		<button
			onclick={sendRequest}
			disabled={isLoading}
			class="flex w-full items-center justify-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
		>
			{#if isLoading}
				<svg class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
					<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
					<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
				</svg>
				Sending...
			{:else}
				Test it ▶
			{/if}
		</button>
	</div>

	<!-- Response Area -->
	{#if responseStatus !== null || responseError}
		<div class="flex-1 overflow-y-auto px-4 py-3">
			<div class="mb-2 flex items-center gap-2">
				<p class="text-xs font-medium uppercase tracking-wider text-zinc-500">Response</p>
				{#if responseStatus !== null}
					{@const statusColor = getStatusColor(responseStatus)}
					<span
						class="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset {statusColor.bg} {statusColor.text} {statusColor.ring}"
					>
						{responseStatus} {responseStatusText}
					</span>
				{/if}
				{#if responseTime !== null}
					<span class="text-[11px] text-zinc-600">{responseTime}ms</span>
				{/if}
				{#if responseBody}
					<button
						onclick={copyResponse}
						class="ml-auto flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
					>
						{#if copied}
							<svg class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
							Copied
						{:else}
							<svg class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
							Copy
						{/if}
					</button>
				{/if}
			</div>

			{#if responseError}
				<div class="rounded-md border border-red-400/20 bg-red-400/5 p-3 text-sm text-red-400">
					{responseError}
				</div>
			{:else if responseHighlighted}
				<div class="overflow-x-auto rounded-md border border-zinc-800 text-sm [&>pre]:!m-0 [&>pre]:!rounded-md [&>pre]:!border-0 [&>pre]:!p-3">
					{@html responseHighlighted}
				</div>
			{:else if responseBody}
				<pre class="overflow-x-auto rounded-md bg-zinc-900 p-3 text-sm text-zinc-400">{responseBody}</pre>
			{/if}
		</div>
	{/if}
</div>
