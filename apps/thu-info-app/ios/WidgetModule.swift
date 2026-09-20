import Foundation
import React
import WidgetKit

enum WidgetStore {
  static let suiteName = "group.org.reactjs.native.example.thu-info"
  static let snapshotKey = "schedule_snapshot"
  static let launchKey = "schedule_widget_launch"

  static var defaults: UserDefaults? { UserDefaults(suiteName: suiteName) }

  static func save(snapshot: String) {
    defaults?.set(snapshot, forKey: snapshotKey)
    WidgetCenter.shared.reloadAllTimelines()
  }

  static func consumeLaunch() -> String? {
    let value = defaults?.string(forKey: launchKey)
    defaults?.removeObject(forKey: launchKey)
    return value
  }

  static func recordScheduleLaunch() {
    defaults?.set("{\"target\":\"schedule\"}", forKey: launchKey)
  }
}

@objc(RTNWidget)
class WidgetModule: NSObject {
  @objc static func requiresMainQueueSetup() -> Bool { false }

  @objc(updateScheduleSnapshot:resolve:reject:)
  func updateScheduleSnapshot(
    _ snapshot: String,
    resolve: RCTPromiseResolveBlock,
    reject: RCTPromiseRejectBlock
  ) {
    WidgetStore.save(snapshot: snapshot)
    resolve(true)
  }

  @objc(consumeLaunchParams:reject:)
  func consumeLaunchParams(
    _ resolve: RCTPromiseResolveBlock,
    reject: RCTPromiseRejectBlock
  ) {
    resolve(WidgetStore.consumeLaunch())
  }

  @objc(getWidgetStats:reject:)
  func getWidgetStats(
    _ resolve: RCTPromiseResolveBlock,
    reject: RCTPromiseRejectBlock
  ) {
    let hasSnapshot = WidgetStore.defaults?.string(forKey: WidgetStore.snapshotKey) != nil
    resolve("{\"hasSnapshot\":\(hasSnapshot)}")
  }
}
