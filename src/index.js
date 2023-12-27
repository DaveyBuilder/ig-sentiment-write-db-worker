import { processRequest } from './logic.js';

export default {

	async fetch(request, env, ctx) {
		// const waitFor = await processRequest(request, env, ctx);
		// Return a simple message when the worker URL is visited
		return new Response("Cloudflare worker is running.", {
			headers: { "content-type": "text/plain" },
		});
	},

	async scheduled(event, env, ctx) {
		// Call processRequest on the cron schedule
		return processRequest(event, env, ctx);
	},

};