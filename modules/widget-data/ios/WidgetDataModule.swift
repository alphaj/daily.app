import ExpoModulesCore
import WidgetKit

public class WidgetDataModule: Module {
    public func definition() -> ModuleDefinition {
        Name("WidgetDataModule")

        /// Write a key-value pair to shared UserDefaults (App Group)
        AsyncFunction("setItem") { (key: String, value: String, suiteName: String) in
            guard let defaults = UserDefaults(suiteName: suiteName) else {
                throw WidgetDataError.invalidSuiteName(suiteName)
            }
            // Store as Data for consistency with the widget's decoder
            if let data = value.data(using: .utf8) {
                defaults.set(data, forKey: key)
                defaults.synchronize()
            }
        }

        /// Reload all widget timelines to pick up new data
        AsyncFunction("reloadWidgets") {
            if #available(iOS 14.0, *) {
                WidgetCenter.shared.reloadAllTimelines()
            }
        }
    }
}

enum WidgetDataError: Error, LocalizedError {
    case invalidSuiteName(String)

    var errorDescription: String? {
        switch self {
        case .invalidSuiteName(let name):
            return "Invalid App Group suite name: \(name)"
        }
    }
}
