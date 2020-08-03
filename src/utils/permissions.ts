import {Permission, PermissionsAndroid} from "react-native";

export const hasAndroidPermission = async (permission: Permission) =>
	(await PermissionsAndroid.check(permission)) ||
	(await PermissionsAndroid.request(permission)) === "granted";
