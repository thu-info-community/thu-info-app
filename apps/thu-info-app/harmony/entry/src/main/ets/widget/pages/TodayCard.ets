// "Today's schedule" card (2*4 / 4*4). Overflow is clipped to a window that
// always contains the ongoing item, or the next item when nothing is ongoing.
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

  private missing(): boolean {
    const snapshot = this.snapshot();
    return snapshot === null || snapshot.empty;
  }

  private day(): WidgetDayModel {
    const snapshot = this.snapshot();
    return snapshot === null
      ? { dayOfWeek: 1, date: '', label: '', items: [] }
      : snapshot.today;
  }

  // These capacities keep every complete row readable at its card size.
  private capacity(): number {
    if (this.dimension === '4*4') {
      return 5;
    }
    return 4;
  }

  private overflowing(): boolean {
    return this.day().items.length > this.capacity();
  }

  private automaticFocusIndex(): number {
    const items = this.day().items;
    if (items.length === 0) {
      return -1;
    }
    const now = Date.now();
    for (let i = 0; i < items.length; i++) {
      if (items[i].begin <= now && now < items[i].end) {
        return i;
      }
    }
    for (let i = 0; i < items.length; i++) {
      if (items[i].begin > now) {
        return i;
      }
    }
    return items.length - 1;
  }

  private windowStart(): number {
    if (!this.overflowing()) {
      return 0;
    }
    const maximumStart = this.day().items.length - this.capacity();
    const itemsBeforeFocus = Math.floor((this.capacity() - 1) / 2);
    const desiredStart = this.automaticFocusIndex() - itemsBeforeFocus;
    return Math.max(0, Math.min(desiredStart, maximumStart));
  }

  private visibleItems(): WidgetItem[] {
    const items = this.day().items;
    if (!this.overflowing()) {
      return items;
    }
    return items.slice(this.windowStart(), this.windowStart() + this.capacity());
  }

  private titleFontSize(): number {
    return this.dimension === '4*4' ? 18 : 16;
  }

  private metaFontSize(): number {
    return this.dimension === '4*4' ? 14 : 12;
  }

  private nameFontSize(): number {
    return this.dimension === '4*4' ? 16 : 12;
  }

  private locationFontSize(): number {
    return this.dimension === '4*4' ? 13 : 11;
  }

  private startTimeFontSize(): number {
    return this.dimension === '4*4' ? 14 : 11;
  }

  private endTimeFontSize(): number {
    return this.dimension === '4*4' ? 13 : 10;
  }

  private ongoing(item: WidgetItem): boolean {
    const now = Date.now();
    return item.begin <= now && now < item.end;
  }

  private openSchedule(): void {
    postCardAction(this, {
      action: 'router',
      abilityName: 'EntryAbility',
      params: { target: 'schedule' },
    });
  }

  @Builder
  compactItemRow(item: WidgetItem) {
    Row() {
      Column()
        .width(3)
        .height(18)
        .borderRadius(2)
        .backgroundColor(item.color)

      Text(item.name)
        .fontSize(this.nameFontSize())
        .fontWeight(FontWeight.Medium)
        .fontColor($r('app.color.widget_text_primary'))
        .maxLines(1)
        .textOverflow({ overflow: TextOverflow.Ellipsis })
        .layoutWeight(4)
        .margin({ left: 5 })

      Text(item.loc === '' ? '—' : item.loc)
        .fontSize(this.locationFontSize())
        .fontColor($r('app.color.widget_text_tertiary'))
        .maxLines(1)
        .textOverflow({ overflow: TextOverflow.Ellipsis })
        .layoutWeight(3)
        .margin({ left: 6 })

      Text(`${item.from}–${item.to}`)
        .fontSize(this.startTimeFontSize())
        .fontColor($r('app.color.widget_text_secondary'))
        .maxLines(1)
        .width(90)
        .textAlign(TextAlign.End)
        .margin({ left: 6 })
    }
    .width('100%')
    .height(24)
    .padding({ left: 3, right: 3 })
    .alignItems(VerticalAlign.Center)
    .backgroundColor(this.ongoing(item) ? $r('app.color.widget_today_bg') : Color.Transparent)
    .borderRadius(7)
  }

  @Builder
  detailedItemRow(item: WidgetItem) {
    Row() {
      Column()
        .width(4)
        .alignSelf(ItemAlign.Stretch)
        .borderRadius(2)
        .backgroundColor(item.color)

      Column({ space: 2 }) {
        Text(item.name)
          .fontSize(this.nameFontSize())
          .fontWeight(FontWeight.Medium)
          .fontColor($r('app.color.widget_text_primary'))
          .maxLines(2)
          .textOverflow({ overflow: TextOverflow.Ellipsis })
        if (item.loc !== '') {
          Text(item.loc)
            .fontSize(this.locationFontSize())
            .fontColor($r('app.color.widget_text_tertiary'))
            .maxLines(2)
            .textOverflow({ overflow: TextOverflow.Ellipsis })
        }
      }
      .alignItems(HorizontalAlign.Start)
      .layoutWeight(3)
      .margin({ left: 6 })

      Column({ space: 2 }) {
        Text(item.from)
          .fontSize(this.startTimeFontSize())
          .fontWeight(FontWeight.Medium)
          .fontColor($r('app.color.widget_text_primary'))
          .maxLines(1)
        Text(item.to)
          .fontSize(this.endTimeFontSize())
          .fontColor($r('app.color.widget_text_secondary'))
          .maxLines(1)
      }
      .alignItems(HorizontalAlign.End)
      .layoutWeight(2)
      .margin({ left: 6 })
    }
    .width('100%')
    .padding({ left: 4, right: 4, top: 3, bottom: 3 })
    .alignItems(VerticalAlign.Center)
    .backgroundColor(this.ongoing(item) ? $r('app.color.widget_today_bg') : Color.Transparent)
    .borderRadius(8)
  }

  @Builder
  itemRow(item: WidgetItem) {
    if (this.dimension === '4*4') {
      this.detailedItemRow(item)
    } else {
      this.compactItemRow(item)
    }
  }

  @Builder
  scheduleRows() {
    Column() {
      Column({ space: this.dimension === '4*4' ? 2 : 1 }) {
        ForEach(this.visibleItems(), (item: WidgetItem, index: number) => {
          this.itemRow(item)
        }, (item: WidgetItem, index: number) =>
          `${this.dimension}-${this.windowStart() + index}-${item.begin}-${item.name}`)
      }
      .width('100%')
    }
    .width('100%')
    .height('100%')
    .justifyContent(FlexAlign.Center)
  }

  @Builder
  content() {
    Column() {
      if (this.missing()) {
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
            .fontSize(this.titleFontSize())
            .fontWeight(FontWeight.Bold)
            .fontColor($r('app.color.widget_text_primary'))
          Text(`${this.day().date} ${this.day().label}`)
            .fontSize(this.metaFontSize())
            .fontColor($r('app.color.widget_text_secondary'))
            .maxLines(1)
        }
        .width('100%')
        .justifyContent(FlexAlign.SpaceBetween)

        Column() {
          this.scheduleRows()
        }
        .width('100%')
        .layoutWeight(1)
        .margin({ top: 4 })
      }
    }
    .width('100%')
    .height('100%')
    .padding({ left: 12, right: 12, top: 12, bottom: 12 })
    .justifyContent(FlexAlign.Center)
    .alignItems(HorizontalAlign.Start)
    .onClick(() => {
      this.openSchedule();
    })
  }

  build() {
    Column() {
      this.content()
    }
    .width('100%')
    .height('100%')
  }
}
