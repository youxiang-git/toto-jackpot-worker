import { bindings, defineConfig, triggers } from "cf/config";
import * as entrypoint from "./src/index.ts" with { type: "cf-worker" };

export default defineConfig({
	worker: {
		name: "toto-jackpot-worker",
		compatibilityDate: "2026-11-04",
		entrypoint,
		env: {
			TELEGRAM_BOT_TOKEN: bindings.secret(),
			TELEGRAM_CHAT_ID: bindings.secret(),
			WEBHOOK_SECRET: bindings.secret(),
			TOTO_URL: bindings.text(
				"https://api.singaporepools.com/toto/results/v1/details",
			),
		},
		triggers: [triggers.scheduled({ schedule: "0 2 * * 2,5" })],
	},
});
