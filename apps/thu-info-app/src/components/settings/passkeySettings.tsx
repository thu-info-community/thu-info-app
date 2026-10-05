import {useEffect, useRef, useState} from "react";
import {ActivityIndicator, Switch, Text, TouchableOpacity, View} from "react-native";
import {useSelector} from "react-redux";
import {State} from "../../redux/store";
import {BottomPopupTriggerView, RoundedView} from "../views";
import {getPasskeyRootHint, getPasskeyVerificationAvailability, passkeyAvailable} from "../../utils/passkeyNative";
import {enablePasskey, disablePasskey} from "../../utils/passkey";
import {getStr} from "../../utils/i18n";
import type {RootNav} from "../Root";
import {styles} from "../../ui/settings/settings";
import {useColorScheme} from "react-native";
import {Snackbar} from "react-native-snackbar";
import IconRight from "../../assets/icons/IconRight";
import themes from "../../assets/themes/themes";
import {currState, persistor, store} from "../../redux/store";
import {setSilentPasskeyLogin} from "../../redux/slices/auth";
import {PasskeyError} from "@thu-info/lib/src/utils/error";

type PasskeyDialog = "enable" | "remove" | "setupError" | "removeError" |
    "silentEnable" | "silentDisable" | "verificationUnavailable";

export const PasskeySettings = ({navigation}: {navigation: RootNav}) => {
    const auth = useSelector((state: State) => state.auth);
    const [processing, setProcessing] = useState(false);
    const [checkingRoot, setCheckingRoot] = useState(false);
    const [rootHint, setRootHint] = useState(false);
    const [dialog, setDialog] = useState<PasskeyDialog | null>(null);
    const rootHintRequest = useRef(0);
    const checkingRootRef = useRef(false);
    useEffect(() => {
        checkingRootRef.current = false;
        setCheckingRoot(false);
        setRootHint(false);
        setDialog(null);
        return () => { rootHintRequest.current += 1; };
    }, [auth.userId]);
    const themeName = useColorScheme();
    const style = styles(themeName);
    const {colors} = themes(themeName);
    if (!passkeyAvailable || auth.userId === "8888") return null;
    const localPasskeys = Object.values(auth.passkeys ?? {});
    const credential = auth.userId ? auth.passkeys?.[auth.userId] : localPasskeys.length === 1 ? localPasskeys[0] : undefined;
    const configured = !!credential || (!auth.userId && localPasskeys.length > 0);
    const silent = credential ? (credential.authenticationMode ?? "silent") === "silent" :
        auth.silentPasskeyLogin?.[auth.userId] === true;
    const protection = credential?.protectionLevel;
    const protectionText = protection === "software" ? getStr("passkeySystemProtection") :
        protection && ["strongbox", "tee", "hardware"].includes(protection) ? getStr("passkeyDeviceProtection") : getStr("passkeyUnknown");
    const busy = processing || checkingRoot;

    const openSetupDialog = async () => {
        if (processing || checkingRootRef.current) return;
        const request = ++rootHintRequest.current;
        checkingRootRef.current = true;
        setCheckingRoot(true);
        setRootHint(false);
        const [hint, verification] = await Promise.all([
            getPasskeyRootHint().catch(() => false), getPasskeyVerificationAvailability(),
        ]);
        if (request !== rootHintRequest.current) return;
        checkingRootRef.current = false;
        setCheckingRoot(false);
        setRootHint(hint);
        setDialog(!silent && ["not-configured", "unsupported"].includes(verification) ? "verificationUnavailable" : "enable");
    };

    const changeSilent = async (enabled: boolean) => {
        if (!auth.userId) { navigation.navigate("Login"); return; }
        if (busy || checkingRootRef.current) return;
        if (enabled) { setDialog("silentEnable"); return; }
        const request = ++rootHintRequest.current;
        checkingRootRef.current = true;
        setCheckingRoot(true);
        const verification = await getPasskeyVerificationAvailability();
        if (request !== rootHintRequest.current) return;
        checkingRootRef.current = false;
        setCheckingRoot(false);
        if (["not-configured", "unsupported"].includes(verification)) setDialog("verificationUnavailable");
        else if (credential) setDialog("silentDisable");
        else {
            store.dispatch(setSilentPasskeyLogin({userId: auth.userId, enabled: false}));
            await persistor.flush();
        }
    };

    const perform = async (disable: boolean, changedSilent?: boolean) => {
        if (currState().auth.userId !== auth.userId) return;
        setProcessing(true);
        try {
            if (changedSilent !== undefined && !credential) {
                store.dispatch(setSilentPasskeyLogin({userId: auth.userId, enabled: changedSilent}));
                await persistor.flush();
                return;
            }
            if (disable) {
                await disablePasskey();
                navigation.navigate("Login");
            } else {
                await enablePasskey(changedSilent === undefined ? undefined : changedSilent ? "silent" : "required");
            }
            Snackbar.show({text: getStr(disable ? "passkeyRemoved" : "passkeyEnabled"), duration: Snackbar.LENGTH_LONG});
        } catch (error) {
            if (error instanceof PasskeyError && ["canceled", "locked", "interaction-required"].includes(error.code)) return;
            setDialog(error instanceof PasskeyError && error.code === "verification-unavailable" ? "verificationUnavailable" :
                disable ? "removeError" : "setupError");
        } finally { setProcessing(false); }
    };

    return (
        <>
        <RoundedView style={style.rounded}>
            <TouchableOpacity accessibilityRole="button" testID="passkeySettings" style={style.touchable} disabled={busy}
                onPress={() => {
                    if (!auth.userId) { navigation.navigate("Login"); return; }
                    if (credential) setDialog("remove");
                    else openSetupDialog();
                }}>
                <Text style={style.text}>Passkey</Text>
                <View style={{flexDirection: "row", alignItems: "center"}}>
                    {busy ? <ActivityIndicator /> : <Text style={style.version}>{getStr(configured ? "configured" : "notConfigured")}</Text>}
                    <IconRight height={20} width={20} />
                </View>
            </TouchableOpacity>
            <View style={style.separator} />
            <View style={style.touchable}>
                <Text style={[style.text, {flex: 1}]}>{getStr("passkeySilentLogin")}</Text>
                <Switch accessibilityLabel={getStr("passkeySilentLogin")} testID="passkeySilentLogin"
                    disabled={busy} value={silent} onValueChange={changeSilent} />
            </View>
            {credential && <>
                {credential.name && <>
                    <View style={style.separator} />
                    <View style={style.touchable}>
                        <Text style={style.text}>{getStr("idDeviceName")}</Text>
                        <Text style={[style.version, {flex: 1, marginLeft: 16, textAlign: "right"}]} numberOfLines={2}>{credential.name}</Text>
                    </View>
                </>}
                <View style={style.separator} />
                <View style={style.touchable}>
                    <Text style={style.text}>{getStr("passkeyProtection")}</Text>
                    <Text style={style.version}>{protectionText}</Text>
                </View>
            </>}
        </RoundedView>
        <BottomPopupTriggerView
            style={{display: "none"}} disabled popupTitle="Passkey"
            popupVisible={dialog !== null} popupCanFulfill={!busy} popupCancelable
            popupFulfillText={getStr(dialog === "remove" ? "passkeyRemove" :
                dialog === "silentDisable" ? "confirm" :
                    dialog === "enable" || dialog === "silentEnable" ? "passkeyEnable" : "done")}
            popupContent={<View style={{paddingHorizontal: 20}}>
                <Text style={{color: colors.text, fontSize: 17, lineHeight: 26}}>
                    {getStr(dialog === "remove" ? "passkeyRemovePrompt" : dialog === "setupError" ? "passkeySetupFailed" :
                        dialog === "removeError" ? "passkeyRemoveFailed" : dialog === "silentEnable" ? "passkeySilentWarning" :
                            dialog === "silentDisable" ? "passkeyVerifiedPrompt" : dialog === "verificationUnavailable" ?
                                "passkeyVerificationUnavailable" : "passkeyEnablePrompt")}
                </Text>
                {credential && (dialog === "silentEnable" || dialog === "silentDisable") &&
                    <Text style={{color: colors.text, fontSize: 17, lineHeight: 26, marginTop: 16}}>{getStr("passkeyModeChangePrompt")}</Text>}
                {rootHint && dialog === "enable" &&
                    <Text style={{color: colors.text, fontSize: 17, lineHeight: 26, marginTop: 16}}>
                        {getStr("passkeyRootHint")}
                    </Text>}
            </View>}
            popupOnCancelled={() => setDialog(null)}
            popupOnFulfilled={() => {
                setDialog(null);
                if (dialog === "enable" || dialog === "remove") perform(dialog === "remove");
                else if (dialog === "silentEnable" || dialog === "silentDisable") perform(false, dialog === "silentEnable");
            }}
        />
        </>
    );
};
