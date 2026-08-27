project(rnapp)
cmake_minimum_required(VERSION 3.4.1)
set(CMAKE_SKIP_BUILD_RPATH TRUE)

set(OH_MODULES "${CMAKE_CURRENT_SOURCE_DIR}/../../../oh_modules")
set(RNOH_APP_DIR "${CMAKE_CURRENT_SOURCE_DIR}")

set(RNOH_C_API_ARCH, 1)

set(RNOH_CPP_DIR "${OH_MODULES}/@rnoh/react-native-openharmony/src/main/cpp")
set(RNOH_GENERATED_DIR "${CMAKE_CURRENT_SOURCE_DIR}/generated")
set(CMAKE_ASM_FLAGS "-Wno-error=unused-command-line-argument -Qunused-arguments")
set(CMAKE_CXX_FLAGS "-fstack-protector-strong -Wl,-z,relro,-z,now,-z,noexecstack -s -fPIE -pie")
add_compile_definitions(WITH_HITRACE_SYSTRACE)
set(WITH_HITRACE_SYSTRACE 1) # for other CMakeLists.txt files to use

add_subdirectory("${RNOH_CPP_DIR}" ./rn)

add_subdirectory("${OH_MODULES}/@react-native-ohos/async-storage/src/main/cpp" ./async-storage)
add_subdirectory("${OH_MODULES}/@react-native-ohos/blur/src/main/cpp" ./blur)
add_subdirectory("${OH_MODULES}/@react-native-ohos/clipboard/src/main/cpp" ./clipboard)
add_subdirectory("${OH_MODULES}/@react-native-ohos/react-native-gesture-handler/src/main/cpp" ./gesture-handler)
add_subdirectory("${OH_MODULES}/@react-native-ohos/cookies/src/main/cpp" ./rn_cookies)
add_subdirectory("${OH_MODULES}/@react-native-ohos/react-native-svg/src/main/cpp" ./svg)
add_subdirectory("${OH_MODULES}/@react-native-ohos/react-native-safe-area-context/src/main/cpp" ./safe-area)
add_subdirectory("${OH_MODULES}/@react-native-ohos/slider/src/main/cpp" ./slider)
add_subdirectory("${OH_MODULES}/@react-native-ohos/camera-roll/src/main/cpp" ./camera-roll)
add_subdirectory("${OH_MODULES}/@react-native-ohos/react-native-blob-util/src/main/cpp" ./blob-util)
add_subdirectory("${OH_MODULES}/@react-native-ohos/react-native-get-random-values/src/main/cpp" ./get_random_values)
add_subdirectory("${OH_MODULES}/@react-native-ohos/react-native-device-info/src/main/cpp" ./device_info)
add_subdirectory("${OH_MODULES}/@react-native-ohos/react-native-localize/src/main/cpp" ./rn_localize)
add_subdirectory("${OH_MODULES}/@react-native-ohos/react-native-share/src/main/cpp" ./share)
add_subdirectory("${OH_MODULES}/@react-native-ohos/react-native-snackbar/src/main/cpp" ./react-native-snackbar)
add_subdirectory("${OH_MODULES}/@react-native-ohos/react-native-version-number/src/main/cpp" ./rnoh_version_number)
add_subdirectory("${OH_MODULES}/@react-native-ohos/react-native-webview/src/main/cpp" ./webview)

file(GLOB GENERATED_CPP_FILES "./generated/*.cpp")

set(rtn_network_utils_generated_dir "${RNOH_GENERATED_DIR}/rtn_network_utils")
file(GLOB_RECURSE rtn_network_utils_generated_dir_SRC "${rtn_network_utils_generated_dir}/**/*.cpp")
file(GLOB rtn_network_utils_package_SRC CONFIGURE_DEPENDS *.cpp)

add_library(rnoh_app SHARED
    ${GENERATED_CPP_FILES}
    ${rtn_network_utils_generated_dir_SRC}
    ${rtn_network_utils_package_SRC}
    "./PackageProvider.cpp"
    "${RNOH_CPP_DIR}/RNOHAppNapiBridge.cpp"
)

target_include_directories(rnoh_app PUBLIC ${rtn_network_utils_generated_dir})

target_link_libraries(rnoh_app PUBLIC rnoh)
target_link_libraries(rnoh_app PUBLIC rnoh_async_storage)
target_link_libraries(rnoh_app PUBLIC rnoh_blur)
target_link_libraries(rnoh_app PUBLIC rnoh_clipboard)
target_link_libraries(rnoh_app PUBLIC device_info)
target_link_libraries(rnoh_app PUBLIC rnoh_gesture_handler)
target_link_libraries(rnoh_app PUBLIC rnoh_cookies)
target_link_libraries(rnoh_app PUBLIC rnoh_svg)
target_link_libraries(rnoh_app PUBLIC rnoh_safe_area)
target_link_libraries(rnoh_app PUBLIC rnoh_slider)
target_link_libraries(rnoh_app PUBLIC rnoh_blob_util)
target_link_libraries(rnoh_app PUBLIC rnoh_camera_roll)
target_link_libraries(rnoh_app PUBLIC rnoh_get_random_values)
target_link_libraries(rnoh_app PUBLIC rnoh_localize)
target_link_libraries(rnoh_app PUBLIC rnoh_share)
target_link_libraries(rnoh_app PUBLIC rnoh_snackbar)
target_link_libraries(rnoh_app PUBLIC rnoh_version_number)
target_link_libraries(rnoh_app PUBLIC rnoh_webview)
