export const passwordRules = [
	{ label: "8+ characters", hint: "use 8 or more characters", test: (v: string) => v.length >= 8 },
	{ label: "1 uppercase letter", hint: "add an uppercase letter", test: (v: string) => /[A-Z]/.test(v) },
	{ label: "1 number", hint: "add a number", test: (v: string) => /\d/.test(v) },
	{ label: "1 special (!@#$…)", hint: "add a special character", test: (v: string) => /[!@#$%^&*]/.test(v) },
];
