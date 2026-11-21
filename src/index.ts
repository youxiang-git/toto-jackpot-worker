import { env } from "cloudflare:workers";

// Follows the API
interface NextDrawInfo {
	nextJackpotEstimateAmount: string;
	nextDrawNo: string;
	nextDrawDate: string;
	nextDrawType: string;
}

interface PoolsApiResponse {
	drawResults: DrawResults[];
}

interface DrawResults {
	drawNo: string;
	drawDate: string;
	prizeClaimDueDate: string;
	isDrawCancelled: string;
	jackpotPrize: string;
	winningNumbers: Array<string>;
	additionalNumber: string;
	nextJackpotEstimateAmount: string;
	nextDrawNo: string;
	nextDrawDate: string;
	nextDrawType: string;
	winningShares: Object;
	winningOutlets: Object;
}

interface TelegramUpdate {
	message?: {
		message_id: number;
		chat: { id: number };
		text?: string;
	};
	callback_query?: {
		id: string;
		data: string;
		message?: {
			message_id: number;
			chat: { id: number };
		};
	};
}

const MAIN_KEYBOARD = {
	keyboard: [[{ text: "🔍 Check Now" }]],
	resize_keyboard: true, // Shrinks the button height so it doesn't cover half your screen
	is_persistent: true, // Keeps the keyboard visible even after tapping
};

export default {
	async fetch(req: Request, env: Env): Promise<Response> {
		if (req.method !== "POST") {
			return new Response("Worker is active", { status: 200 });
		}

		if (req.method === "POST") {
			const secretHeader = req.headers.get(
				"X-Telegram-Bot-Api-Secret-Token",
			);

			if (secretHeader !== env.WEBHOOK_SECRET) {
				return new Response("Unauthorized", { status: 401 });
			}

			const update: any = await req.json();
			const text = update.message?.text;
			const chatId = update.message?.chat?.id;

			if (String(chatId) !== env.TELEGRAM_CHAT_ID) {
				return new Response("OK");
			}

			if (text === "🔍 Check Now") {
				await chooseMesssageToSend(env);
			}
		}
		return new Response("OK");
	},

	async scheduled(
		controller: ScheduledController,
		env: Env,
		ctx: ExecutionContext,
	): Promise<void> {
		await chooseMesssageToSend(env);
	},
};

async function chooseMesssageToSend(env: Env): Promise<void> {
	let data = await getNextDraw(env);

	const nextJackpot = Number(data.nextJackpotEstimateAmount);

	if (nextJackpot < 1_000_001) {
		await sendNormalAlert(env, data);
	} else {
		await sendSnowballAlert(env, data);
	}
}

async function sendSnowballAlert(env: Env, info: NextDrawInfo) {
	const formattedNextJackpot = Number(
		info.nextJackpotEstimateAmount,
	).toLocaleString("en-SG");

	const text =
		`🎰 <b>TOTO Snowball Alert!</b>\n\n` +
		`💰 Est. Jackpot: $${formattedNextJackpot}\n` +
		`📅 Next Draw: ${info.nextDrawDate}\n\n`;

	await sendMessage(env.TELEGRAM_BOT_TOKEN, env.TELEGRAM_CHAT_ID, text);
}

async function sendMessage(token: string, chatId: string, textMsg: string) {
	const res = await fetch(
		`https://api.telegram.org/bot${token}/sendMessage`,
		{
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				chat_id: chatId,
				parse_mode: "HTML",
				text: textMsg,
				reply_markup: MAIN_KEYBOARD,
			}),
		},
	);

	const data = await res.json();
	if (!res.ok) {
		console.error("Telegram API Error:", data);
	}
}

async function getNextDraw(env: Env): Promise<NextDrawInfo> {
	const res = await fetch(env.TOTO_URL, {
		headers: {
			"User-Agent":
				"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36",
			Accept: "application/json",
		},
	});

	if (!res.ok) {
		throw new Error(`Singapore Pools returned HTTP ${res.status}`);
	}

	const nextDrawAllInfoJson: PoolsApiResponse = await res.json();

	const {
		nextJackpotEstimateAmount,
		nextDrawNo,
		nextDrawDate,
		nextDrawType,
	} = nextDrawAllInfoJson.drawResults?.[0];

	return {
		nextJackpotEstimateAmount,
		nextDrawNo,
		nextDrawDate,
		nextDrawType,
	};
}

async function sendNormalAlert(env: Env, info: NextDrawInfo) {
	const formattedNextJackpot = Number(
		info.nextJackpotEstimateAmount,
	).toLocaleString("en-SG");

	const text =
		`💰 Est. Jackpot: $${formattedNextJackpot}\n` +
		`📅 Next Draw: ${info.nextDrawDate}\n\n`;

	await sendMessage(env.TELEGRAM_BOT_TOKEN, env.TELEGRAM_CHAT_ID, text);
	return;
}
