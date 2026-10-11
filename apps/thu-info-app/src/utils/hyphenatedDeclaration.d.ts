// `hyphenated` ships no type definitions. This is a script-level ambient
// declaration (no top-level import/export) so TypeScript resolves the module
// rather than treating it as augmentation of a module that does not exist.
declare module "hyphenated" {
	export interface HyphenationLanguage {
		id: string;
		leftmin: number;
		rightmin: number;
		patterns: {[pattern: string]: number[]};
		exceptions?: string[];
	}

	export function hyphenated(
		text: string,
		options?: {language?: HyphenationLanguage},
	): string;
}
