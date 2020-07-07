export class InputTag {
	private readonly name: string;
	public value: string;

	constructor(input: CheerioElement | string, value?: string) {
		if (typeof input === "string") {
			this.name = input;
			this.value = value || "";
		} else {
			this.name = input.attribs.name;
			this.value = input.attribs.value;
		}
	}

	toPair = (): [string, string] => [this.name, this.value];

	outOfRange = () => {
		const val = parseInt(this.value, 10);
		return val < 1 || val > 7;
	};
}

export interface InputGroup {
	question: string;
	suggestion: InputTag;
	score: InputTag;
	others: InputTag[];
}

export abstract class Suggestional {
	abstract suggestionText: string;

	abstract updateSuggestion(): void;

	/**
	 * Warning: This method is not supposed to be called alone, as updateSuggestion() should always
	 * be called in advance.
	 */
	abstract translate(): [string, string][];

	toPairs = (): [string, string][] => {
		this.updateSuggestion();
		return this.translate();
	};
}

export class Overall extends Suggestional {
	constructor(
		private suggestion: InputTag,
		public score: InputTag,
		public suggestionText: string = "",
	) {
		super();
		this.suggestionText = suggestion.value;
	}

	updateSuggestion() {
		this.suggestion.value = this.suggestionText;
	}

	translate(): [string, string][] {
		return [this.suggestion.toPair(), this.score.toPair()];
	}
}

class Person extends Suggestional {
	constructor(
		public name: string,
		public inputGroups: InputGroup[],
		public suggestionText: string = "",
	) {
		super();
		this.suggestionText = inputGroups[0].suggestion.value;
	}

	autoScore(score: number = 7) {
		this.inputGroups.forEach(
			(inputGroup) => (inputGroup.score.value = score.toString()),
		);
	}

	outOfRange = () =>
		this.inputGroups.some((inputGroup) => inputGroup.score.outOfRange());

	updateSuggestion() {
		this.inputGroups.forEach((inputGroup) => {
			inputGroup.suggestion.value = this.suggestionText;
		});
	}

	translate(): [string, string][] {
		return this.inputGroups.flatMap((item) =>
			item.others
				.concat(item.suggestion)
				.concat(item.score)
				.map((inputTag) => inputTag.toPair()),
		);
	}
}

export class Form {
	constructor(
		public basics: InputTag[],
		public overall: Overall,
		public teachers: Person[],
		public assistants: Person[],
	) {}

	serialize = () => {
		const obj = Object.create(null);
		this.basics
			.map((inputTag) => inputTag.toPair())
			.forEach(([key, value]) => (obj[key] = value));
		this.overall.toPairs().forEach(([key, value]) => (obj[key] = value));
		this.teachers
			.flatMap((person) => person.toPairs())
			.forEach(([key, value]) => (obj[key] = value));
		this.assistants
			.flatMap((person) => person.toPairs())
			.forEach(([key, value]) => (obj[key] = value));
		return obj;
	};
}

const assert = (exp: boolean) => {
	if (!exp) {
		throw 0;
	}
};

export const toPersons = (tables: Cheerio) => {
	const persons: Person[] = [];
	let table = tables.children("table").first();
	while (table.children().length > 0) {
		let tr = table.children("tbody").children().first();
		const name = tr.children().first().text();
		let children;
		const inputGroups: InputGroup[] = [];

		while ((children = tr.children()).length > 0) {
			const question =
				children.length === 4
					? children.first().next().text().trim()
					: children.first().text().trim();
			let inputs = children.find("input");

			const suggestions = inputs.filter("[class]");
			assert(suggestions.length === 1);
			const suggestion = new InputTag(
				suggestions[0].attribs.name,
				suggestions[0].attribs.value,
			);
			inputs = inputs.filter(":not([class])");

			const scores = inputs.filter("ul > input");
			assert(scores.length === 1);
			const score = new InputTag(
				scores[0].attribs.name,
				scores[0].attribs.value,
			);
			inputs = inputs.filter(":not([avgfs])");

			const others = inputs.map((_, ele) => new InputTag(ele)).get();
			const inputGroup: InputGroup = {
				question,
				suggestion,
				score,
				others,
			};
			inputGroups.push(inputGroup);

			tr = tr.next();
		}

		persons.push(new Person(name, inputGroups));
		table = table.next();
	}
	return persons;
};
