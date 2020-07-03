export interface Course {
	name: string;
	credit: number;
	grade: string;
	point: number;
	semester: string;
}

export const semesterWeight = (semester: string): number => {
	const year = Number(semester.slice(0, 4));
	let term: number;
	switch (semester[5]) {
		case "春":
			term = 0;
			break;
		case "夏":
			term = 1;
			break;
		case "秋":
			term = 2;
			break;
		default:
			term = 3;
	}
	return year * 10 + term;
};
