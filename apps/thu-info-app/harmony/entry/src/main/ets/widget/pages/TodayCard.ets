// Recent courses card (2*4 / 4*4). It starts at the current or most recent
// course today, then fills the card with courses from the following days.
//
// Note: build() and @Builder bodies may only contain UI syntax (no local
// variable statements), so derived values live in member functions. All UI
// lives in member @Builder methods reading state through `this` — global
// builders with by-value params would not refresh on snapshot pushes.
import { parseSnapshot, WidgetDayModel, WidgetItem, WidgetSnapshotModel } from '../common/WidgetModels';

interface VisibleCourse {
  day: WidgetDayModel;
  item: WidgetItem;
}

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

  private currentDate(): string {
    const date = new Date();
    const month = `0${date.getMonth() + 1}`.slice(-2);
    const day = `0${date.getDate()}`.slice(-2);
    return `${month}-${day}`;
  }

  private day(): WidgetDayModel | null {
    const snapshot = this.snapshot();
    if (snapshot === null) {
      return null;
    }
    const date = this.currentDate();
    for (let i = 0; i < snapshot.nextDays.length; i++) {
      if (snapshot.nextDays[i].date === date) {
        return snapshot.nextDays[i];
      }
    }
    return null;
  }

  private dayDateText(): string {
    const day = this.day();
    if (day === null) {
      return '';
    }
    return day.dateText ?? `${day.date} ${day.label}`;
  }

  // These capacities keep every complete row readable at its card size.
  private capacity(): number {
    if (this.dimension === '4*4') {
      return 5;
    }
    return 4;
  }

  private visibleItems(): VisibleCourse[] {
    const snapshot = this.snapshot();
    if (snapshot === null) {
      return [];
    }
    const todayDate = this.currentDate();
    let todayIndex = -1;
    for (let i = 0; i < snapshot.nextDays.length; i++) {
      if (snapshot.nextDays[i].date === todayDate) {
        todayIndex = i;
        break;
      }
    }
    if (todayIndex < 0) {
      return [];
    }

    const courses: VisibleCourse[] = [];
    for (let d = todayIndex; d < snapshot.nextDays.length; d++) {
      const day = snapshot.nextDays[d];
      for (let i = 0; i < day.items.length; i++) {
        courses.push({ day: day, item: day.items[i] });
      }
    }
    const now = Date.now();
    let nextIndex = -1;
    for (let i = 0; i < courses.length; i++) {
      if (courses[i].item.end > now) {
        nextIndex = i;
        break;
      }
    }
    const todayCount = snapshot.nextDays[todayIndex].items.length;
    let start = nextIndex;
    if (nextIndex < 0) {
      start = todayCount - 1;
    } else if (courses[nextIndex].item.begin > now && nextIndex > 0 && nextIndex <= todayCount) {
      start = nextIndex - 1;
    }
    return start < 0 ? [] : courses.slice(start, start + this.capacity());
  }

  private locationText(item: WidgetItem, day: WidgetDayModel): string {
    if (day.date === this.currentDate()) {
      return item.loc;
    }
    const date = day.date.replace('-', '/');
    return item.loc === '' ? date : `${date} · ${item.loc}`;
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
  compactItemRow(item: WidgetItem, day: WidgetDayModel) {
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

      Text(this.locationText(item, day) === '' ? '—' : this.locationText(item, day))
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
  detailedItemRow(item: WidgetItem, day: WidgetDayModel) {
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
        if (this.locationText(item, day) !== '') {
          Text(this.locationText(item, day))
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
  itemRow(course: VisibleCourse) {
    if (this.dimension === '4*4') {
      this.detailedItemRow(course.item, course.day)
    } else {
      this.compactItemRow(course.item, course.day)
    }
  }

  @Builder
  scheduleRows() {
    Column() {
      Column({ space: this.dimension === '4*4' ? 2 : 1 }) {
        ForEach(this.visibleItems(), (course: VisibleCourse, index: number) => {
          this.itemRow(course)
        }, (course: VisibleCourse, index: number) =>
          `${this.dimension}-${index}-${course.item.begin}-${course.item.name}`)
      }
      .width('100%')
    }
    .width('100%')
    .height('100%')
    .justifyContent(FlexAlign.Start)
  }

  @Builder
  content() {
    Column() {
      if (this.missing()) {
        Text($r('app.string.widget_empty_hint'))
          .fontSize(12)
          .fontColor($r('app.color.widget_text_tertiary'))
      } else if (this.day() === null) {
        Text($r('app.string.widget_empty_hint'))
          .fontSize(12)
          .fontColor($r('app.color.widget_text_tertiary'))
      } else if (this.visibleItems().length === 0) {
        Text($r('app.string.widget_empty_none_followup'))
          .fontSize(12)
          .fontColor($r('app.color.widget_text_tertiary'))
      } else {
        Row() {
          Text($r('app.string.widget_today_header'))
            .fontSize(this.titleFontSize())
            .fontWeight(FontWeight.Bold)
            .fontColor($r('app.color.widget_text_primary'))
            .maxLines(1)
            .textOverflow({ overflow: TextOverflow.Ellipsis })
            .layoutWeight(1)
          Text(this.dayDateText())
            .fontSize(this.metaFontSize())
            .fontColor($r('app.color.widget_text_secondary'))
            .maxLines(1)
            .margin({ left: 6 })
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
    .justifyContent(FlexAlign.Start)
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
