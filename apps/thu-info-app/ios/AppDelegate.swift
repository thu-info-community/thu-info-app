import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider

@main
final class AppDelegate: UIResponder, UIApplicationDelegate {
  // Some native modules still look up the window through the app delegate.
  weak var window: UIWindow?
}

final class SceneDelegate: RCTDefaultReactNativeFactoryDelegate, UIWindowSceneDelegate {
  var window: UIWindow?
  private var reactNativeFactory: RCTReactNativeFactory?

  func scene(
    _ scene: UIScene,
    willConnectTo session: UISceneSession,
    options connectionOptions: UIScene.ConnectionOptions
  ) {
    guard let windowScene = scene as? UIWindowScene else { return }

    let window = UIWindow(windowScene: windowScene)
    let factory = RCTReactNativeFactory(delegate: self)
    dependencyProvider = RCTAppDependencyProvider()
    self.window = window
    (UIApplication.shared.delegate as? AppDelegate)?.window = window
    reactNativeFactory = factory

    factory.startReactNative(
      withModuleName: "thu_info",
      in: window,
      connectionOptions: connectionOptions
    )
  }

  override func sourceURL(for bridge: RCTBridge) -> URL? {
    self.bundleURL()
  }

  override func bundleURL() -> URL? {
#if DEBUG
    RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
#else
    Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}
