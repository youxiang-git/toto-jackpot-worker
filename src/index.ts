import { env } from "cloudflare:workers";

export default {
	async scheduled(
		controller: ScheduledController,
		env: Env,
		ctx: ExecutionContext,
	) {
		let data = await getNextDraw(env);
		console.log(
			`Next Jackpot: ${data.formattedAmount}, Next Draw: ${data.drawDate}`,
		);
	},

	async fetch() {
		let data = await getNextDraw(env);
		return new Response(
			`Next Jackpot: ${data.formattedAmount}, Next Draw: ${data.drawDate}`,
		);
	},
};

async function getNextDraw(
	env: Env,
): Promise<{ formattedAmount: string; drawDate: string }> {
	const res = await fetch(env.TOTO_URL, {
		headers: {
			"User-Agent":
				"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
			Accept: "text/html",
		},
	});

	if (!res.ok) {
		throw new Error(`Singapore Pools returned HTTP ${res.status}`);
	}

	const html = await res.text();
	const jackpotMatch = html.match(/Next\s+Jackpot[\s\S]*?\$([\d,]+)/i);

	const drawDateMatch = html.match(
		/Next\s+Draw[\s\S]*?([A-Za-z]+,\s*\d+\s+[A-Za-z]+\s+\d{4}[^<]*)/i,
	);

	const amount = jackpotMatch
		? parseInt(jackpotMatch[1].replace(/,/g, ""), 10)
		: 1_000_000;
	const formattedAmount = "$" + amount.toLocaleString("en-SG");
	const drawDate = drawDateMatch
		? drawDateMatch[1].replace(/\s+/g, " ").trim()
		: "Upcoming Draw";

	return { formattedAmount, drawDate };
}
