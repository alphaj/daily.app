import WidgetKit
import SwiftUI

@main
struct DailyWidgetBundle: WidgetBundle {
    var body: some Widget {
        // Home Screen Widgets
        TasksWidget()
        HabitsWidget()
        DailySummaryWidget()

        // Lock Screen Widgets
        LockScreenTasksWidget()
        LockScreenHabitsWidget()
        LockScreenSummaryWidget()
        LockScreenInlineWidget()
    }
}
