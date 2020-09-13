declare const excelToJson: (config: {
	sourceFile?: string;
	source?: string;
	header?: {rows: number};
	columnToKey?: {[key: string]: string};
}) => {[key: string]: any[]};

export default excelToJson;
