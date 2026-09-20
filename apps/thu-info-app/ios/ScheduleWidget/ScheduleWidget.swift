import SwiftUI
import WidgetKit

private let scheduleDeepLink = URL(string: "thuinfo://schedule")!

struct ScheduleItem: Decodable, Identifiable {
  let name: String
  let loc: String
  let from: String
  let to: String
  let begin: Double
  let end: Double
  let color: String
  var id: String { "\(name)-\(begin)-\(end)-\(loc)" }
}

struct ScheduleDay: Decodable {
  let dayOfWeek: Int
  let date: String
  let label: String
  let dateText: String
  let items: [ScheduleItem]
}

struct WeekBlock: Decodable, Identifiable {
  let name: String
  let loc: String
  let from: String
  let to: String
  let begin: Double
  let end: Double
  let dayOfWeek: Int
  let top: Double
  let height: Double
  let timeLabel: String
  let compact: Bool
  let fill: String
  let textColor: String
  var id: String { "\(name)-\(begin)-\(dayOfWeek)" }
}

struct WeekView: Decodable {
  let days: [ScheduleDay]
  let blocks: [WeekBlock]
  let showWeekend: Bool
}

struct ScheduleSnapshot: Decodable {
  let v: Int
  let language: String
  let today: ScheduleDay
  let nextDays: [ScheduleDay]
  let weekView: WeekView?
  let empty: Bool
}

struct ScheduleEntry: TimelineEntry {
  let date: Date
  let snapshot: ScheduleSnapshot?
}

struct ScheduleProvider: TimelineProvider {
  func placeholder(in context: Context) -> ScheduleEntry {
    ScheduleEntry(date: .now, snapshot: nil)
  }

  func getSnapshot(in context: Context, completion: @escaping (ScheduleEntry) -> Void) {
    completion(ScheduleEntry(date: .now, snapshot: loadSnapshot()))
  }

  func getTimeline(in context: Context, completion: @escaping (Timeline<ScheduleEntry>) -> Void) {
    let now = Date()
    let entry = ScheduleEntry(date: now, snapshot: loadSnapshot())
    completion(Timeline(entries: [entry], policy: .after(now.addingTimeInterval(15 * 60))))
  }

  private func loadSnapshot() -> ScheduleSnapshot? {
    guard let text = UserDefaults(suiteName: "group.org.reactjs.native.example.thu-info")?
      .string(forKey: "schedule_snapshot"),
      let data = text.data(using: .utf8),
      let snapshot = try? JSONDecoder().decode(ScheduleSnapshot.self, from: data),
      snapshot.v == 1 else { return nil }
    return snapshot
  }
}

private extension Color {
  init(widgetHex: String) {
    let value = widgetHex.trimmingCharacters(in: CharacterSet(charactersIn: "#"))
    guard let rgb = UInt64(value, radix: 16) else { self = .accentColor; return }
    self.init(.sRGB, red: Double((rgb >> 16) & 0xff) / 255, green: Double((rgb >> 8) & 0xff) / 255, blue: Double(rgb & 0xff) / 255)
  }
}

struct ScheduleWidgetView: View {
  @Environment(\.widgetFamily) private var family
  let entry: ScheduleEntry

  var body: some View {
    Group {
      if let snapshot = entry.snapshot, !snapshot.empty {
        switch family {
        case .systemSmall: NextCourseView(snapshot: snapshot, now: entry.date)
        case .systemLarge: WeekScheduleView(snapshot: snapshot)
        default: TodayScheduleView(snapshot: snapshot)
        }
      } else {
        EmptyScheduleView()
      }
    }
    .widgetURL(scheduleDeepLink)
    .padding()
    .background(Color(uiColor: .systemBackground))
  }
}

private struct WidgetHeader: View {
  let title: String
  let subtitle: String
  var body: some View {
    HStack(alignment: .firstTextBaseline) {
      Text(title).font(.headline)
      Spacer()
      Text(subtitle).font(.caption).foregroundStyle(.secondary)
    }
  }
}

private struct NextCourseView: View {
  let snapshot: ScheduleSnapshot
  let now: Date
  private var next: (ScheduleDay, ScheduleItem)? {
    snapshot.nextDays.lazy.compactMap { day in
      day.items.first { $0.end > now.timeIntervalSince1970 * 1000 }.map { (day, $0) }
    }.first
  }
  var body: some View {
    VStack(alignment: .leading, spacing: 8) {
      WidgetHeader(title: snapshot.language == "en" ? "Next class" : "下一节课", subtitle: snapshot.today.label)
      if let (day, item) = next {
        Spacer(minLength: 0)
        Text(item.name).font(.title3.weight(.semibold)).lineLimit(2)
        Text("\(day.dateText)  \(item.from)-\(item.to)").font(.caption).foregroundStyle(.secondary).lineLimit(1)
        Text(item.loc.isEmpty ? (snapshot.language == "en" ? "No location" : "未标注地点") : item.loc).font(.caption).foregroundStyle(Color(widgetHex: item.color)).lineLimit(1)
      } else {
        Spacer()
        Text(snapshot.language == "en" ? "No upcoming classes" : "近期没有课程").foregroundStyle(.secondary)
        Spacer()
      }
    }
  }
}

private struct TodayScheduleView: View {
  let snapshot: ScheduleSnapshot
  var body: some View {
    VStack(alignment: .leading, spacing: 7) {
      WidgetHeader(title: snapshot.language == "en" ? "Today" : "今日课程", subtitle: snapshot.today.dateText)
      if snapshot.today.items.isEmpty {
        Spacer()
        Text(snapshot.language == "en" ? "No classes today" : "今天没有课程").foregroundStyle(.secondary)
        Spacer()
      } else {
        ForEach(snapshot.today.items.prefix(4)) { item in
          HStack(spacing: 8) {
            RoundedRectangle(cornerRadius: 2).fill(Color(widgetHex: item.color)).frame(width: 4)
            VStack(alignment: .leading, spacing: 1) {
              Text(item.name).font(.subheadline.weight(.medium)).lineLimit(1)
              Text(item.loc.isEmpty ? "\(item.from)-\(item.to)" : "\(item.from)-\(item.to)  \(item.loc)").font(.caption2).foregroundStyle(.secondary).lineLimit(1)
            }
          }
        }
        if snapshot.today.items.count > 4 { Text("+\(snapshot.today.items.count - 4)").font(.caption).foregroundStyle(.secondary) }
      }
    }
  }
}

private struct WeekScheduleView: View {
  let snapshot: ScheduleSnapshot
  var body: some View {
    VStack(alignment: .leading, spacing: 5) {
      WidgetHeader(title: snapshot.language == "en" ? "Schedule" : "课程表", subtitle: "")
      if let week = snapshot.weekView, !week.blocks.isEmpty {
        let days = week.showWeekend ? week.days : Array(week.days.prefix(5))
        HStack(spacing: 2) {
          ForEach(days, id: \.dayOfWeek) { day in
            Text(day.label).font(.caption2).frame(maxWidth: .infinity)
          }
        }
        GeometryReader { geometry in
          let width = geometry.size.width / CGFloat(max(days.count, 1))
          ZStack(alignment: .topLeading) {
            ForEach(week.blocks.filter { block in days.contains { $0.dayOfWeek == block.dayOfWeek } }) { block in
              let index = days.firstIndex { $0.dayOfWeek == block.dayOfWeek } ?? 0
              Text(block.name).font(.system(size: block.compact ? 7 : 8, weight: .medium)).lineLimit(2).foregroundStyle(Color(widgetHex: block.textColor)).padding(3).frame(width: max(width - 3, 1), height: max(geometry.size.height * CGFloat(block.height) - 2, 16), alignment: .topLeading).background(Color(widgetHex: block.fill).opacity(0.85), in: RoundedRectangle(cornerRadius: 3)).offset(x: CGFloat(index) * width + 1, y: geometry.size.height * CGFloat(block.top))
            }
          }
        }
      } else {
        Spacer()
        Text(snapshot.language == "en" ? "No classes this week" : "本周没有课程").foregroundStyle(.secondary)
        Spacer()
      }
    }
  }
}

private struct EmptyScheduleView: View {
  var body: some View {
    VStack(alignment: .leading, spacing: 8) {
      Text("THU Info").font(.headline)
      Spacer()
      Text("Open the app to sync your schedule").font(.subheadline).foregroundStyle(.secondary)
      Spacer()
    }
  }
}

@main
struct ScheduleWidget: Widget {
  let kind = "THUInfoScheduleWidget"
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: ScheduleProvider()) { entry in
      ScheduleWidgetView(entry: entry)
    }
    .configurationDisplayName("Schedule")
    .description("Your upcoming and weekly classes.")
    .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
  }
}
