/**
 * The minimal component of a form to be posted to the school server.
 *
 * Nobody knows what `name` stands for, but it is sure that `value`
 * stands for the score of a question in some occasions.
 */
import {getStr} from "../../utils/i18n";

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

/**
 * Corresponds to the questions on the teaching-evaluation form.
 *
 * **DO NOT** ask why it contains property `suggestion`. Foolish design
 * of the original website.
 */
export interface InputGroup {
	question: string;
	suggestion: InputTag;
	score: InputTag;
	others: InputTag[];
}

export abstract class Suggestional {
	abstract get suggestion(): string;

	abstract set suggestion(text: string);

	abstract toPairs(): [string, string][];
}

export class Overall extends Suggestional {
	constructor(private suggestionTag: InputTag, public score: InputTag) {
		super();
	}

	get suggestion(): string {
		return this.suggestionTag.value;
	}

	set suggestion(text: string) {
		this.suggestionTag.value = text;
	}

	toPairs(): [string, string][] {
		return [this.suggestionTag.toPair(), this.score.toPair()];
	}
}

class Person extends Suggestional {
	constructor(public name: string, public inputGroups: InputGroup[]) {
		super();
	}

	autoScore(score: number = 7) {
		this.inputGroups.forEach(
			(inputGroup) => (inputGroup.score.value = score.toString()),
		);
	}

	outOfRange = () =>
		this.inputGroups.some((inputGroup) => inputGroup.score.outOfRange());

	get suggestion(): string {
		return this.inputGroups[0].suggestion.value;
	}

	set suggestion(text: string) {
		this.inputGroups.forEach((inputGroup) => {
			inputGroup.suggestion.value = text;
		});
	}

	toPairs(): [string, string][] {
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
		private basics: InputTag[],
		public overall: Overall,
		public teachers: Person[],
		public assistants: Person[],
	) {}

	/**
	 * Check whether this form is valid to post.
	 *
	 * Returns a reason as a `string` if invalid, or `undefined` if else.
	 */
	invalid = () => {
		try {
			if (this.overall.score.outOfRange()) {
				return getStr("overallOutOfRange");
			} else if (this.teachers.some((person) => person.outOfRange())) {
				return getStr("teachersOutOfRange");
			} else if (
				this.assistants.length > 0 &&
				this.assistants.every((person) => person.outOfRange())
			) {
				return getStr("assistantsOutOfRange");
			} else {
				return undefined;
			}
		} catch (e) {
			console.error(e);
			return getStr("exceptionOccurred");
		}
	};

	/**
	 * The form has to be serialized in order to be posted.
	 */
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

/**
 * Read persons data from their corresponding html tables.
 */
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
