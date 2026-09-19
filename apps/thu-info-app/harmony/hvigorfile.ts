import * as fs from 'fs';
import { appTasks } from '@ohos/hvigor-ohos-plugin';

import * as dotenv from 'dotenv';

const packageJson = JSON.parse(fs.readFileSync('../package.json', 'utf8'));
const versionName = packageJson.version;
const versionCode = packageJson.build;

const manualSigning = process.env.THUINFO_HARMONY_MANUAL_SIGN === '1';
const secretsEnv: Record<string, string> = manualSigning
    ? {}
    : dotenv.parse(fs.readFileSync('secrets.env', 'utf8'));

export default {
    system: appTasks,  /* Built-in plugin of Hvigor. It cannot be modified. */
    config: {
        ohos: {
            overrides: {
                appOpt: {
                    versionCode,
                    versionName,
                },
                signingConfig: manualSigning ? undefined : {
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
