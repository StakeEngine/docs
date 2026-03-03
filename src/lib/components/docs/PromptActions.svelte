<script lang="ts">
	let { contentEl }: { contentEl: HTMLElement | undefined } = $props();
	let copied = $state(false);
	let copyBtnEl: HTMLButtonElement | undefined = $state();

	function getPageContent(): string {
		if (!contentEl) return '';

		const clone = contentEl.cloneNode(true) as HTMLElement;
		clone.querySelectorAll('.prompt-actions, button').forEach(el => el.remove());

		let text = '';
		const h1 = clone.querySelector('h1');
		if (h1) {
			text += `# ${h1.textContent?.trim()}\n\n`;
		}

		function tableToMarkdown(table: Element): string {
			const rows = table.querySelectorAll('tr');
			if (rows.length === 0) return '';
			let md = '';
			rows.forEach((row, i) => {
				const cells = row.querySelectorAll('th, td');
				const line = Array.from(cells).map(c => c.textContent?.trim() || '').join(' | ');
				md += `| ${line} |\n`;
				if (i === 0) {
					md += `| ${Array.from(cells).map(() => '---').join(' | ')} |\n`;
				}
			});
			return md;
		}

		clone.querySelectorAll('h2, h3, p, li, pre, code, table').forEach(el => {
			const tag = el.tagName.toLowerCase();
			// Skip elements nested inside already-handled parents
			if (tag !== 'table' && el.closest('table')) return;
			if (tag === 'code' && el.closest('pre')) return;

			const content = el.textContent?.trim() || '';

			if (tag === 'h2') {
				text += `\n## ${content}\n\n`;
			} else if (tag === 'h3') {
				text += `\n### ${content}\n\n`;
			} else if (tag === 'p' && el.parentElement?.tagName !== 'LI') {
				text += `${content}\n\n`;
			} else if (tag === 'li') {
				text += `- ${content}\n`;
			} else if (tag === 'pre') {
				text += `\`\`\`\n${content}\n\`\`\`\n\n`;
			} else if (tag === 'table') {
				text += tableToMarkdown(el) + '\n';
			}
		});

		return text.trim();
	}

	function buildPrompt(): string {
		const content = getPageContent();
		if (!content) return '';

		const url = window.location.href;
		return `I'm sharing documentation from Stake Engine Docs.\n\nSource: ${url}\n\n---\n\n${content}\n\n---\n\nUsing the documentation above as context, help me understand and work with this part of the system.`;
	}

	async function copyAsPrompt() {
		const prompt = buildPrompt();
		if (!prompt) return;

		try {
			await navigator.clipboard.writeText(prompt);
		} catch {
			const textarea = document.createElement('textarea');
			textarea.value = prompt;
			textarea.style.cssText = 'position:fixed;opacity:0';
			document.body.appendChild(textarea);
			textarea.select();
			document.execCommand('copy');
			document.body.removeChild(textarea);
		}

		copied = true;
		setTimeout(() => (copied = false), 2000);
	}

	function openInChatGPT() {
		const prompt = encodeURIComponent(buildPrompt());
		window.open(`https://chat.openai.com/?q=${prompt}`, '_blank');
	}

	function openInClaude() {
		const prompt = encodeURIComponent(buildPrompt());
		window.open(`https://claude.ai/new?q=${prompt}`, '_blank');
	}

	function openInPerplexity() {
		const prompt = encodeURIComponent(buildPrompt());
		window.open(`https://www.perplexity.ai/search/new?q=${prompt}`, '_blank');
	}
</script>

<div class="prompt-actions not-prose flex items-center gap-2 mb-6 mt-2 fade-in">
	<button
		bind:this={copyBtnEl}
		onclick={copyAsPrompt}
		class="copy-btn relative flex items-center gap-2 px-3.5 py-1.5 text-sm font-medium rounded-md
			border transition-colors duration-200 overflow-hidden
			{copied
				? 'bg-primary-950/50 border-primary-700/50 text-primary-400'
				: 'bg-zinc-800 hover:bg-primary-950/30 text-zinc-300 hover:text-primary-400 border-zinc-700 hover:border-primary-700/40'}"
	>
		<span class="icon-wrap" class:pop={copied}>
			{#if copied}
				<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
					<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
				</svg>
			{:else}
				<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
						d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
				</svg>
			{/if}
		</span>
		<span class="label-text" class:label-copied={copied}>{copied ? 'Successful copy!' : 'Copy as prompt'}</span>
	</button>

	<div class="flex items-center gap-1.5 ml-1">
		<span class="text-xs text-zinc-500 font-medium mr-0.5">Open in:</span>

		<button
			onclick={openInChatGPT}
			title="Open in ChatGPT"
			class="ai-btn flex items-center justify-center w-8 h-8 rounded-md
				bg-zinc-800 border border-zinc-700 hover:bg-primary-950/30 hover:border-primary-700/40 transition-all"
		>
			<img src="/icons/chatgpt.svg" alt="ChatGPT" class="w-5 h-5" onerror={(e) => (e.currentTarget as HTMLImageElement).style.display='none'} />
		</button>

		<button
			onclick={openInClaude}
			title="Open in Claude"
			class="ai-btn flex items-center justify-center w-8 h-8 rounded-md
				bg-zinc-800 border border-zinc-700 hover:bg-primary-950/30 hover:border-primary-700/40 transition-all"
		>
			<img src="/icons/claude.svg" alt="Claude" class="w-5 h-5" onerror={(e) => (e.currentTarget as HTMLImageElement).style.display='none'} />
		</button>

		<button
			onclick={openInPerplexity}
			title="Open in Perplexity"
			class="ai-btn flex items-center justify-center w-8 h-8 rounded-md
				bg-zinc-800 border border-zinc-700 hover:bg-primary-950/30 hover:border-primary-700/40 transition-all"
		>
			<img src="/icons/perplexity.svg" alt="Perplexity" class="w-5 h-5" onerror={(e) => (e.currentTarget as HTMLImageElement).style.display='none'} />
		</button>
	</div>
</div>

<style>
	@keyframes fadeSlideIn {
		from { opacity: 0; transform: translateY(-6px); }
		to { opacity: 1; transform: translateY(0); }
	}
	.fade-in {
		animation: fadeSlideIn 0.35s ease-out 0.1s both;
	}

	/* Checkmark pop */
	@keyframes popIn {
		0% { transform: scale(0); }
		50% { transform: scale(1.3); }
		100% { transform: scale(1); }
	}
	.icon-wrap {
		display: flex;
		align-items: center;
	}
	.icon-wrap.pop {
		animation: popIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
	}

	/* Label swap */
	@keyframes slideUp {
		from { opacity: 0; transform: translateY(4px); }
		to { opacity: 1; transform: translateY(0); }
	}
	.label-copied {
		animation: slideUp 0.25s ease-out;
	}

	.ai-btn img {
		opacity: 0.6;
		transition: opacity 0.15s;
	}
	.ai-btn:hover img {
		opacity: 1;
	}
</style>
