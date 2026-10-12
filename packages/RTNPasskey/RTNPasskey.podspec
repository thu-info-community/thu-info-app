require 'json'

package = JSON.parse(File.read(File.join(__dir__, 'package.json')))

Pod::Spec.new do |s|
  s.name = 'RTNPasskey'
  s.version = package['version']
  s.summary = 'Device-local Passkey signing for THU Info.'
  s.homepage = 'https://github.com/thu-info-community/thu-info-app'
  s.license = { :type => 'BUSL-1.1', :file => '../../LICENSE' }
  s.author = 'THU Info Community'
  s.source = { :git => 'https://github.com/thu-info-community/thu-info-app.git', :tag => s.version }
  s.platforms = { :ios => min_ios_version_supported }
  s.source_files = 'ios/**/*.{h,mm}'
  s.requires_arc = true
  s.frameworks = 'Security', 'LocalAuthentication', 'UIKit'

  install_modules_dependencies(s)
end
