import WidgetKit
import SwiftUI

// MARK: - Timeline Provider

struct HabitsTimelineProvider: TimelineProvider {
    func placeholder(in context: Context) -> HabitsEntry {
        HabitsEntry(date: Date(), data: .preview)
    }

    func getSnapshot(in context: Context, completion: @escaping (HabitsEntry) -> Void) {
        let data = context.isPreview ? WidgetData.preview : WidgetDataProvider.load()
        completion(HabitsEntry(date: Date(), data: data))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<HabitsEntry>) -> Void) {
        let data = WidgetDataProvider.load()
        let entry = HabitsEntry(date: Date(), data: data)
        let nextUpdate = Calendar.current.date(byAdding: .minute, value: 15, to: Date())!
        let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
        completion(timeline)
    }
}

struct HabitsEntry: TimelineEntry {
    let date: Date
    let data: WidgetData
}

// MARK: - Small Habits Widget

struct HabitsWidgetSmallView: View {
    let entry: HabitsEntry

    private var completed: Int { entry.data.completedHabitsCount }
    private var total: Int { entry.data.totalHabitsCount }
    private var progress: Double {
        guard total > 0 else { return 0 }
        return Double(completed) / Double(total)
    }
    private var bestStreak: Int { entry.data.bestCurrentStreak }

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Header
            WidgetSectionHeader(icon: "target", title: "Habits", color: .dailyGreen)

            Spacer()

            // Central ring
            HStack {
                Spacer()
                ZStack {
                    ProgressRing(
                        progress: progress,
                        lineWidth: 5,
                        size: 56,
                        foregroundColor: .dailyGreen,
                        backgroundColor: .dailyGreen.opacity(0.12)
                    )
                    VStack(spacing: -1) {
                        Text("\(completed)/\(total)")
                            .font(.system(size: 16, weight: .bold, design: .rounded))
                            .foregroundColor(.primary)
                        Text("done")
                            .font(.system(size: 10, weight: .medium))
                            .foregroundColor(.secondary)
                    }
                }
                Spacer()
            }

            Spacer()

            // Footer with streak
            HStack {
                if completed == total && total > 0 {
                    HStack(spacing: 3) {
                        Image(systemName: "star.fill")
                            .font(.system(size: 10))
                            .foregroundColor(.dailyOrange)
                        Text("All done!")
                            .font(.system(size: 11, weight: .semibold))
                            .foregroundColor(.dailyGreen)
                    }
                } else if bestStreak > 0 {
                    HStack(spacing: 3) {
                        Text("🔥")
                            .font(.system(size: 10))
                        Text("\(bestStreak) day streak")
                            .font(.system(size: 11, weight: .medium))
                            .foregroundColor(.secondary)
                    }
                } else if total == 0 {
                    Text("No habits yet")
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

// MARK: - Medium Habits Widget

struct HabitsWidgetMediumView: View {
    let entry: HabitsEntry

    private var habits: [WidgetHabit] { Array(entry.data.habits.prefix(7)) }
    private var completed: Int { entry.data.completedHabitsCount }
    private var total: Int { entry.data.totalHabitsCount }
    private var bestStreak: Int { entry.data.bestCurrentStreak }

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Header
            HStack {
                WidgetSectionHeader(icon: "target", title: "Today's Habits", color: .dailyGreen)
                Spacer()
                Text(WidgetDateFormatter.todayString())
                    .font(.system(size: 12, weight: .medium))
                    .foregroundColor(.tertiary)
            }

            Spacer(minLength: 10)

            if habits.isEmpty {
                HStack {
                    Spacer()
                    VStack(spacing: 6) {
                        Image(systemName: "target")
                            .font(.system(size: 24))
                            .foregroundColor(.dailyGray.opacity(0.5))
                        Text("No habits tracked yet")
                            .font(.system(size: 13, weight: .medium))
                            .foregroundColor(.secondary)
                    }
                    Spacer()
                }
            } else {
                // Habit emoji row
                HStack(spacing: 0) {
                    ForEach(habits) { habit in
                        VStack(spacing: 6) {
                            // Emoji circle
                            ZStack {
                                Circle()
                                    .fill(habit.isCompletedToday
                                        ? (habit.type == "breaking" ? Color.dailyRed.opacity(0.12) : Color.dailyGreen.opacity(0.12))
                                        : Color.dailyLightGray)
                                    .frame(width: 38, height: 38)
                                Text(habit.emoji ?? "⚡️")
                                    .font(.system(size: 18))

                                // Completion badge
                                if habit.isCompletedToday {
                                    VStack {
                                        Spacer()
                                        HStack {
                                            Spacer()
                                            Image(systemName: "checkmark.circle.fill")
                                                .font(.system(size: 13))
                                                .foregroundColor(habit.type == "breaking" ? .dailyRed : .dailyGreen)
                                                .background(
                                                    Circle()
                                                        .fill(.white)
                                                        .frame(width: 11, height: 11)
                                                )
                                        }
                                    }
                                    .frame(width: 38, height: 38)
                                }
                            }

                            // Name
                            Text(habit.name)
                                .font(.system(size: 10, weight: .medium))
                                .foregroundColor(habit.isCompletedToday ? .secondary : .primary)
                                .lineLimit(1)
                        }
                        .frame(maxWidth: .infinity)
                    }
                }
            }

            Spacer(minLength: 8)

            // Footer
            if total > 0 {
                HStack {
                    Text("\(completed) of \(total) done")
                        .font(.system(size: 11, weight: .medium))
                        .foregroundColor(.secondary)
                    if bestStreak > 0 {
                        Text("·")
                            .foregroundColor(.secondary)
                        HStack(spacing: 2) {
                            Text("🔥")
                                .font(.system(size: 10))
                            Text("\(bestStreak) day streak")
                                .font(.system(size: 11, weight: .medium))
                                .foregroundColor(.secondary)
                        }
                    }
                    Spacer()
                    if entry.data.habits.count > 7 {
                        Text("+\(entry.data.habits.count - 7) more")
                            .font(.system(size: 11, weight: .medium))
                            .foregroundColor(.dailyGreen)
                    }
                }
            }
        }
        .padding(16)
    }
}

// MARK: - Widget Configuration

struct HabitsWidget: Widget {
    let kind: String = "HabitsWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: HabitsTimelineProvider()) { entry in
            HabitsWidgetEntryView(entry: entry)
                .containerBackground(.fill.tertiary, for: .widget)
        }
        .configurationDisplayName("Habits")
        .description("Track your daily habit completions.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

struct HabitsWidgetEntryView: View {
    @Environment(\.widgetFamily) var family
    let entry: HabitsEntry

    var body: some View {
        switch family {
        case .systemSmall:
            HabitsWidgetSmallView(entry: entry)
        case .systemMedium:
            HabitsWidgetMediumView(entry: entry)
        default:
            HabitsWidgetSmallView(entry: entry)
        }
    }
}
