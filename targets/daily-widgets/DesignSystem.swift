import SwiftUI
import WidgetKit

// MARK: - Color Palette (matching the Daily app)

extension Color {
    // Primary
    static let dailyIndigo = Color(red: 88/255, green: 86/255, blue: 214/255)    // #5856D6
    static let dailyBlue = Color(red: 0/255, green: 122/255, blue: 255/255)      // #007AFF
    static let dailyGreen = Color(red: 52/255, green: 199/255, blue: 89/255)     // #34C759
    static let dailyRed = Color(red: 255/255, green: 59/255, blue: 48/255)       // #FF3B30
    static let dailyOrange = Color(red: 255/255, green: 149/255, blue: 0/255)    // #FF9500
    static let dailyPurple = Color(red: 175/255, green: 82/255, blue: 222/255)   // #AF52DE
    static let dailyPink = Color(red: 255/255, green: 45/255, blue: 85/255)      // #FF2D55

    // Neutrals
    static let dailyGray = Color(red: 142/255, green: 142/255, blue: 147/255)    // #8E8E93
    static let dailyLightGray = Color(red: 242/255, green: 242/255, blue: 247/255) // #F2F2F7
    static let dailySeparator = Color(red: 229/255, green: 229/255, blue: 234/255) // #E5E5EA

    // Semantic
    static let dailyTaskAccent = dailyIndigo
    static let dailyHabitAccent = dailyGreen
    static let dailySupplementAccent = dailyOrange
}

// MARK: - Progress Ring View

struct ProgressRing: View {
    let progress: Double // 0.0 to 1.0
    let lineWidth: CGFloat
    let size: CGFloat
    let foregroundColor: Color
    let backgroundColor: Color

    init(
        progress: Double,
        lineWidth: CGFloat = 4,
        size: CGFloat = 44,
        foregroundColor: Color = .dailyIndigo,
        backgroundColor: Color = .dailyLightGray
    ) {
        self.progress = min(max(progress, 0), 1)
        self.lineWidth = lineWidth
        self.size = size
        self.foregroundColor = foregroundColor
        self.backgroundColor = backgroundColor
    }

    var body: some View {
        ZStack {
            Circle()
                .stroke(backgroundColor, lineWidth: lineWidth)
            Circle()
                .trim(from: 0, to: progress)
                .stroke(
                    foregroundColor,
                    style: StrokeStyle(lineWidth: lineWidth, lineCap: .round)
                )
                .rotationEffect(.degrees(-90))
        }
        .frame(width: size, height: size)
    }
}

// MARK: - Completion Dot

struct CompletionDot: View {
    let isCompleted: Bool
    let color: Color
    let size: CGFloat

    init(isCompleted: Bool, color: Color = .dailyIndigo, size: CGFloat = 6) {
        self.isCompleted = isCompleted
        self.color = color
        self.size = size
    }

    var body: some View {
        Circle()
            .fill(isCompleted ? color : color.opacity(0.2))
            .frame(width: size, height: size)
    }
}

// MARK: - Week Dots Row

struct WeekDotsRow: View {
    let dots: [Bool]
    let color: Color
    let dotSize: CGFloat

    init(dots: [Bool], color: Color = .dailyIndigo, dotSize: CGFloat = 5) {
        self.dots = dots
        self.color = color
        self.dotSize = dotSize
    }

    var body: some View {
        HStack(spacing: 3) {
            ForEach(0..<dots.count, id: \.self) { index in
                CompletionDot(isCompleted: dots[index], color: color, size: dotSize)
            }
        }
    }
}

// MARK: - Task Row

struct TaskRow: View {
    let task: WidgetTask
    let compact: Bool

    init(task: WidgetTask, compact: Bool = false) {
        self.task = task
        self.compact = compact
    }

    var body: some View {
        HStack(spacing: compact ? 8 : 10) {
            // Checkbox
            ZStack {
                Circle()
                    .stroke(task.completed ? Color.dailyIndigo : Color.dailySeparator, lineWidth: 2)
                    .frame(width: compact ? 18 : 20, height: compact ? 18 : 20)
                if task.completed {
                    Circle()
                        .fill(Color.dailyIndigo)
                        .frame(width: compact ? 18 : 20, height: compact ? 18 : 20)
                    Image(systemName: "checkmark")
                        .font(.system(size: compact ? 9 : 10, weight: .bold))
                        .foregroundColor(.white)
                }
            }

            // Title
            Text(task.title)
                .font(.system(size: compact ? 13 : 15, weight: task.completed ? .regular : .medium))
                .foregroundColor(task.completed ? .secondary : .primary)
                .strikethrough(task.completed)
                .lineLimit(1)

            Spacer()

            // Priority indicator
            if let priority = task.priority, !task.completed {
                Circle()
                    .fill(priorityColor(priority))
                    .frame(width: 6, height: 6)
            }
        }
    }

    private func priorityColor(_ priority: String) -> Color {
        switch priority {
        case "high": return .dailyRed
        case "medium": return .dailyOrange
        default: return .dailyGray.opacity(0.4)
        }
    }
}

// MARK: - Section Header

struct WidgetSectionHeader: View {
    let icon: String
    let title: String
    let color: Color

    var body: some View {
        HStack(spacing: 4) {
            Image(systemName: icon)
                .font(.system(size: 11, weight: .semibold))
                .foregroundColor(color)
            Text(title)
                .font(.system(size: 11, weight: .bold))
                .foregroundColor(.secondary)
                .textCase(.uppercase)
                .tracking(0.5)
        }
    }
}

// MARK: - Date Formatter

struct WidgetDateFormatter {
    static func todayString() -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "MMM d"
        return formatter.string(from: Date())
    }

    static func dayOfWeek() -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "EEEE"
        return formatter.string(from: Date())
    }

    static func shortDayOfWeek() -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "EEE"
        return formatter.string(from: Date())
    }
}
