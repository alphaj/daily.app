import WidgetKit
import SwiftUI

// MARK: - Timeline Provider

struct SummaryTimelineProvider: TimelineProvider {
    func placeholder(in context: Context) -> SummaryEntry {
        SummaryEntry(date: Date(), data: .preview)
    }

    func getSnapshot(in context: Context, completion: @escaping (SummaryEntry) -> Void) {
        let data = context.isPreview ? WidgetData.preview : WidgetDataProvider.load()
        completion(SummaryEntry(date: Date(), data: data))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<SummaryEntry>) -> Void) {
        let data = WidgetDataProvider.load()
        let entry = SummaryEntry(date: Date(), data: data)
        let nextUpdate = Calendar.current.date(byAdding: .minute, value: 15, to: Date())!
        let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
        completion(timeline)
    }
}

struct SummaryEntry: TimelineEntry {
    let date: Date
    let data: WidgetData
}

// MARK: - Stat Card

struct StatCard: View {
    let icon: String
    let label: String
    let value: String
    let subtitle: String
    let color: Color
    let progress: Double

    var body: some View {
        VStack(spacing: 6) {
            ZStack {
                ProgressRing(
                    progress: progress,
                    lineWidth: 3.5,
                    size: 36,
                    foregroundColor: color,
                    backgroundColor: color.opacity(0.12)
                )
                Image(systemName: icon)
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundColor(color)
            }

            Text(value)
                .font(.system(size: 15, weight: .bold, design: .rounded))
                .foregroundColor(.primary)

            Text(label)
                .font(.system(size: 10, weight: .medium))
                .foregroundColor(.secondary)
                .lineLimit(1)
        }
        .frame(maxWidth: .infinity)
    }
}

// MARK: - Medium Summary Widget

struct SummaryWidgetMediumView: View {
    let entry: SummaryEntry

    private var taskProgress: Double {
        let total = entry.data.tasks.count
        guard total > 0 else { return 0 }
        return Double(entry.data.completedTasks.count) / Double(total)
    }

    private var habitProgress: Double {
        let total = entry.data.totalHabitsCount
        guard total > 0 else { return 0 }
        return Double(entry.data.completedHabitsCount) / Double(total)
    }

    private var supplementProgress: Double {
        let total = entry.data.totalSupplementsCount
        guard total > 0 else { return 0 }
        return Double(entry.data.takenSupplementsCount) / Double(total)
    }

    var body: some View {
        VStack(spacing: 0) {
            // Header
            HStack(alignment: .center) {
                VStack(alignment: .leading, spacing: 1) {
                    Text(WidgetDateFormatter.dayOfWeek().uppercased())
                        .font(.system(size: 10, weight: .bold))
                        .foregroundColor(.secondary)
                        .tracking(0.5)
                    Text("Daily")
                        .font(.system(size: 20, weight: .bold))
                        .foregroundColor(.primary)
                }
                Spacer()
                Text(WidgetDateFormatter.todayString())
                    .font(.system(size: 12, weight: .medium))
                    .foregroundColor(.tertiary)
            }

            Spacer(minLength: 12)

            // Three stat cards
            HStack(spacing: 12) {
                StatCard(
                    icon: "checklist",
                    label: "Tasks",
                    value: "\(entry.data.pendingTasks.count) left",
                    subtitle: "",
                    color: .dailyIndigo,
                    progress: taskProgress
                )

                // Divider
                Rectangle()
                    .fill(Color.dailySeparator.opacity(0.5))
                    .frame(width: 0.5)
                    .padding(.vertical, 4)

                StatCard(
                    icon: "target",
                    label: "Habits",
                    value: "\(entry.data.completedHabitsCount)/\(entry.data.totalHabitsCount)",
                    subtitle: "",
                    color: .dailyGreen,
                    progress: habitProgress
                )

                // Divider
                Rectangle()
                    .fill(Color.dailySeparator.opacity(0.5))
                    .frame(width: 0.5)
                    .padding(.vertical, 4)

                StatCard(
                    icon: "pill.fill",
                    label: "Pills",
                    value: "\(entry.data.takenSupplementsCount)/\(entry.data.totalSupplementsCount)",
                    subtitle: "",
                    color: .dailyOrange,
                    progress: supplementProgress
                )
            }

            Spacer(minLength: 10)

            // Streak footer
            if entry.data.bestCurrentStreak > 0 {
                HStack(spacing: 4) {
                    Text("🔥")
                        .font(.system(size: 11))
                    Text("Best active streak: \(entry.data.bestCurrentStreak) days")
                        .font(.system(size: 11, weight: .medium))
                        .foregroundColor(.secondary)
                    Spacer()
                }
            }
        }
        .padding(16)
    }
}

// MARK: - Widget Configuration

struct DailySummaryWidget: Widget {
    let kind: String = "DailySummaryWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: SummaryTimelineProvider()) { entry in
            SummaryWidgetMediumView(entry: entry)
                .containerBackground(.fill.tertiary, for: .widget)
        }
        .configurationDisplayName("Daily Summary")
        .description("Your tasks, habits, and supplements at a glance.")
        .supportedFamilies([.systemMedium])
    }
}
