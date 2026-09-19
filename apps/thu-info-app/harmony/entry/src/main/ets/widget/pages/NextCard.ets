// "Next schedule item" card (1*2 / 2*2). The snapshot arrives as a JSON string
// via form binding data; the next item is picked card-side with the wall clock
// so it advances between provider pushes. Tap anywhere to open the schedule.
//
// Note: build() and @Builder bodies may only contain UI syntax (no local
// variable statements), so derived values live in member functions. All UI
// lives in member @Builder methods reading state through `this` — global
// builders with by-value params would not refresh on snapshot pushes.
import {
  parseSnapshot,
  pickNextItem,
  WidgetDayModel,
  WidgetItem,
  WidgetSnapshotModel,
} from '../common/WidgetModels';

let cardStorage = new LocalStorage();

@Entry(cardStorage)
@Component
struct NextCard {
  @LocalStorageProp('snapshot') snapshotText: string = '';
  @LocalStorageProp('dimension') dimension: string = '2*2';

  private snapshot(): WidgetSnapshotModel | null {
    return parseSnapshot(this.snapshotText);
  }

  private missing(): boolean {
    const snapshot = this.snapshot();
    return snapshot === null || snapshot.empty;
  }

  private item(): WidgetItem | null {
    const snapshot = this.snapshot();
    if (snapshot === null || snapshot.empty) {
      return null;
    }
    return pickNextItem(snapshot, Date.now());
  }

  private itemDay(): WidgetDayModel | null {
    const snapshot = this.snapshot();
    if (snapshot === null || snapshot.empty) {
      return null;
    }
    const now = Date.now();
    for (let d = 0; d < snapshot.nextDays.length; d++) {
      const day = snapshot.nextDays[d];
      for (let i = 0; i < day.items.length; i++) {
        if (day.items[i].end > now) {
          return day;
        }
      }
    }
    return null;
  }

  private itemWeek(): number {
    const snapshot = this.snapshot();
    const day = this.itemDay();
    if (snapshot === null || day === null) {
      return 0;
    }
    return day.dayOfWeek < snapshot.today.dayOfWeek ? snapshot.week + 1 : snapshot.week;
  }

  private itemDayLabel(): string {
    return this.itemDay()?.label ?? '';
  }

  private isToday(): boolean {
    const snapshot = this.snapshot();
    const day = this.itemDay();
    return snapshot !== null && day !== null && day.date === snapshot.today.date;
  }

  private ongoing(): boolean {
    const item = this.item();
    return item !== null && Date.now() >= item.begin;
  }

  // 1*2: course details on the left and the time range on the right.
  @Builder
  strip() {
    Column() {
      if (this.missing()) {
        Text($r('app.string.widget_empty_hint'))
          .fontSize(11)
          .fontColor($r('app.color.widget_text_tertiary'))
          .maxLines(1)
      } else if (this.item() === null) {
        Text($r('app.string.widget_empty_none_soon'))
          .fontSize(11)
          .fontColor($r('app.color.widget_text_tertiary'))
          .maxLines(1)
      } else {
        Row() {
          Column({ space: 2 }) {
            Text(this.item()?.name ?? '')
              .fontSize(12)
              .fontWeight(FontWeight.Bold)
              .fontColor($r('app.color.widget_text_primary'))
              .maxLines(1)
            Text(this.item()?.loc ?? '')
              .fontSize(10)
              .fontColor($r('app.color.widget_text_tertiary'))
              .maxLines(1)
          }
          .alignItems(HorizontalAlign.Start)
          .layoutWeight(1)

          Column({ space: 2 }) {
            Text(this.item()?.from ?? '')
              .fontSize(12)
              .fontWeight(FontWeight.Medium)
              .fontColor($r('app.color.widget_text_primary'))
            Text(this.item()?.to ?? '')
              .fontSize(10)
              .fontColor($r('app.color.widget_text_secondary'))
          }
          .alignItems(HorizontalAlign.End)
          .margin({ left: 8 })
        }
        .width('100%')
        .alignItems(VerticalAlign.Center)
        .opacity(this.isToday() ? 1 : 0.55)
      }
    }
    .width('100%')
    .height('100%')
    .padding({ left: 12, right: 12 })
    .justifyContent(FlexAlign.Center)
    .alignItems(HorizontalAlign.Start)
  }

  // 2*2: week/day in the header, course and location in the middle, time at
  // the bottom, plus a live "in progress" badge when applicable.
  @Builder
  tile() {
    Column() {
      if (this.missing()) {
        Text($r('app.string.widget_empty_hint'))
          .fontSize(12)
          .fontColor($r('app.color.widget_text_tertiary'))
          .textAlign(TextAlign.Center)
      } else if (this.item() === null) {
        Text($r('app.string.widget_empty_none_soon'))
          .fontSize(12)
          .fontColor($r('app.color.widget_text_tertiary'))
          .textAlign(TextAlign.Center)
      } else {
        Row() {
          Text($r('app.string.widget_next_header'))
            .fontSize(11)
            .fontColor($r('app.color.widget_text_secondary'))
          Text($r('app.string.widget_week_day_label', this.itemWeek(), this.itemDayLabel()))
            .fontSize(11)
            .fontColor($r('app.color.widget_text_secondary'))
        }
        .width('100%')
        .justifyContent(FlexAlign.SpaceBetween)

        Column({ space: 4 }) {
          Text(this.item()?.name ?? '')
            .fontSize(17)
            .fontWeight(FontWeight.Bold)
            .fontColor($r('app.color.widget_text_primary'))
            .maxLines(1)
          if ((this.item()?.loc ?? '') !== '') {
            Text(this.item()?.loc ?? '')
              .fontSize(12)
              .fontColor($r('app.color.widget_text_tertiary'))
              .maxLines(1)
          }
        }
        .layoutWeight(1)
        .justifyContent(FlexAlign.Center)
        .alignItems(HorizontalAlign.Start)
        .width('100%')

        Row() {
          Text(`${this.item()?.from ?? ''} – ${this.item()?.to ?? ''}`)
            .fontSize(13)
            .fontColor($r('app.color.widget_text_secondary'))
          if (this.ongoing()) {
            Text($r('app.string.widget_ongoing'))
              .fontSize(10)
              .fontColor($r('app.color.widget_accent'))
              .padding({ left: 6, right: 6, top: 2, bottom: 2 })
              .borderRadius(8)
              .border({ width: 1, color: $r('app.color.widget_accent') })
          }
        }
        .width('100%')
        .justifyContent(FlexAlign.SpaceBetween)
        .alignItems(VerticalAlign.Center)
      }
    }
    .width('100%')
    .height('100%')
    .padding(12)
  }

  build() {
    Column() {
      if (this.dimension === '1*2') {
        this.strip()
      } else {
        this.tile()
      }
    }
    .width('100%')
    .height('100%')
    .onClick(() => {
      postCardAction(this, {
        action: 'router',
        abilityName: 'EntryAbility',
        params: { target: 'schedule' },
      });
    })
  }
}
