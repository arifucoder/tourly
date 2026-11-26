import { defineConfig } from "tsup";

export default defineConfig({
	entry: {
		server: "src/server.ts",
		"seed-super-admin": "src/scripts/seedSuperAdmin.ts",
		"seed-demo": "src/scripts/seed/index.ts",
		"rollover-tours": "src/scripts/rolloverTours.ts",
	},
	format: ["esm"],
	target: "esnext",
	outDir: "dist",
	clean: true,
	bundle: true,
	splitting: false,
	sourcemap: true,
	banner: {
		js: `
      import { createRequire } from 'module';
      const require = createRequire(import.meta.url);
    `,
	},
	// build শেষ হলে templates copy করো
	onSuccess: "mkdir -p dist/templates && cp -r src/app/utils/templates/. dist/templates/",
});
