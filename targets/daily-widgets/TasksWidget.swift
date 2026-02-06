import WidgetKit
import SwiftUI

// MARK: - Timeline Provider

struct TasksTimelineProvider: TimelineProvider {
    func placeholder(in context: Context) -> TasksEntry {
        TasksEntry(date: Date(), data: .preview)
    }

    func getSnapshot(in context: Context, completion: @escaping (TasksEntry) -> Void) {
        let data = context.isPreview ? WidgetData.preview : WidgetDataProvider.load()
        completion(TasksEntry(date: Date(), data: data))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<TasksEntry>) -> Void) {
        let data = WidgetDataProvider.load()
        let entry = TasksEntry(date: Date(), data: data)
        // Refresh every 15 minutes
        let nextUpdate = Calendar.current.date(byAdding: .minute, value: 15, to: Date())!
        let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
        completion(timeline)
    }
}

struct TasksEntry: TimelineEntry {
    let date: Date
    let data: WidgetData
}

// MARK: - Small Tasks Widget

struct TasksWidgetSmallView: View {
    let entry: TasksEntry

    private var pendingCount: Int { entry.data.pendingTasks.count }
    private var totalCount: Int { entry.data.tasks.count }
    private var completedCount: Int { entry.data.completedTasks.count }
    private var progress: Double {
        guard totalCount > 0 else { return 0 }
        return Double(completedCount) / Double(totalCount)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Header
            WidgetSectionHeader(icon: "checklist", title: "Tasks", color: .dailyIndigo)

            Spacer()

            // Central ring with count
            HStack {
                Spacer()
                ZStack {
                    ProgressRing(
                        progress: progress,
                        lineWidth: 5,
                        size: 56,
                        foregroundColor: .dailyIndigo,
                        backgroundColor: .dailyIndigo.opacity(0.12)
                    )
                    VStack(spacing: -1) {
                        Text("\(pendingCount)")
                            .font(.system(size: 22, weight: .bold, design: .rounded))
                            .foregroundColor(.primary)
                        Text("left")
                            .font(.system(size: 10, weight: .medium))
                            .foregroundColor(.secondary)
                    }
                }
                Spacer()
            }

            Spacer()

            // Footer
            HStack {
                if totalCount == 0 {
                    Text("No tasks today")
                        .font(.system(size: 11, weight: .medium))
                        .foregroundColor(.secondary)
                } else if pendingCount == 0 {
                    HStack(spacing: 3) {
                        Image(systemName: "checkmark.circle.fill")
                            .font(.system(size: 11))
                            .foregroundColor(.dailyGreen)
                        Text("All done!")
                            .font(.system(size: 11, weight: .semibold))
                            .foregroundColor(.dailyGreen)
                    }
                } else {
                    Text("\(completedCount)/\(totalCount) done")
                        .font(.system(size: 11, weight: .medium))
                        .foregroundColor(.secondary)
                }
                Spacer()
                Text(WidgetDateFormatter.todayString())
                    .font(.system(size: 11, weight: .medium))
                    .foregroundColor(.tertiary)
            }
        }
        .padding(16)
    }
}

// MARK: - Medium Tasks Widget

struct TasksWidgetMediumView: View {
    let entry: TasksEntry

    private var pendingTasks: [WidgetTask] { Array(entry.data.pendingTasks.prefix(4)) }
    private var completedCount: Int { entry.data.completedTasks.count }
    private var totalCount: Int { entry.data.tasks.count }

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Header row
            HStack(alignment: .center) {
                WidgetSectionHeader(icon: "checklist", title: "Today's Tasks", color: .dailyIndigo)
                Spacer()
                Text(WidgetDateFormatter.todayString())
                    .font(.system(size: 12, weight: .medium))
                    .foregroundColor(.tertiary)
            }

            Spacer(minLength: 8)

            if pendingTasks.isEmpty && totalCount > 0 {
                // All tasks done
                HStack {
                    Spacer()
                    VStack(spacing: 6) {
                        Image(systemName: "checkmark.circle.fill")
                            .font(.system(size: 28))
                            .foregroundColor(.dailyGreen)
                        Text("All \(totalCount) tasks complete")
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundColor(.dailyGreen)
                    }
                    Spacer()
                }
            } else if totalCount == 0 {
                HStack {
                    Spacer()
                    VStack(spacing: 6) {
                        Image(systemName: "plus.circle")
                            .font(.system(size: 24))
                            .foregroundColor(.dailyGray.opacity(0.5))
                        Text("No tasks for today")
                            .font(.system(size: 13, weight: .medium))
                            .foregroundColor(.secondary)
                    }
                    Spacer()
                }
            } else {
                // Task list
                VStack(spacing: 6) {
                    ForEach(pendingTasks) { task in
                        TaskRow(task: task, compact: true)
                    }
                }
            }

            Spacer(minLength: 6)

            // Footer
            if totalCount > 0 {
                HStack {
                    Text("\(completedCount) of \(totalCount) done")
                        .font(.system(size: 11, weight: .medium))
                        .foregroundColor(.secondary)
                    Spacer()
                    if entry.data.pendingTasks.count > 4 {
                        Text("+\(entry.data.pendingTasks.count - 4) more")
                            .font(.system(size: 11, weight: .medium))
                            .foregroundColor(.dailyIndigo)
                    }
                }
            }
        }
        .padding(16)
    }
}

// MARK: - Large Tasks Widget

struct TasksWidgetLargeView: View {
    let entry: TasksEntry

    private var allTasks: [WidgetTask] {
        // Show pending first, then completed, max 8
        let pending = entry.data.pendingTasks
        let completed = entry.data.completedTasks
        return Array((pending + completed).prefix(8))
    }
    private var pendingCount: Int { entry.data.pendingTasks.count }
    private var totalCount: Int { entry.data.tasks.count }
    private var completedCount: Int { entry.data.completedTasks.count }
    private var progress: Double {
        guard totalCount > 0 else { return 0 }
        return Double(completedCount) / Double(totalCount)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Header with progress
            HStack(alignment: .center) {
                VStack(alignment: .leading, spacing: 2) {
                    Text(WidgetDateFormatter.dayOfWeek())
                        .font(.system(size: 11, weight: .bold))
                        .foregroundColor(.secondary)
                        .textCase(.uppercase)
                        .tracking(0.5)
                    Text("Today's Tasks")
                        .font(.system(size: 20, weight: .bold))
                        .foregroundColor(.primary)
                }

                Spacer()

                // Mini progress ring
                ZStack {
                    ProgressRing(
                        progress: progress,
                        lineWidth: 3.5,
                        size: 38,
                        foregroundColor: .dailyIndigo,
                        backgroundColor: .dailyIndigo.opacity(0.12)
                    )
                    Text("\(completedCount)/\(totalCount)")
                        .font(.system(size: 10, weight: .bold, design: .rounded))
                        .foregroundColor(.dailyIndigo)
                }
            }

            Spacer(minLength: 12)

            if allTasks.isEmpty {
                Spacer()
                HStack {
                    Spacer()
                    VStack(spacing: 8) {
                        Image(systemName: "sun.max.fill")
                            .font(.system(size: 32))
                            .foregroundColor(.dailyOrange.opacity(0.6))
                        Text("Nothing on the list")
                            .font(.system(size: 15, weight: .medium))
                            .foregroundColor(.secondary)
                        Text("Tap to add a task")
                            .font(.system(size: 12, weight: .regular))
                            .foregroundColor(.tertiary)
                    }
                    Spacer()
                }
                Spacer()
            } else {
                // Task list
                VStack(spacing: 8) {
                    ForEach(allTasks) { task in
                        TaskRow(task: task)
                        if task.id != allTasks.last?.id {
                            Divider()
                                .opacity(0.5)
                        }
                    }
                }

                Spacer(minLength: 8)

                // Footer
                HStack {
                    if pendingCount == 0 {
                        HStack(spacing: 4) {
                            Image(systemName: "checkmark.circle.fill")
                                .font(.system(size: 12))
                                .foregroundColor(.dailyGreen)
                            Text("All tasks complete!")
                                .font(.system(size: 12, weight: .semibold))
                                .foregroundColor(.dailyGreen)
                        }
                    } else {
                        Text("\(pendingCount) remaining")
                            .font(.system(size: 12, weight: .medium))
                            .foregroundColor(.secondary)
                    }
                    Spacer()
                    if entry.data.tasks.count > 8 {
                        Text("+\(entry.data.tasks.count - 8) more")
                            .font(.system(size: 12, weight: .medium))
                            .foregroundColor(.dailyIndigo)
                    }
                }
            }
        }
        .padding(16)
    }
}

// MARK: - Widget Configuration

struct TasksWidget: Widget {
    let kind: String = "TasksWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: TasksTimelineProvider()) { entry in
            TasksWidgetEntryView(entry: entry)
                .containerBackground(.fill.tertiary, for: .widget)
        }
        .configurationDisplayName("Today's Tasks")
        .description("See your tasks for today at a glance.")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
    }
}

struct TasksWidgetEntryView: View {
    @Environment(\.widgetFamily) var family
    let entry: TasksEntry

    var body: some View {
        switch family {
        case .systemSmall:
            TasksWidgetSmallView(entry: entry)
        case .systemMedium:
            TasksWidgetMediumView(entry: entry)
        case .systemLarge:
            TasksWidgetLargeView(entry: entry)
        default:
            TasksWidgetSmallView(entry: entry)
        }
    }
}
