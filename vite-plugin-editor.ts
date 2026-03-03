import fs from 'node:fs';
import path from 'node:path';
import type { Plugin, ViteDevServer } from 'vite';

const PREFIX = '/__dev/editor';

function routeToFile(routePath: string, root: string): string {
	// /docs/api/play → src/routes/docs/api/play/+page.svx
	const clean = routePath.replace(/^\/+|\/+$/g, '');
	return path.join(root, 'src', 'routes', clean, '+page.svx');
}

function validatePath(filePath: string, root: string): boolean {
	const resolved = path.resolve(filePath);
	const routesDir = path.resolve(root, 'src', 'routes');
	return resolved.startsWith(routesDir + path.sep) || resolved === routesDir;
}

function validateSection(section: string): boolean {
	return section === 'docs' || section === 'faq';
}

function validateSlug(slug: string): boolean {
	return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug);
}

function readBody(req: import('http').IncomingMessage): Promise<string> {
	return new Promise((resolve, reject) => {
		let data = '';
		req.on('data', (chunk: Buffer) => (data += chunk.toString()));
		req.on('end', () => resolve(data));
		req.on('error', reject);
	});
}

function sendJson(res: import('http').ServerResponse, status: number, data: unknown) {
	res.writeHead(status, { 'Content-Type': 'application/json' });
	res.end(JSON.stringify(data));
}

const LOCALHOST_ADDRS = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1']);

function isLocalhost(req: import('http').IncomingMessage): boolean {
	return LOCALHOST_ADDRS.has(req.socket.remoteAddress ?? '');
}

interface DevEditorOptions {
	/** Allow mutating operations (write/create/delete) from any host. Default: false (localhost only). */
	insecure?: boolean;
}

export default function devEditor(options?: DevEditorOptions): Plugin {
	const insecure = options?.insecure ?? false;

	return {
		name: 'dev-editor',
		apply: 'serve',

		configureServer(server: ViteDevServer) {
			const root = server.config.root || process.cwd();

			server.middlewares.use(async (req, res, next) => {
				const url = new URL(req.url || '/', `http://${req.headers.host}`);

				if (!url.pathname.startsWith(PREFIX)) {
					return next();
				}

				const endpoint = url.pathname.slice(PREFIX.length);
				const isMutating = req.method === 'PUT' || req.method === 'POST' || req.method === 'DELETE';

				if (!insecure && isMutating && !isLocalhost(req)) {
					return sendJson(res, 403, {
						error: 'Mutating operations are restricted to localhost. Use { insecure: true } to allow remote access.'
					});
				}

				try {
					// GET /__dev/editor/file?path=/docs/api/play
					if (req.method === 'GET' && endpoint === '/file') {
						const routePath = url.searchParams.get('path');
						if (!routePath) {
							return sendJson(res, 400, { error: 'Missing "path" query parameter' });
						}

						const filePath = routeToFile(routePath, root);
						if (!validatePath(filePath, root)) {
							return sendJson(res, 403, { error: 'Path outside allowed directory' });
						}

						if (!fs.existsSync(filePath)) {
							return sendJson(res, 404, { error: 'File not found' });
						}

						const content = fs.readFileSync(filePath, 'utf-8');
						return sendJson(res, 200, { content, routePath });
					}

					// PUT /__dev/editor/file - update existing file
					if (req.method === 'PUT' && endpoint === '/file') {
						const body = JSON.parse(await readBody(req));
						const { routePath, content } = body;

						if (!routePath || typeof content !== 'string') {
							return sendJson(res, 400, { error: 'Missing routePath or content' });
						}

						const filePath = routeToFile(routePath, root);
						if (!validatePath(filePath, root)) {
							return sendJson(res, 403, { error: 'Path outside allowed directory' });
						}

						if (!fs.existsSync(filePath)) {
							return sendJson(res, 404, { error: 'File not found' });
						}

						fs.writeFileSync(filePath, content, 'utf-8');
						return sendJson(res, 200, { ok: true });
					}

					// POST /__dev/editor/file - create new file
					if (req.method === 'POST' && endpoint === '/file') {
						const body = JSON.parse(await readBody(req));
						const { routePath, content } = body;

						if (!routePath || typeof content !== 'string') {
							return sendJson(res, 400, { error: 'Missing routePath or content' });
						}

						// Validate route structure: must start with /docs/ or /faq/
						const parts = routePath.replace(/^\/+/, '').split('/');
						if (parts.length < 2 || !validateSection(parts[0])) {
							return sendJson(res, 400, { error: 'Route must start with /docs/ or /faq/' });
						}

						// Validate slug (last segment)
						const slug = parts[parts.length - 1];
						if (!validateSlug(slug)) {
							return sendJson(res, 400, {
								error: 'Invalid slug. Use lowercase letters, numbers, and hyphens only.'
							});
						}

						const filePath = routeToFile(routePath, root);
						if (!validatePath(filePath, root)) {
							return sendJson(res, 403, { error: 'Path outside allowed directory' });
						}

						if (fs.existsSync(filePath)) {
							return sendJson(res, 409, { error: 'File already exists' });
						}

						const dir = path.dirname(filePath);
						fs.mkdirSync(dir, { recursive: true });
						fs.writeFileSync(filePath, content, 'utf-8');
						return sendJson(res, 201, { ok: true, routePath });
					}

					// DELETE /__dev/editor/file?path=/docs/api/play
					if (req.method === 'DELETE' && endpoint === '/file') {
						const routePath = url.searchParams.get('path');
						if (!routePath) {
							return sendJson(res, 400, { error: 'Missing "path" query parameter' });
						}

						const filePath = routeToFile(routePath, root);
						if (!validatePath(filePath, root)) {
							return sendJson(res, 403, { error: 'Path outside allowed directory' });
						}

						if (!fs.existsSync(filePath)) {
							return sendJson(res, 404, { error: 'File not found' });
						}

						fs.unlinkSync(filePath);

						// Clean up empty directory
						const dir = path.dirname(filePath);
						const remaining = fs.readdirSync(dir);
						if (remaining.length === 0) {
							fs.rmdirSync(dir);
						}

						return sendJson(res, 200, { ok: true });
					}

					// GET /__dev/editor/directories?section=docs
					if (req.method === 'GET' && endpoint === '/directories') {
						const section = url.searchParams.get('section');
						if (!section || !validateSection(section)) {
							return sendJson(res, 400, { error: 'Invalid section. Use "docs" or "faq".' });
						}

						const sectionDir = path.join(root, 'src', 'routes', section);
						const dirs: string[] = [];

						// Add root section itself
						dirs.push(`/${section}`);

						function walk(dir: string) {
							if (!fs.existsSync(dir)) return;
							for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
								if (entry.isDirectory() && !entry.name.startsWith('+') && !entry.name.startsWith('.')) {
									const rel = path.relative(path.join(root, 'src', 'routes'), path.join(dir, entry.name));
									dirs.push('/' + rel.replace(/\\/g, '/'));
									walk(path.join(dir, entry.name));
								}
							}
						}

						walk(sectionDir);
						return sendJson(res, 200, { directories: dirs.sort() });
					}

					return sendJson(res, 404, { error: 'Unknown editor endpoint' });
				} catch (err) {
					console.error('[dev-editor]', err);
					return sendJson(res, 500, { error: String(err) });
				}
			});
		}
	};
}
