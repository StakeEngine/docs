import { writable, derived, get } from 'svelte/store';

export interface EditorFrontmatter {
	title: string;
	description: string;
	order: number | null;
	tags: string[];
	icon: string;
	badge: string;
	nav_title: string;
	updated: string;
}

export interface EditorState {
	isOpen: boolean;
	mode: 'edit' | 'create';
	routePath: string;
	section: 'docs' | 'faq';
	originalContent: string;
	frontmatter: EditorFrontmatter;
	body: string;
	saving: boolean;
	error: string | null;
	lastSaved: Date | null;
}

const defaultFrontmatter: EditorFrontmatter = {
	title: '',
	description: '',
	order: null,
	tags: [],
	icon: '',
	badge: '',
	nav_title: '',
	updated: ''
};

const defaultState: EditorState = {
	isOpen: false,
	mode: 'edit',
	routePath: '',
	section: 'docs',
	originalContent: '',
	frontmatter: { ...defaultFrontmatter },
	body: '',
	saving: false,
	error: null,
	lastSaved: null
};

export const editor = writable<EditorState>({ ...defaultState });

// --- Undo / Redo history ---

interface Snapshot {
	frontmatter: EditorFrontmatter;
	body: string;
}

const MAX_HISTORY = 100;
let undoStack: Snapshot[] = [];
let redoStack: Snapshot[] = [];
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
// Captured synchronously BEFORE the first change in a burst
let pendingBefore: Snapshot | null = null;

export const canUndo = writable(false);
export const canRedo = writable(false);

function syncHistoryFlags() {
	canUndo.set(undoStack.length > 0);
	canRedo.set(redoStack.length > 0);
}

function resetHistory() {
	undoStack = [];
	redoStack = [];
	pendingBefore = null;
	if (debounceTimer) clearTimeout(debounceTimer);
	debounceTimer = null;
	syncHistoryFlags();
}

function cloneSnap(fm: EditorFrontmatter, body: string): Snapshot {
	return { frontmatter: JSON.parse(JSON.stringify(fm)), body };
}

/** Call BEFORE applying a change. Captures current state on first call,
 *  then commits it to the undo stack after 400ms of inactivity. */
function captureBeforeChange() {
	// On the first change of a burst, snapshot the current (pre-change) state
	if (!pendingBefore) {
		const state = get(editor);
		pendingBefore = cloneSnap(state.frontmatter, state.body);
	}

	// Reset the idle timer - commit once the user stops typing
	if (debounceTimer) clearTimeout(debounceTimer);
	debounceTimer = setTimeout(commitPending, 400);
}

function commitPending() {
	if (!pendingBefore) return;

	// Only push if state actually differs from what we captured
	const state = get(editor);
	const beforeKey = JSON.stringify(pendingBefore);
	const afterKey = JSON.stringify(cloneSnap(state.frontmatter, state.body));

	if (beforeKey !== afterKey) {
		undoStack.push(pendingBefore);
		if (undoStack.length > MAX_HISTORY) undoStack.shift();
		redoStack = [];
	}

	pendingBefore = null;
	debounceTimer = null;
	syncHistoryFlags();
}

export function undo() {
	// Flush any pending "before" snapshot so the current burst is undoable
	if (pendingBefore) {
		if (debounceTimer) {
			clearTimeout(debounceTimer);
			debounceTimer = null;
		}
		commitPending();
	}

	const snap = undoStack.pop();
	if (!snap) return;

	const state = get(editor);
	redoStack.push(cloneSnap(state.frontmatter, state.body));

	editor.update((s) => ({
		...s,
		frontmatter: JSON.parse(JSON.stringify(snap.frontmatter)),
		body: snap.body
	}));

	syncHistoryFlags();
}

export function redo() {
	const snap = redoStack.pop();
	if (!snap) return;

	const state = get(editor);
	undoStack.push(cloneSnap(state.frontmatter, state.body));

	editor.update((s) => ({
		...s,
		frontmatter: JSON.parse(JSON.stringify(snap.frontmatter)),
		body: snap.body
	}));

	syncHistoryFlags();
}

export function parseFrontmatter(raw: string): { frontmatter: EditorFrontmatter; body: string } {
	const fm: EditorFrontmatter = { ...defaultFrontmatter, tags: [] };

	const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
	if (!match) {
		return { frontmatter: fm, body: raw };
	}

	const yamlBlock = match[1];
	const body = match[2];

	for (const line of yamlBlock.split('\n')) {
		const colonIdx = line.indexOf(':');
		if (colonIdx === -1) continue;

		const key = line.slice(0, colonIdx).trim();
		let value = line.slice(colonIdx + 1).trim();

		// Remove surrounding quotes
		if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
			value = value.slice(1, -1);
		}

		switch (key) {
			case 'title':
				fm.title = value;
				break;
			case 'description':
				fm.description = value;
				break;
			case 'order':
				fm.order = value ? parseInt(value, 10) : null;
				if (fm.order !== null && isNaN(fm.order)) fm.order = null;
				break;
			case 'tags': {
				// tags: [a, b, c] or tags: a, b, c
				const inner = value.replace(/^\[|\]$/g, '');
				fm.tags = inner
					.split(',')
					.map((t) => t.trim())
					.filter(Boolean);
				break;
			}
			case 'icon':
				fm.icon = value;
				break;
			case 'badge':
				fm.badge = value;
				break;
			case 'nav_title':
				fm.nav_title = value;
				break;
			case 'updated':
				fm.updated = value;
				break;
		}
	}

	return { frontmatter: fm, body };
}

export function serializeSvx(fm: EditorFrontmatter, body: string): string {
	const lines: string[] = [];

	if (fm.title) lines.push(`title: ${fm.title}`);
	if (fm.nav_title) lines.push(`nav_title: ${fm.nav_title}`);
	if (fm.description) lines.push(`description: ${fm.description}`);
	if (fm.order !== null && fm.order !== undefined) lines.push(`order: ${fm.order}`);
	if (fm.tags.length > 0) lines.push(`tags: [${fm.tags.join(', ')}]`);
	if (fm.icon) lines.push(`icon: ${fm.icon}`);
	if (fm.badge) lines.push(`badge: ${fm.badge}`);
	if (fm.updated) lines.push(`updated: ${fm.updated}`);

	if (lines.length === 0) {
		return body;
	}

	return `---\n${lines.join('\n')}\n---\n${body}`;
}

export const isDirty = derived(editor, ($editor) => {
	if ($editor.mode === 'create') return true;
	const current = serializeSvx($editor.frontmatter, $editor.body);
	return current !== $editor.originalContent;
});

export async function openEditor(routePath: string) {
	const section = routePath.startsWith('/faq') ? 'faq' : 'docs';

	editor.update((s) => ({ ...s, error: null, saving: false }));

	try {
		const res = await fetch(`/__dev/editor/file?path=${encodeURIComponent(routePath)}`);
		if (!res.ok) {
			const data = await res.json();
			throw new Error(data.error || 'Failed to load file');
		}

		const { content } = await res.json();
		const { frontmatter, body } = parseFrontmatter(content);

		editor.set({
			isOpen: true,
			mode: 'edit',
			routePath,
			section: section as 'docs' | 'faq',
			originalContent: content,
			frontmatter,
			body,
			saving: false,
			error: null,
			lastSaved: null
		});

		resetHistory();
	} catch (err) {
		editor.update((s) => ({
			...s,
			isOpen: true,
			error: err instanceof Error ? err.message : String(err)
		}));
	}
}

export function openCreateEditor(section: 'docs' | 'faq') {
	const fm = { ...defaultFrontmatter, tags: [] };
	const body = '\n# New Page\n\nContent goes here.\n';

	editor.set({
		isOpen: true,
		mode: 'create',
		routePath: '',
		section,
		originalContent: '',
		frontmatter: fm,
		body,
		saving: false,
		error: null,
		lastSaved: null
	});

	resetHistory();
}

export async function saveFile(routePath?: string): Promise<boolean> {
	const state = get(editor);

	const targetPath = routePath || state.routePath;
	if (!targetPath) {
		editor.update((s) => ({ ...s, error: 'No route path specified' }));
		return false;
	}

	const content = serializeSvx(state.frontmatter, state.body);

	editor.update((s) => ({ ...s, saving: true, error: null }));

	try {
		const method = state.mode === 'create' ? 'POST' : 'PUT';
		const res = await fetch('/__dev/editor/file', {
			method,
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ routePath: targetPath, content })
		});

		if (!res.ok) {
			const data = await res.json();
			throw new Error(data.error || 'Failed to save file');
		}

		editor.update((s) => ({
			...s,
			saving: false,
			originalContent: content,
			routePath: targetPath,
			mode: 'edit',
			lastSaved: new Date(),
			error: null
		}));

		return true;
	} catch (err) {
		editor.update((s) => ({
			...s,
			saving: false,
			error: err instanceof Error ? err.message : String(err)
		}));
		return false;
	}
}

export async function deleteFile(): Promise<boolean> {
	const state = get(editor);

	if (!state.routePath) return false;

	editor.update((s) => ({ ...s, saving: true, error: null }));

	try {
		const res = await fetch(`/__dev/editor/file?path=${encodeURIComponent(state.routePath)}`, {
			method: 'DELETE'
		});

		if (!res.ok) {
			const data = await res.json();
			throw new Error(data.error || 'Failed to delete file');
		}

		editor.update((s) => ({ ...s, saving: false }));
		closeEditor();
		return true;
	} catch (err) {
		editor.update((s) => ({
			...s,
			saving: false,
			error: err instanceof Error ? err.message : String(err)
		}));
		return false;
	}
}

export function closeEditor() {
	editor.update((s) => ({
		...s,
		isOpen: false,
		error: null
	}));
}

export function updateFrontmatter(field: keyof EditorFrontmatter, value: unknown) {
	captureBeforeChange();
	editor.update((s) => ({
		...s,
		frontmatter: { ...s.frontmatter, [field]: value }
	}));
}

export function updateBody(body: string) {
	captureBeforeChange();
	editor.update((s) => ({ ...s, body }));
}
