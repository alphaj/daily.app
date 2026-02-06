const {
  withXcodeProject,
  withEntitlementsPlist,
  withInfoPlist,
  withDangerousMod,
} = require("@expo/config-plugins");
const path = require("path");
const fs = require("fs");

// Configuration
const WIDGET_NAME = "DailyWidgets";
const WIDGET_BUNDLE_ID_SUFFIX = ".widgets";
const APP_GROUP = "group.app.rork.daily-habit-tracker-t8o4w6l";
const DEPLOYMENT_TARGET = "17.0";

// Swift source files for the widget extension
const WIDGET_SWIFT_FILES = [
  "DailyWidgetBundle.swift",
  "SharedTypes.swift",
  "DesignSystem.swift",
  "TasksWidget.swift",
  "HabitsWidget.swift",
  "DailySummaryWidget.swift",
  "LockScreenWidgets.swift",
];

/**
 * Add App Group entitlement to the main app target
 */
function withAppGroupEntitlement(config) {
  return withEntitlementsPlist(config, (mod) => {
    const groups = mod.modResults["com.apple.security.application-groups"] || [];
    if (!groups.includes(APP_GROUP)) {
      groups.push(APP_GROUP);
    }
    mod.modResults["com.apple.security.application-groups"] = groups;
    return mod;
  });
}

/**
 * Copy widget Swift source files into the iOS project
 */
function withWidgetFiles(config) {
  return withDangerousMod(config, [
    "ios",
    async (mod) => {
      const projectRoot = mod.modRequest.projectRoot;
      const iosPath = path.join(projectRoot, "ios");
      const widgetDir = path.join(iosPath, WIDGET_NAME);

      // Create widget directory
      if (!fs.existsSync(widgetDir)) {
        fs.mkdirSync(widgetDir, { recursive: true });
      }

      // Copy Swift source files
      const sourceDir = path.join(projectRoot, "targets", "daily-widgets");
      for (const file of WIDGET_SWIFT_FILES) {
        const src = path.join(sourceDir, file);
        const dest = path.join(widgetDir, file);
        if (fs.existsSync(src)) {
          fs.copyFileSync(src, dest);
        }
      }

      // Copy Info.plist
      const infoPlistSrc = path.join(sourceDir, "Info.plist");
      const infoPlistDest = path.join(widgetDir, "Info.plist");
      if (fs.existsSync(infoPlistSrc)) {
        fs.copyFileSync(infoPlistSrc, infoPlistDest);
      }

      // Copy entitlements
      const entitlementsSrc = path.join(
        sourceDir,
        "DailyWidgets.entitlements"
      );
      const entitlementsDest = path.join(
        widgetDir,
        `${WIDGET_NAME}.entitlements`
      );
      if (fs.existsSync(entitlementsSrc)) {
        fs.copyFileSync(entitlementsSrc, entitlementsDest);
      }

      return mod;
    },
  ]);
}

/**
 * Add the widget extension target to the Xcode project
 */
function withWidgetTarget(config) {
  return withXcodeProject(config, (mod) => {
    const xcodeProject = mod.modResults;
    const bundleId =
      config.ios?.bundleIdentifier + WIDGET_BUNDLE_ID_SUFFIX;

    // Check if target already exists
    const existingTarget = xcodeProject.pbxTargetByName(WIDGET_NAME);
    if (existingTarget) {
      return mod;
    }

    // Add the widget extension target
    const target = xcodeProject.addTarget(
      WIDGET_NAME,
      "app_extension",
      WIDGET_NAME,
      bundleId
    );

    if (!target) {
      console.warn("[withDailyWidgets] Failed to add widget target");
      return mod;
    }

    // Add build phases
    const groupKey = xcodeProject.pbxCreateGroup(WIDGET_NAME, WIDGET_NAME);

    // Get the main group and add widget group as a child
    const mainGroupId = xcodeProject.getFirstProject().firstProject.mainGroup;
    xcodeProject.addToPbxGroup(groupKey, mainGroupId);

    // Add source files to the target
    for (const file of WIDGET_SWIFT_FILES) {
      xcodeProject.addSourceFile(
        `${WIDGET_NAME}/${file}`,
        { target: target.uuid },
        groupKey
      );
    }

    // Add Info.plist as a resource
    xcodeProject.addResourceFile(
      `${WIDGET_NAME}/Info.plist`,
      { target: target.uuid },
      groupKey
    );

    // Configure build settings for the widget target
    const configurations = xcodeProject.pbxXCBuildConfigurationSection();
    for (const key in configurations) {
      const config = configurations[key];
      if (
        typeof config === "object" &&
        config.buildSettings &&
        config.baseConfigurationReference === undefined
      ) {
        // Check if this config belongs to our widget target
        const targetName =
          config.buildSettings.PRODUCT_NAME ||
          config.buildSettings.INFOPLIST_FILE;
        if (
          targetName &&
          (targetName.includes(WIDGET_NAME) ||
            targetName === `"${WIDGET_NAME}"`)
        ) {
          // Apply widget-specific build settings
          config.buildSettings.SWIFT_VERSION = "5.0";
          config.buildSettings.IPHONEOS_DEPLOYMENT_TARGET = DEPLOYMENT_TARGET;
          config.buildSettings.TARGETED_DEVICE_FAMILY = '"1"';
          config.buildSettings.CODE_SIGN_ENTITLEMENTS = `${WIDGET_NAME}/${WIDGET_NAME}.entitlements`;
          config.buildSettings.PRODUCT_BUNDLE_IDENTIFIER = bundleId;
          config.buildSettings.MARKETING_VERSION = "7.0.3";
          config.buildSettings.CURRENT_PROJECT_VERSION = "1";
          config.buildSettings.GENERATE_INFOPLIST_FILE = "YES";
          config.buildSettings.INFOPLIST_FILE = `${WIDGET_NAME}/Info.plist`;
          config.buildSettings.ASSETCATALOG_COMPILER_WIDGET_BACKGROUND_COLOR_NAME =
            '"WidgetBackground"';
          config.buildSettings.ASSETCATALOG_COMPILER_GLOBAL_ACCENT_COLOR_NAME =
            '"AccentColor"';
          config.buildSettings.LD_RUNPATH_SEARCH_PATHS =
            '"$(inherited) @executable_path/../../Frameworks"';
          config.buildSettings.SKIP_INSTALL = "YES";
        }
      }
    }

    // Add WidgetKit and SwiftUI frameworks
    const frameworksBuildPhase = xcodeProject.pbxFrameworksBuildPhaseObj(
      target.uuid
    );
    if (frameworksBuildPhase) {
      xcodeProject.addFramework("WidgetKit.framework", {
        target: target.uuid,
        link: true,
      });
      xcodeProject.addFramework("SwiftUI.framework", {
        target: target.uuid,
        link: true,
      });
    }

    // Add the widget to the main app's embed extensions build phase
    const mainTarget = xcodeProject.getFirstTarget();
    if (mainTarget) {
      // Create "Embed App Extensions" copy files build phase
      xcodeProject.addBuildPhase(
        [],
        "PBXCopyFilesBuildPhase",
        "Embed App Extensions",
        mainTarget.firstTarget.uuid,
        "app_extension"
      );
    }

    return mod;
  });
}

/**
 * Main plugin: Adds iOS widget extension to the Expo project
 *
 * This plugin:
 * 1. Adds App Group entitlement to the main app for shared data
 * 2. Copies widget Swift source files into the iOS build
 * 3. Creates the widget extension target in the Xcode project
 */
const withDailyWidgets = (config) => {
  config = withAppGroupEntitlement(config);
  config = withWidgetFiles(config);
  config = withWidgetTarget(config);
  return config;
};

module.exports = withDailyWidgets;
