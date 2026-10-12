import {Children, ReactNode} from "react";
import {View} from "react-native";

/** Equal columns inside the parent, including an incomplete last row. */
export const FlexGrid = ({
	children,
	columns = 4,
}: {
	children: ReactNode;
	columns?: number;
}) => {
	const items = Children.toArray(children);
	return (
		<View>
			{Array.from({length: Math.ceil(items.length / columns)}, (_, row) => (
				<View key={row} style={{flexDirection: "row"}}>
					{Array.from({length: columns}, (_slot, column) => (
						<View key={column} style={{flex: 1, minWidth: 0, padding: 3}}>
							{items[row * columns + column]}
						</View>
					))}
				</View>
			))}
		</View>
	);
};
