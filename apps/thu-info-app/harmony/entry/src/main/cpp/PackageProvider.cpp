#include "RNOH/PackageProvider.h"
#include "BlurPackage.h"
#include "GestureHandlerPackage.h"
#include "AsyncStoragePackage.h"
#include "BlobUtilPackage.h"
#include "generated/RNOHGeneratedPackage.h"
#include "CameraRollPackage.h"
#include "ClipboardPackage.h"
#include "CookiesPackage.h"
#include "RNDeviceInfoPackage.h"
#include "RNLocalizePackage.h"
#include "RNSharePackage.h"
#include "SnackbarPackage.h"
#include "VersionNumberPackage.h"
#include "WebViewPackage.h"
#include "SVGPackage.h"
#include "SafeAreaViewPackage.h"
#include "SliderPackage.h"
#include "GetRandomValuesPackage.h"
#include "generated/rtn_network_utils/RNOH/generated/BaseRtnNetworkUtilsPackage.h"

using namespace rnoh;

std::vector<std::shared_ptr<Package>> PackageProvider::getPackages(Package::Context ctx) {
    return {
        std::make_shared<RNOHGeneratedPackage>(ctx),
        std::make_shared<BlurPackage>(ctx),
        std::make_shared<GestureHandlerPackage>(ctx),
        std::make_shared<AsyncStoragePackage>(ctx),
        std::make_shared<CameraRollPackage>(ctx),
        std::make_shared<ClipboardPackage>(ctx),
        std::make_shared<GetRandomValuesPackage>(ctx),
        std::make_shared<CookiesPackage>(ctx),
        std::make_shared<RNBlobUtilPackage>(ctx),
        std::make_shared<RNDeviceInfoPackage>(ctx),
        std::make_shared<RNLocalizePackage>(ctx),
        std::make_shared<RNSharePackage>(ctx),
        std::make_shared<VersionNumberPackage>(ctx),
        std::make_shared<SnackbarPackage>(ctx),
        std::make_shared<SVGPackage>(ctx),
        std::make_shared<SafeAreaViewPackage>(ctx),
        std::make_shared<SliderPackage>(ctx),
        std::make_shared<WebViewPackage>(ctx),
        std::make_shared<BaseRtnNetworkUtilsPackage>(ctx)
    };
}