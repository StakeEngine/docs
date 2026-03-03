export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
export type ParamLocation = 'query' | 'path' | 'body';

export interface ApiParam {
	name: string;
	type: string;
	location: ParamLocation;
	required: boolean;
	description: string;
	defaultValue?: string;
	example?: string;
}

export interface ApiResponse {
	status: number;
	statusText: string;
	description: string;
	exampleBody?: string;
}

export interface ApiEndpoint {
	method: HttpMethod;
	path: string;
	baseUrl: string;
	title: string;
	description: string;
	scopes?: string[];
	params: ApiParam[];
	responses: ApiResponse[];
}

export const METHOD_COLORS: Record<HttpMethod, { bg: string; text: string; ring: string }> = {
	GET: { bg: 'bg-blue-400/10', text: 'text-blue-400', ring: 'ring-blue-400/30' },
	POST: { bg: 'bg-emerald-400/10', text: 'text-emerald-400', ring: 'ring-emerald-400/30' },
	PUT: { bg: 'bg-amber-400/10', text: 'text-amber-400', ring: 'ring-amber-400/30' },
	PATCH: { bg: 'bg-orange-400/10', text: 'text-orange-400', ring: 'ring-orange-400/30' },
	DELETE: { bg: 'bg-red-400/10', text: 'text-red-400', ring: 'ring-red-400/30' }
};

export function getStatusColor(status: number): { bg: string; text: string; ring: string } {
	if (status >= 200 && status < 300) {
		return { bg: 'bg-emerald-400/10', text: 'text-emerald-400', ring: 'ring-emerald-400/30' };
	}
	if (status >= 400 && status < 500) {
		return { bg: 'bg-amber-400/10', text: 'text-amber-400', ring: 'ring-amber-400/30' };
	}
	if (status >= 500) {
		return { bg: 'bg-red-400/10', text: 'text-red-400', ring: 'ring-red-400/30' };
	}
	return { bg: 'bg-zinc-400/10', text: 'text-zinc-400', ring: 'ring-zinc-400/30' };
}
