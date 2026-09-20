#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(RTNWidget, NSObject)

RCT_EXTERN_METHOD(updateScheduleSnapshot:(NSString *)snapshot
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(consumeLaunchParams:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(getWidgetStats:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

@end
