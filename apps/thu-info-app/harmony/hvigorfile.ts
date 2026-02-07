import { FileUtil } from '@ohos/hvigor';
import { appTasks } from '@ohos/hvigor-ohos-plugin';

import * as dotenv from 'dotenv';

const packageJson = JSON.parse(FileUtil.readFileSync('../package.json'));
const versionName = packageJson.version;
const versionCode = packageJson.build;

const secretsEnv = dotenv.parse(FileUtil.readFileSync('secrets.env'));

export default {
    system: appTasks,  /* Built-in plugin of Hvigor. It cannot be modified. */
    config: {
        ohos: {
            overrides: {
                appOpt: {
                    versionCode,
                    versionName,
                },
                signingConfig: {
                    type: 'HarmonyOS',
                    material: {
                        storePassword: secretsEnv.OH_STORE_PASSWORD,
                        certpath: secretsEnv.OH_CERT_PATH,
                        keyAlias: secretsEnv.OH_KEY_ALIAS,
                        keyPassword: secretsEnv.OH_KEY_PASSWORD,
                        profile: secretsEnv.OH_PROFILE,
                        storeFile: secretsEnv.OH_STORE_FILE
                    }
                }
            }
        }
    },
    plugins:[]         /* Custom plugin to extend the functionality of Hvigor. */
}
