import { bindings, defineConfig, triggers } from "cf/config";
import * as entrypoint from "./src/index.ts" with { type: "cf-worker" };

export default defineConfig({
	worker: {
		name: "toto-jackpot-worker",
		compatibilityDate: "2026-11-04",
		entrypoint,
		triggers: [triggers.scheduled({ schedule: "0 2 * * 2,5" })],
		env: {
			TELEGRAM_BOT_TOKEN: bindings.secret(),
			TELEGRAM_CHAT_ID: bindings.secret(),
			TELEGRAM_SECRET_TOKEN: bindings.secret(),
			TOTO_URL: bindings.text(
				"https://www.singaporepools.com.sg/DataFileArchive/Lottery/Output/toto_next_draw_estimate_en.html",
			),
		},
	},
});
