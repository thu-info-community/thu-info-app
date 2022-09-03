import React, {useState} from "react";
import {TouchableWithoutFeedback, View} from "react-native";
import IconFormStar from "../../assets/icons/IconFormStar";
import {InputTag} from "thu-info-lib/dist/models/home/assessment";

interface starRatingProps {
	starTotal?: number;
	starSize?: number;
	starSpacing?: number;
	starColor?: string;
	scoreRef: InputTag;
}

export const StarRating = (props: starRatingProps) => {
	let starTotal: number = props.starTotal || 7;
	let starSize: number = props.starSize || 26;
	let starSpacing: number = props.starSpacing || 3;

	const changeVal = (x: number) => {
		props.scoreRef.value = x.toString();
	};

	const [rating, setRating] = useState(parseInt(props.scoreRef.value, 10));

	let stars = [];
	for (let i = 1; i <= rating; ++i) {
		stars.push(
			<TouchableWithoutFeedback
				key={i}
				onPress={() => {
					setRating(i);
					changeVal(i);
				}}
				style={{marginHorizontal: starSpacing}}>
				<View style={{height: starSize, width: starSize}}>
					<IconFormStar full={true} />
				</View>
			</TouchableWithoutFeedback>,
		);
	}
	for (let j = rating + 1; j <= starTotal; ++j) {
		stars.push(
			<TouchableWithoutFeedback
				key={j}
				onPress={() => {
					setRating(j);
					changeVal(j);
				}}
				style={{marginHorizontal: starSpacing}}>
				<View style={{height: starSize, width: starSize}}>
					<IconFormStar full={false} />
				</View>
			</TouchableWithoutFeedback>,
		);
	}

	return (
		<View
			style={{
				flexDirection: "row",
				justifyContent: "flex-end",
				marginVertical: 2,
			}}>
			{stars}
		</View>
	);
};
