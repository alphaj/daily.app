import Foundation

// MARK: - App Group Configuration

enum AppGroupConfig {
    static let suiteName = "group.app.rork.daily-habit-tracker-t8o4w6l"
    static let tasksKey = "widget_tasks"
    static let habitsKey = "widget_habits"
    static let supplementsKey = "widget_supplements"
    static let lastUpdatedKey = "widget_last_updated"
}

// MARK: - Task Model

struct WidgetTask: Codable, Identifiable {
    let id: String
    let title: String
    let completed: Bool
    let dueDate: String
    let priority: String?
    let isWork: Bool?
    let energyLevel: String?
}

// MARK: - Habit Model

struct WidgetHabit: Codable, Identifiable {
    let id: String
    let name: String
    let emoji: String?
    let type: String // "building" or "breaking"
    let isCompletedToday: Bool
    let currentStreak: Int
    let bestStreak: Int
    let weeklyCompletionRate: Double
    let weekDots: [Bool] // Last 7 days
    let energyLevel: String?
}

// MARK: - Supplement Model

struct WidgetSupplement: Codable, Identifiable {
    let id: String
    let name: String
    let emoji: String?
    let dosage: String?
    let isTakenToday: Bool
    let currentStreak: Int
    let timeOfDay: String?
}

// MARK: - Widget Data Container

struct WidgetData: Codable {
    let tasks: [WidgetTask]
    let habits: [WidgetHabit]
    let supplements: [WidgetSupplement]
    let lastUpdated: Date

    var pendingTasks: [WidgetTask] {
        tasks.filter { !$0.completed }
    }

    var completedTasks: [WidgetTask] {
        tasks.filter { $0.completed }
    }

    var completedHabitsCount: Int {
        habits.filter { $0.isCompletedToday }.count
    }

    var totalHabitsCount: Int {
        habits.count
    }

    var takenSupplementsCount: Int {
        supplements.filter { $0.isTakenToday }.count
    }

    var totalSupplementsCount: Int {
        supplements.count
    }

    var bestCurrentStreak: Int {
        habits.map { $0.currentStreak }.max() ?? 0
    }
}

// MARK: - Data Provider

struct WidgetDataProvider {
    static func load() -> WidgetData {
        guard let defaults = UserDefaults(suiteName: AppGroupConfig.suiteName) else {
            return .empty
        }

        let tasks = decode([WidgetTask].self, from: defaults, key: AppGroupConfig.tasksKey) ?? []
        let habits = decode([WidgetHabit].self, from: defaults, key: AppGroupConfig.habitsKey) ?? []
        let supplements = decode([WidgetSupplement].self, from: defaults, key: AppGroupConfig.supplementsKey) ?? []
        let lastUpdated = defaults.object(forKey: AppGroupConfig.lastUpdatedKey) as? Date ?? Date()

        return WidgetData(
            tasks: tasks,
            habits: habits,
            supplements: supplements,
            lastUpdated: lastUpdated
        )
    }

    private static func decode<T: Decodable>(_ type: T.Type, from defaults: UserDefaults, key: String) -> T? {
        guard let data = defaults.data(forKey: key) else { return nil }
        return try? JSONDecoder().decode(type, from: data)
    }
}

extension WidgetData {
    static let empty = WidgetData(
        tasks: [],
        habits: [],
        supplements: [],
        lastUpdated: Date()
    )

    static let preview = WidgetData(
        tasks: [
            WidgetTask(id: "1", title: "Review pull requests", completed: false, dueDate: "2025-02-06", priority: "high", isWork: true, energyLevel: "medium"),
            WidgetTask(id: "2", title: "Buy groceries", completed: false, dueDate: "2025-02-06", priority: "medium", isWork: false, energyLevel: "low"),
            WidgetTask(id: "3", title: "Morning run", completed: true, dueDate: "2025-02-06", priority: nil, isWork: false, energyLevel: "medium"),
            WidgetTask(id: "4", title: "Read for 30 minutes", completed: false, dueDate: "2025-02-06", priority: "low", isWork: false, energyLevel: "low"),
            WidgetTask(id: "5", title: "Call dentist", completed: false, dueDate: "2025-02-06", priority: "high", isWork: false, energyLevel: "low"),
        ],
        habits: [
            WidgetHabit(id: "1", name: "Exercise", emoji: "💪", type: "building", isCompletedToday: true, currentStreak: 12, bestStreak: 30, weeklyCompletionRate: 85, weekDots: [true, true, false, true, true, true, true], energyLevel: "high"),
            WidgetHabit(id: "2", name: "Read", emoji: "📚", type: "building", isCompletedToday: true, currentStreak: 8, bestStreak: 15, weeklyCompletionRate: 71, weekDots: [true, false, true, true, true, false, true], energyLevel: "low"),
            WidgetHabit(id: "3", name: "Meditate", emoji: "🧘", type: "building", isCompletedToday: false, currentStreak: 3, bestStreak: 20, weeklyCompletionRate: 57, weekDots: [true, true, false, false, true, false, true], energyLevel: "low"),
            WidgetHabit(id: "4", name: "Journal", emoji: "✍️", type: "building", isCompletedToday: true, currentStreak: 5, bestStreak: 12, weeklyCompletionRate: 100, weekDots: [true, true, true, true, true, true, true], energyLevel: "low"),
            WidgetHabit(id: "5", name: "No social media", emoji: "📵", type: "breaking", isCompletedToday: true, currentStreak: 4, bestStreak: 10, weeklyCompletionRate: 57, weekDots: [false, true, true, false, true, false, true], energyLevel: nil),
            WidgetHabit(id: "6", name: "Cold shower", emoji: "🚿", type: "building", isCompletedToday: false, currentStreak: 0, bestStreak: 7, weeklyCompletionRate: 28, weekDots: [false, false, true, false, true, false, false], energyLevel: "high"),
        ],
        supplements: [
            WidgetSupplement(id: "1", name: "Vitamin D", emoji: "☀️", dosage: "2000 IU", isTakenToday: true, currentStreak: 14, timeOfDay: "morning"),
            WidgetSupplement(id: "2", name: "Omega-3", emoji: "🐟", dosage: "1000mg", isTakenToday: true, currentStreak: 10, timeOfDay: "morning"),
            WidgetSupplement(id: "3", name: "Magnesium", emoji: "💊", dosage: "400mg", isTakenToday: false, currentStreak: 6, timeOfDay: "evening"),
        ]
    )
}
