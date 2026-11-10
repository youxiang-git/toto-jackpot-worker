import { bindings, defineConfig } from "cf/config";
import * as entrypoint from "./src/index.ts" with { type: "cf-worker" };

export default defineConfig({
	worker: {
		name: "toto-jackpot-worker",
		compatibilityDate: "2026-11-04",
		entrypoint,
		env: {
			WORLD: bindings.text("World"),
		},
	},
});
