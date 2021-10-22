import React from "react";
import {Text, useColorScheme, View, Dimensions} from "react-native";
import ModalDropdown from "react-native-modal-dropdown";
import themes from "../../assets/themes/themes";

interface PickerModalWrapperProps {
	defaultValue: [string, string];
	items: [string[], string[]];
	text: [string, string];
	onLeftSelect: (value: string) => void;
	onRightSelect: (value: string) => void;
	isModalGroup: boolean; // Set it false to disable interactions between modals
	rightPickerRef: any;
	containerPadding: number;
}

const getModal = (
	defaultValue: string,
	items: string[],
	isLeft: boolean, // Whether the picker is on the left of the screen
	text: string,
	onSelect: (value: string) => void,
	containerPadding: number,
	ref: any,
	colors: any,
) => {
	return (
		<View style={{flex: 1, margin: 4}}>
			<Text style={{marginBottom: 4, color: "gray"}}>{text}</Text>
			<ModalDropdown
				ref={ref}
				options={items}
				defaultValue={defaultValue}
				style={{
					padding: 8,
					borderWidth: 1,
					borderRadius: 4,
					borderColor: "gray",
				}}
				textStyle={{
					fontSize: 14,
					color: colors.text,
				}}
				dropdownStyle={{
					paddingHorizontal: 20,
				}}
				dropdownTextStyle={{
					color: "black",
					fontSize: 14,
				}}
				showsVerticalScrollIndicator={false}
				adjustFrame={(val) => {
					return isLeft
						? val
						: {
								...val,
								left:
									(val.right as number) +
									Dimensions.get("window").width / 2 -
									containerPadding,
								right: undefined,
								// eslint-disable-next-line no-mixed-spaces-and-tabs
						  };
				}}
				onSelect={(_, value) => onSelect(value)}
			/>
		</View>
	);
};

export const PickerModalWrapper = (props: PickerModalWrapperProps) => {
	const themeName = useColorScheme();
	const {colors} = themes(themeName);

	return (
		<View
			style={{
				flexDirection: "row",
				justifyContent: "space-around",
				alignItems: "center",
				marginBottom: 8,
			}}>
			{getModal(
				props.defaultValue[0],
				props.items[0],
				true,
				props.text[0],
				props.isModalGroup
					? (value: string) => {
							props.onLeftSelect(value);
							props.rightPickerRef.current.select(-1);
							// eslint-disable-next-line no-mixed-spaces-and-tabs
					  }
					: props.onLeftSelect,
				props.containerPadding,
				undefined,
				colors,
			)}
			{getModal(
				props.defaultValue[1],
				props.items[1],
				false,
				props.text[1],
				props.onRightSelect,
				props.containerPadding,
				props.rightPickerRef,
				colors,
			)}
		</View>
	);
};
