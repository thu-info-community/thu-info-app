import {Text, TouchableOpacity, View} from "react-native";
import {helper} from "../../redux/store";
import dayjs from "dayjs";
import {LibRoomBookTimeIndicator} from "../../components/home/libRoomBookTimeIndicator";
import {roundedRefreshListScreen} from "../../components/settings/simpleRefreshListScreen";

export const LibRoomBookScreen = roundedRefreshListScreen(
	({
		route: {
			params: {dateOffset, kindId},
		},
	}) =>
		helper.getLibraryRoomBookingResourceList(
			dayjs().add(dateOffset, "day").format("YYYYMMDD"),
			kindId,
		),
	(
		item,
		_,
		{
			navigation,
			route: {
				params: {dateOffset},
			},
		},
		theme,
		index,
		total,
	) => (
		<TouchableOpacity
			onPress={() =>
				item.openStart !== null &&
				item.openEnd !== null &&
				navigation.navigate("LibRoomPerformBook", {
					res: item,
					date: dayjs().add(dateOffset, "day").format("YYYY-MM-DD"),
				})
			}
			disabled={item.kindName.indexOf("暂未开放") !== -1}>
			<View
				style={{
					marginTop: index === 0 ? 0 : 12,
					marginBottom: index === total - 1 ? 0 : 12,
					justifyContent: "center",
				}}>
				<Text
					style={{
						color:
							item.kindName.indexOf("暂未开放") === -1
								? theme.colors.text
								: "gray",
						fontSize: 18,
						marginBottom: 4,
						textDecorationLine:
							item.kindName.indexOf("暂未开放") === -1
								? "none"
								: "line-through",
					}}>
					{item.roomName}
					{item.maxUser > 1 ? ` (${item.minUser}~${item.maxUser})` : ""}
				</Text>
				<Text style={{color: "grey", marginBottom: 4}}>{item.kindName}</Text>
				<LibRoomBookTimeIndicator res={item} />
			</View>
		</TouchableOpacity>
	),
	({devId}) => String(devId),
);
