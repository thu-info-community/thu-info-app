#include "RNOH/PackageProvider.h"
#include "BlurPackage.h"
#include "GestureHandlerPackage.h"
#include "AsyncStoragePackage.h"
#include "generated/RNOHGeneratedPackage.h"
#include "CookiesPackage.h"
#include "SVGPackage.h"
#include "SafeAreaViewPackage.h"
#include "SliderPackage.h"
#include "generated/rtn_network_utils/RNOH/generated/BaseRtnNetworkUtilsPackage.h"

using namespace rnoh;

std::vector<std::shared_ptr<Package>> PackageProvider::getPackages(Package::Context ctx) {
    return {
        std::make_shared<BlurPackage>(ctx),         std::make_shared<GestureHandlerPackage>(ctx),
        std::make_shared<AsyncStoragePackage>(ctx), std::make_shared<RNOHGeneratedPackage>(ctx),
        std::make_shared<CookiesPackage>(ctx),      std::make_shared<SVGPackage>(ctx),
        std::make_shared<SafeAreaViewPackage>(ctx), std::make_shared<SliderPackage>(ctx),
        std::make_shared<BaseRtnNetworkUtilsPackage>(ctx)
    };
}