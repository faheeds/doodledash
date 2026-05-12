/**
 * Config plugin to set CLANG_CXX_LANGUAGE_STANDARD = c++20
 * across all pods in the Xcode project.
 *
 * Fixes: "no member named 'move' in namespace 'std'"
 * caused by react-native-skia / react-native-svg on newer Xcode/Clang.
 */
const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const withCppStandard = (config) => {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const podfilePath = path.join(
        config.modRequest.platformProjectRoot,
        'Podfile'
      );

      let podfile = fs.readFileSync(podfilePath, 'utf8');

      const cppPatch = `
  # Fix: no member named 'move' in namespace 'std' (react-native-skia / svg)
  installer.pods_project.targets.each do |target|
    target.build_configurations.each do |build_config|
      build_config.build_settings['CLANG_CXX_LANGUAGE_STANDARD'] = 'c++20'
    end
  end
`;

      // Insert patch at the start of the first post_install block
      if (!podfile.includes("CLANG_CXX_LANGUAGE_STANDARD")) {
        podfile = podfile.replace(
          /post_install do \|installer\|/,
          `post_install do |installer|${cppPatch}`
        );
        fs.writeFileSync(podfilePath, podfile);
      }

      return config;
    },
  ]);
};

module.exports = withCppStandard;
