export const getCheerioText = (element: CheerioElement, index?: number) =>
	index === undefined
		? element.firstChild?.data?.trim() ?? ""
		: element.children[index].firstChild?.data?.trim() ?? "";
