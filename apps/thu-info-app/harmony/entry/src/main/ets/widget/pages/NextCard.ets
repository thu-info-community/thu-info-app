// "Next schedule item" card (1*2 / 2*2). The snapshot arrives as a JSON string
// via form binding data; the next item is picked card-side with the wall clock
// so it advances between provider pushes. Tap anywhere to open the schedule.
//
// Note: build() and @Builder bodies may only contain UI syntax (no local
// variable statements), so derived values live in member functions. All UI
// lives in member @Builder methods reading state through `this` — global
// builders with by-value params would not refresh on snapshot pushes.
import { parseSnapshot, pickNextItem, WidgetItem } from '../common/WidgetModels';

let cardStorage = new LocalStorage();

@Entry(cardStorage)
@Component
struct NextCard {
  @LocalStorageProp('snapshot') snapshotText: string = '';
  @LocalStorageProp('dimension') dimension: string = '2*2';

  private missing(): boolean {
    const snapshot = parseSnapshot(this.snapshotText);
    return snapshot === null || snapshot.empty;
  }

  private item(): WidgetItem | null {
    const snapshot = parseSnapshot(this.snapshotText);
    if (snapshot === null || snapshot.empty) {
      return null;
    }
    return pickNextItem(snapshot, Date.now());
  }

  private week(): number {
    const snapshot = parseSnapshot(this.snapshotText);
    return snapshot === null ? 0 : snapshot.week;
  }

  private ongoing(): boolean {
    const item = this.item();
    return item !== null && Date.now() >= item.begin;
  }

  // 1*2: one line — name and start time.
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
          Column()
            .width(3)
            .height('70%')
            .borderRadius(2)
            .backgroundColor(this.item()?.color ?? '#8B55E4')
          Text(this.item()?.name ?? '')
            .fontSize(13)
            .fontWeight(FontWeight.Bold)
            .fontColor($r('app.color.widget_text_primary'))
            .maxLines(1)
            .margin({ left: 6 })
            .layoutWeight(1)
          Text(this.item()?.from ?? '')
            .fontSize(13)
            .fontColor($r('app.color.widget_text_secondary'))
            .margin({ left: 6 })
        }
        .width('100%')
        .alignItems(VerticalAlign.Center)
      }
    }
    .width('100%')
    .height('100%')
    .padding({ left: 12, right: 12 })
    .justifyContent(FlexAlign.Center)
    .alignItems(HorizontalAlign.Start)
  }

  // 2*2: name, time range, location and a live "in progress" badge.
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
          Text($r('app.string.widget_week_label', this.week()))
            .fontSize(11)
            .fontColor($r('app.color.widget_text_secondary'))
        }
        .width('100%')
        .justifyContent(FlexAlign.SpaceBetween)

        Column() {
          Row() {
            Column()
              .width(4)
              .height('100%')
              .borderRadius(2)
              .backgroundColor(this.item()?.color ?? '#8B55E4')
            Text(this.item()?.name ?? '')
              .fontSize(17)
              .fontWeight(FontWeight.Bold)
              .fontColor($r('app.color.widget_text_primary'))
              .maxLines(2)
              .margin({ left: 8 })
          }
          .alignItems(VerticalAlign.Center)

          Text(`${this.item()?.from ?? ''} – ${this.item()?.to ?? ''}`)
            .fontSize(13)
            .fontColor($r('app.color.widget_text_secondary'))
            .margin({ top: 4 })
          if ((this.item()?.loc ?? '') !== '') {
            Text(this.item()?.loc ?? '')
              .fontSize(12)
              .fontColor($r('app.color.widget_text_tertiary'))
              .maxLines(1)
              .margin({ top: 2 })
          }
          if (this.ongoing()) {
            Text($r('app.string.widget_ongoing'))
              .fontSize(10)
              .fontColor($r('app.color.widget_accent'))
              .padding({ left: 6, right: 6, top: 2, bottom: 2 })
              .borderRadius(8)
              .border({ width: 1, color: $r('app.color.widget_accent') })
              .margin({ top: 6 })
          }
        }
        .layoutWeight(1)
        .justifyContent(FlexAlign.Center)
        .width('100%')
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
