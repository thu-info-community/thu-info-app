import {ScrollView, Text, TouchableOpacity, View} from "react-native";
import React from "react";
import {HomeNav} from "./homeStack";

const Classroom = ({name, navigation}: {name: string; navigation: HomeNav}) => (
	<TouchableOpacity
		style={{
			backgroundColor: "white",
			padding: 7,
			marginHorizontal: 5,
			marginTop: 10,
			width: 120,
			height: 40,
			justifyContent: "center",
			borderRadius: 3,
			shadowColor: "grey",
			shadowOffset: {
				width: 2,
				height: 2,
			},
			shadowOpacity: 0.8,
			shadowRadius: 2,
			borderColor: "lightgray",
			borderWidth: 2,
		}}
		onPress={() => navigation.navigate("ClassroomDetail", {name})}>
		<Text style={{textAlign: "center"}}>{name}</Text>
	</TouchableOpacity>
);

export const ClassroomListScreen = ({navigation}: {navigation: HomeNav}) => (
	<ScrollView>
		<View
			style={{
				flexWrap: "wrap",
				flexDirection: "row",
				justifyContent: "center",
			}}>
			{[
				"一教",
				"二教",
				"三教",
				"四教",
				"五教",
				"六教",
				"主楼后厅",
				"东阶",
				"中央主楼",
				"主楼东配楼",
				"主楼开放实验室",
				"清华学堂",
				"罗姆楼",
				"理科楼",
				"文北楼",
				"文南楼",
				"蒙楼",
				"蒙民伟科技大楼",
				"逸夫图书馆",
				"法图",
				"建馆",
				"工物馆",
				"焊接馆",
				"精仪系系馆",
				"新水",
				"旧水",
				"旧经管报告厅",
				"明理楼",
				"经管伟伦楼",
				"技科楼",
				"美院",
				"生命科学馆",
				"微电子所",
				"李兆基科技大楼",
				"宏盟楼",
				"何添楼",
				"环境学院",
				"C楼",
			].map((value, index) => (
				<Classroom name={value} key={index} navigation={navigation} />
			))}
		</View>
	</ScrollView>
);
