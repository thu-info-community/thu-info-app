import { RootNav } from "../../components/Root.tsx";
import { Image, Text, TouchableOpacity, useColorScheme, View } from "react-native";
import { styles } from "../../components/home/secondaryItems";
import * as Theme from "../../assets/themes/themes.ts";
import { helper } from "../../redux/store.ts";
import { useEffect, useState } from "react";
import { RoundedView } from "../../components/views.tsx";
import { CodeField, Cursor, useClearByFocusCell } from "react-native-confirmation-code-field";
import { getStr } from "../../utils/i18n.ts";
import Snackbar from "react-native-snackbar";

export const NetworkLoginScreen = ({ navigation }: { navigation: RootNav }) => {
  const themeName = useColorScheme();
  const style = styles(themeName);
  const colors = Theme.default(themeName).colors;
  const [verificationCode, setVerificationCode] = useState("");
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    helper.getNetworkVerificationImageUrl().then((url) => {
      setImageUrl(url);
    });
  }, []);

  const [props, getCellOnLayoutHandler] = useClearByFocusCell({
    value: verificationCode,
    setValue: setVerificationCode,
  });

  return (
    <View style={style.SecondaryRootView}>
      <RoundedView
        style={{
          borderRadius: 20,
          alignItems: "center",
          justifyContent: "center",
          padding: 32,
          paddingVertical: 32,
          backgroundColor: colors.contentBackground,
          display: "flex",
          flexDirection: "column",
          gap: 32,
        }}>
        <Text style={{
          fontSize: 24,
          color: colors.text,
        }}>
          {getStr("networkVerificationCode")}
        </Text>
        <View style={{
          display: "flex", gap: 8,
          alignItems: "center",
          justifyContent: "center",
        }}>
        <TouchableOpacity
          onPress={() => {
            helper.getNetworkVerificationImageUrl().then((url) => {
              setImageUrl(url);
            });
          }}>
          <Image
            source={{ uri: imageUrl }}
            width={180}
            height={68}
          />
        </TouchableOpacity>
        <Text style={{
          fontSize: 16,
          color: colors.fontB3,
        }}>
          {getStr("networkVerificationCodeRefreshHint")}
        </Text>
        </View>
        <CodeField
          {...props}
          value={verificationCode}
          onChangeText={(v) => {
            if (v.match(/^\d{0,4}$/)) {
              setVerificationCode(v);
              if (v.length === 4) {
                helper.loginUsereg(v).then(() => {
                    navigation.pop();
                  }).catch((e) => {
                    setVerificationCode("");
                    Snackbar.show({
                      text: e.message,
                      duration: Snackbar.LENGTH_SHORT,
                    });
                  });
              }
            }
          }}
          cellCount={4}
          autoFocus={false}
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          secureTextEntry={false}
          renderCell={({ index, symbol, isFocused }) => (
            <View
              key={index}
              style={{
                width: "12.5%",
                aspectRatio: 0.67,
                paddingHorizontal: "auto",
                paddingVertical: "auto",
                borderWidth: 2,
                borderColor: isFocused ? colors.mainTheme : colors.themeGrey,
                borderRadius: 12,
                justifyContent: "center",
                marginLeft: index === 0 ? 0 : 12,
              }}>
              <Text
                style={{
                  fontSize: 32,
                  textAlign: "center",
                  color: colors.primaryLight,
                }}
                onLayout={getCellOnLayoutHandler(index)}>
                {symbol ? symbol : isFocused ? <Cursor /> : null}
              </Text>
            </View>
          )}
        />
      </RoundedView>
    </View>
  );
};
