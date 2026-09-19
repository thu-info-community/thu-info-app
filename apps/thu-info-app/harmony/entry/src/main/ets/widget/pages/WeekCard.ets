// "This week's schedule" card (4*4 / 6*4). Seven day columns built from the
// snapshot's nextDays list (today first). Tap anywhere to open the schedule.
//
// Note: build() and @Builder bodies may only contain UI syntax (no local
// variable statements), so derived values live in member functions. All UI
// lives in member @Builder methods reading state through `this` — global
// builders with by-value params would not refresh on snapshot pushes.
import { parseSnapshot, WidgetDayModel, WidgetItem, WidgetSnapshotModel } from '../common/WidgetModels';

let cardStorage = new LocalStorage();

@Entry(cardStorage)
@Component
struct WeekCard {
  @LocalStorageProp('snapshot') snapshotText: string = '';
  @LocalStorageProp('dimension') dimension: string = '4*4';

  private snapshot(): WidgetSnapshotModel | null {
    return parseSnapshot(this.snapshotText);
  }

  private days(): WidgetDayModel[] {
    const snapshot = this.snapshot();
    return snapshot === null ? [] : snapshot.nextDays;
  }

  private week(): number {
    const snapshot = this.snapshot();
    return snapshot === null ? 0 : snapshot.week;
  }

  private maxPerDay(): number {
    return this.dimension === '6*4' ? 5 : 4;
  }

  private itemsOf(day: WidgetDayModel): WidgetItem[] {
    const max = this.maxPerDay();
    return day.items.length > max ? day.items.slice(0, max) : day.items;
  }

  private overflowOf(day: WidgetDayModel): number {
    const max = this.maxPerDay();
    return day.items.length > max ? day.items.length - max : 0;
  }

  @Builder
  itemBlock(item: WidgetItem) {
    Column({ space: 1 }) {
      Text(item.from)
        .fontSize(8)
        .fontColor(Color.White)
        .maxLines(1)
      Text(item.name)
        .fontSize(9)
        .fontColor(Color.White)
        .maxLines(2)
    }
    .width('100%')
    .alignItems(HorizontalAlign.Start)
    .padding(3)
    .borderRadius(4)
    .backgroundColor(item.color)
  }

  @Builder
  dayColumn(day: WidgetDayModel, index: number) {
    Column({ space: 2 }) {
      ForEach(this.itemsOf(day), (item: WidgetItem) => {
        this.itemBlock(item)
      }, (item: WidgetItem, i: number) =>
        // The per-day cap depends on the dimension; keep it in the key so a
        // resize rebuilds the item blocks with the new cap.
        `${this.dimension}-${i}-${item.begin}-${item.name}`)
      if (this.overflowOf(day) > 0) {
        Text(`+${this.overflowOf(day)}`)
          .fontSize(9)
          .fontColor($r('app.color.widget_text_secondary'))
      }
    }
    .layoutWeight(1)
    .width('100%')
    .alignItems(HorizontalAlign.Start)
    .padding(index === 0 ? 2 : 0)
    .backgroundColor(index === 0 ? $r('app.color.widget_today_bg') : Color.Transparent)
    .borderRadius(4)
  }

  build() {
    Column() {
      if (this.snapshot() === null || this.snapshot()?.empty) {
        Text($r('app.string.widget_empty_hint'))
          .fontSize(12)
          .fontColor($r('app.color.widget_text_tertiary'))
      } else {
        Row() {
          Text($r('app.string.widget_week_header'))
            .fontSize(12)
            .fontWeight(FontWeight.Bold)
            .fontColor($r('app.color.widget_text_primary'))
          Text($r('app.string.widget_week_label', this.week()))
            .fontSize(11)
            .fontColor($r('app.color.widget_text_secondary'))
        }
        .width('100%')
        .justifyContent(FlexAlign.SpaceBetween)

        Row() {
          ForEach(this.days(), (day: WidgetDayModel, index: number) => {
            Column({ space: 1 }) {
              Text(day.label)
                .fontSize(10)
                .fontColor(index === 0
                  ? $r('app.color.widget_accent')
                  : $r('app.color.widget_text_secondary'))
              Text(day.date)
                .fontSize(9)
                .fontColor($r('app.color.widget_text_tertiary'))
            }
            .layoutWeight(1)
          }, (day: WidgetDayModel) => `${day.dayOfWeek}-${day.date}`)
        }
        .width('100%')
        .margin({ top: 6 })

        Divider()
          .color($r('app.color.widget_divider'))
          .margin({ top: 4, bottom: 4 })

        Row({ space: 2 }) {
          ForEach(this.days(), (day: WidgetDayModel, index: number) => {
            this.dayColumn(day, index)
          }, (day: WidgetDayModel) => `${day.dayOfWeek}-${day.date}`)
        }
        .layoutWeight(1)
        .width('100%')
        .alignItems(VerticalAlign.Top)
      }
    }
    .width('100%')
    .height('100%')
    .padding(12)
    .onClick(() => {
      postCardAction(this, {
        action: 'router',
        abilityName: 'EntryAbility',
        params: { target: 'schedule' },
      });
    })
  }
}
