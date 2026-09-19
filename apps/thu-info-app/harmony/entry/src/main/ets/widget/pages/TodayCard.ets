// "Today's schedule" card (2*2 / 2*4 / 4*4). Item count adapts to the size;
// overflow is summarized as "+N more". Tap anywhere to open the schedule.
//
// Note: build() and @Builder bodies may only contain UI syntax (no local
// variable statements), so derived values live in member functions. All UI
// lives in member @Builder methods reading state through `this` — global
// builders with by-value params would not refresh on snapshot pushes.
import { parseSnapshot, WidgetDayModel, WidgetItem, WidgetSnapshotModel } from '../common/WidgetModels';

let cardStorage = new LocalStorage();

@Entry(cardStorage)
@Component
struct TodayCard {
  @LocalStorageProp('snapshot') snapshotText: string = '';
  @LocalStorageProp('dimension') dimension: string = '2*4';

  private snapshot(): WidgetSnapshotModel | null {
    return parseSnapshot(this.snapshotText);
  }

  private day(): WidgetDayModel {
    const snapshot = this.snapshot();
    return snapshot === null
      ? { dayOfWeek: 1, date: '', label: '', items: [] }
      : snapshot.today;
  }

  private maxItems(): number {
    if (this.dimension === '2*2') {
      return 2;
    }
    if (this.dimension === '4*4') {
      return 13;
    }
    return 6;
  }

  private visibleItems(): WidgetItem[] {
    const items = this.day().items;
    return items.length > this.maxItems() ? items.slice(0, this.maxItems()) : items;
  }

  private overflowCount(): number {
    const total = this.day().items.length;
    return total > this.maxItems() ? total - this.maxItems() : 0;
  }

  @Builder
  itemRow(item: WidgetItem) {
    Row() {
      Column()
        .width(4)
        .height('80%')
        .borderRadius(2)
        .backgroundColor(item.color)
      Text(item.from)
        .fontSize(11)
        .fontColor($r('app.color.widget_text_secondary'))
        .width(42)
        .margin({ left: 6 })
      Column() {
        Text(item.name)
          .fontSize(12)
          .fontWeight(FontWeight.Medium)
          .fontColor($r('app.color.widget_text_primary'))
          .maxLines(1)
        if (this.dimension !== '2*2' && item.loc !== '') {
          Text(item.loc)
            .fontSize(10)
            .fontColor($r('app.color.widget_text_tertiary'))
            .maxLines(1)
        }
      }
      .alignItems(HorizontalAlign.Start)
      .margin({ left: 6 })
      .layoutWeight(1)
    }
    .width('100%')
    .alignItems(VerticalAlign.Center)
  }

  build() {
    Column() {
      if (this.snapshot() === null || this.snapshot()?.empty) {
        Text($r('app.string.widget_empty_hint'))
          .fontSize(12)
          .fontColor($r('app.color.widget_text_tertiary'))
      } else if (this.day().items.length === 0) {
        Text($r('app.string.widget_empty_none_today'))
          .fontSize(12)
          .fontColor($r('app.color.widget_text_tertiary'))
      } else {
        Row() {
          Text($r('app.string.widget_today_header'))
            .fontSize(12)
            .fontWeight(FontWeight.Bold)
            .fontColor($r('app.color.widget_text_primary'))
          Text(`${this.day().date} ${this.day().label}`)
            .fontSize(11)
            .fontColor($r('app.color.widget_text_secondary'))
        }
        .width('100%')
        .justifyContent(FlexAlign.SpaceBetween)

        Column({ space: 4 }) {
          ForEach(this.visibleItems(), (item: WidgetItem) => {
            this.itemRow(item)
          }, (item: WidgetItem, index: number) =>
            // The dimension participates in the key so a resize (which flips
            // the location line inside reused rows) rebuilds every row.
            `${this.dimension}-${index}-${item.begin}-${item.name}`)
        }
        .layoutWeight(1)
        .width('100%')
        .justifyContent(FlexAlign.Center)
        .margin({ top: 4 })

        if (this.overflowCount() > 0) {
          Divider()
            .color($r('app.color.widget_divider'))
            .margin({ top: 4 })
          Text($r('app.string.widget_more_count', this.overflowCount()))
            .fontSize(11)
            .fontColor($r('app.color.widget_text_secondary'))
            .margin({ top: 4 })
        }
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
