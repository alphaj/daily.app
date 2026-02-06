import WidgetKit
import SwiftUI

// MARK: - Shared Timeline Provider for Lock Screen

struct LockScreenTimelineProvider: TimelineProvider {
    func placeholder(in context: Context) -> LockScreenEntry {
        LockScreenEntry(date: Date(), data: .preview)
    }

    func getSnapshot(in context: Context, completion: @escaping (LockScreenEntry) -> Void) {
        let data = context.isPreview ? WidgetData.preview : WidgetDataProvider.load()
        completion(LockScreenEntry(date: Date(), data: data))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<LockScreenEntry>) -> Void) {
        let data = WidgetDataProvider.load()
        let entry = LockScreenEntry(date: Date(), data: data)
        let nextUpdate = Calendar.current.date(byAdding: .minute, value: 15, to: Date())!
        let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
        completion(timeline)
    }
}

struct LockScreenEntry: TimelineEntry {
    let date: Date
    let data: WidgetData
}

// MARK: - Circular (Tasks remaining)

struct TasksCircularView: View {
    let entry: LockScreenEntry

    private var pending: Int { entry.data.pendingTasks.count }
    private var total: Int { entry.data.tasks.count }
    private var progress: Double {
        guard total > 0 else { return 0 }
        return Double(total - pending) / Double(total)
    }

    var body: some View {
        Gauge(value: progress) {
            Image(systemName: "checklist")
        } currentValueLabel: {
            Text("\(pending)")
                .font(.system(size: 22, weight: .bold, design: .rounded))
        }
        .gaugeStyle(.accessoryCircularCapacity)
    }
}

// MARK: - Circular (Habits completion)

struct HabitsCircularView: View {
    let entry: LockScreenEntry

    private var completed: Int { entry.data.completedHabitsCount }
    private var total: Int { entry.data.totalHabitsCount }
    private var progress: Double {
        guard total > 0 else { return 0 }
        return Double(completed) / Double(total)
    }

    var body: some View {
        Gauge(value: progress) {
            Image(systemName: "target")
        } currentValueLabel: {
            Text("\(completed)/\(total)")
                .font(.system(size: 13, weight: .bold, design: .rounded))
        }
        .gaugeStyle(.accessoryCircularCapacity)
    }
}

// MARK: - Rectangular (Combined summary)

struct DailyRectangularView: View {
    let entry: LockScreenEntry

    private var pendingTasks: Int { entry.data.pendingTasks.count }
    private var habitsDone: Int { entry.data.completedHabitsCount }
    private var habitsTotal: Int { entry.data.totalHabitsCount }
    private var pillsDone: Int { entry.data.takenSupplementsCount }
    private var pillsTotal: Int { entry.data.totalSupplementsCount }

    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            HStack(spacing: 4) {
                Image(systemName: "sun.max.fill")
                    .font(.system(size: 11, weight: .semibold))
                Text("Daily")
                    .font(.system(size: 13, weight: .bold))
            }
            HStack(spacing: 8) {
                HStack(spacing: 3) {
                    Image(systemName: "checklist")
                        .font(.system(size: 10))
                    Text("\(pendingTasks) tasks")
                        .font(.system(size: 12, weight: .medium))
                }
                HStack(spacing: 3) {
                    Image(systemName: "target")
                        .font(.system(size: 10))
                    Text("\(habitsDone)/\(habitsTotal)")
                        .font(.system(size: 12, weight: .medium))
                }
                if pillsTotal > 0 {
                    HStack(spacing: 3) {
                        Image(systemName: "pill.fill")
                            .font(.system(size: 10))
                        Text("\(pillsDone)/\(pillsTotal)")
                            .font(.system(size: 12, weight: .medium))
                    }
                }
            }

            // Progress bar
            GeometryReader { geometry in
                let totalItems = entry.data.tasks.count + habitsTotal + pillsTotal
                let doneItems = entry.data.completedTasks.count + habitsDone + pillsDone
                let overallProgress = totalItems > 0 ? Double(doneItems) / Double(totalItems) : 0

                ZStack(alignment: .leading) {
                    Capsule()
                        .fill(.tertiary)
                        .frame(height: 3)
                    Capsule()
                        .fill(.primary)
                        .frame(width: geometry.size.width * overallProgress, height: 3)
                }
            }
            .frame(height: 3)
        }
    }
}

// MARK: - Inline (Quick summary)

struct DailyInlineView: View {
    let entry: LockScreenEntry

    private var pendingTasks: Int { entry.data.pendingTasks.count }
    private var habitsDone: Int { entry.data.completedHabitsCount }
    private var habitsTotal: Int { entry.data.totalHabitsCount }

    var body: some View {
        HStack(spacing: 4) {
            Image(systemName: "checklist")
            if pendingTasks == 0 && entry.data.tasks.count > 0 {
                Text("All done \u{00B7} \(habitsDone)/\(habitsTotal) habits")
            } else {
                Text("\(pendingTasks) tasks \u{00B7} \(habitsDone)/\(habitsTotal) habits")
            }
        }
    }
}

// MARK: - Lock Screen Tasks Widget

struct LockScreenTasksWidget: Widget {
    let kind: String = "LockScreenTasksWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: LockScreenTimelineProvider()) { entry in
            TasksCircularView(entry: entry)
                .containerBackground(.fill.tertiary, for: .widget)
        }
        .configurationDisplayName("Tasks Remaining")
        .description("Shows how many tasks are left today.")
        .supportedFamilies([.accessoryCircular])
    }
}

// MARK: - Lock Screen Habits Widget

struct LockScreenHabitsWidget: Widget {
    let kind: String = "LockScreenHabitsWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: LockScreenTimelineProvider()) { entry in
            HabitsCircularView(entry: entry)
                .containerBackground(.fill.tertiary, for: .widget)
        }
        .configurationDisplayName("Habit Progress")
        .description("Shows today's habit completion.")
        .supportedFamilies([.accessoryCircular])
    }
}

// MARK: - Lock Screen Summary Widget

struct LockScreenSummaryWidget: Widget {
    let kind: String = "LockScreenSummaryWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: LockScreenTimelineProvider()) { entry in
            DailyRectangularView(entry: entry)
                .containerBackground(.fill.tertiary, for: .widget)
        }
        .configurationDisplayName("Daily Overview")
        .description("Tasks, habits, and supplements on your lock screen.")
        .supportedFamilies([.accessoryRectangular])
    }
}

// MARK: - Lock Screen Inline Widget

struct LockScreenInlineWidget: Widget {
    let kind: String = "LockScreenInlineWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: LockScreenTimelineProvider()) { entry in
            DailyInlineView(entry: entry)
                .containerBackground(.fill.tertiary, for: .widget)
        }
        .configurationDisplayName("Daily Status")
        .description("Compact task and habit count.")
        .supportedFamilies([.accessoryInline])
    }
}
