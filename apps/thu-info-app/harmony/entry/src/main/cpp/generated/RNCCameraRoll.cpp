/**
 * This code was generated by "react-native codegen-harmony"
 * 
 * Do not edit this file as changes may cause incorrect behavior and will be
 * lost once the code is regenerated.
 * 
 * @generatorVersion: 1
 */

#include "RNCCameraRoll.h"

namespace rnoh {
using namespace facebook;

RNCCameraRoll::RNCCameraRoll(const ArkTSTurboModule::Context ctx, const std::string name) : ArkTSTurboModule(ctx, name) {
    methodMap_ = {
        ARK_ASYNC_METHOD_METADATA(saveToCameraRoll, 2),
        ARK_ASYNC_METHOD_METADATA(getPhotos, 1),
        ARK_ASYNC_METHOD_METADATA(getAlbums, 1),
        ARK_ASYNC_METHOD_METADATA(deletePhotos, 1),
        ARK_ASYNC_METHOD_METADATA(getPhotoByInternalID, 2),
        ARK_ASYNC_METHOD_METADATA(getPhotoThumbnail, 2),
        ARK_METHOD_METADATA(addListener, 1),
        ARK_METHOD_METADATA(removeListeners, 1),
    };
}

} // namespace rnoh
