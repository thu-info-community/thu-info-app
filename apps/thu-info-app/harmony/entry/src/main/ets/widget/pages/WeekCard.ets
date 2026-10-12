// "This week's schedule" card (4*4 / 6*4). The app process serializes the
// same time layout used by the in-app schedule, normalized after trimming
// leading and trailing empty time. Every occurrence remains in the card.
//
// Note: build() and @Builder bodies may only contain UI syntax (no local
// variable statements), so derived values live in member functions.
import {
  parseSnapshot,
  WidgetDayModel,
  WidgetItem,
  WidgetSnapshotModel,
  WidgetWeekBlockModel,
  WidgetWeekRowModel,
  WidgetWeekViewModel,
} from '../common/WidgetModels';

let cardStorage = new LocalStorage();

@Entry(cardStorage)
@Component
struct WeekCard {
  @LocalStorageProp('snapshot') snapshotText: string = '';
  @LocalStorageProp('dimension') dimension: string = '4*4';

  private snapshot(): WidgetSnapshotModel | null {
    return parseSnapshot(this.snapshotText);
  }

  private weekView(): WidgetWeekViewModel | null {
    const snapshot = this.snapshot();
    return snapshot === null || snapshot.weekView === undefined ? null : snapshot.weekView;
  }

  private days(): WidgetDayModel[] {
    const view = this.weekView();
    if (view !== null) {
      return view.days;
    }
    const snapshot = this.snapshot();
    return snapshot === null ? [] : snapshot.nextDays;
  }

  private week(): number {
    const view = this.weekView();
    if (view !== null) {
      return view.week;
    }
    const snapshot = this.snapshot();
    return snapshot === null ? 0 : snapshot.week;
  }

  private percentage(value: number): string {
    return `${Math.max(0, Math.min(100, value * 100))}%`;
  }

  private dayWidth(): string {
    return this.days().length === 0 ? '100%' : `${100 / this.days().length}%`;
  }

  private dayLeft(dayOfWeek: number): string {
    const days = this.days();
    for (let index = 0; index < days.length; index++) {
      if (days[index].dayOfWeek === dayOfWeek) {
        return `${index * 100 / days.length}%`;
      }
    }
    return '0%';
  }

  private isToday(day: WidgetDayModel): boolean {
    const snapshot = this.snapshot();
    return snapshot !== null && snapshot.today.date === day.date;
  }

  private showAxis(): boolean {
    return this.dimension === '6*4' && this.weekView() !== null;
  }

  // Form height grows by about 97 vp per launcher row (2 rows = 150 vp,
  // 4 rows = 344 vp). The header, headings and outer padding use about 68 vp.
  // This estimate is used only to choose text detail; positioning continues
  // to use percentages.
  private estimatedGridHeight(): number {
    const rows = this.dimension === '6*4' ? 6 : 4;
    return 150 + (rows - 2) * 97 - 68;
  }

  private estimatedBlockHeight(block: WidgetWeekBlockModel): number {
    return block.height * this.estimatedGridHeight();
  }

  // Detail degradation order: time, second location line, second name line,
  // then location. The name itself is always rendered with at least one line.
  private detailLevel(block: WidgetWeekBlockModel): number {
    const height = this.estimatedBlockHeight(block);
    if (height >= 54) {
      return 5;
    }
    if (height >= 40) {
      return 4;
    }
    if (height >= 30) {
      return 3;
    }
    if (height >= 20) {
      return 2;
    }
    return 1;
  }

  private nameLines(block: WidgetWeekBlockModel): number {
    return !block.compact && this.detailLevel(block) >= 3 ? 2 : 1;
  }

  private locationLines(block: WidgetWeekBlockModel): number {
    return this.detailLevel(block) >= 4 ? 2 : 1;
  }

  private showLocation(block: WidgetWeekBlockModel): boolean {
    return block.loc !== '' && !block.compact && this.detailLevel(block) >= 2;
  }

  private showBlockTime(block: WidgetWeekBlockModel): boolean {
    return block.timeLabel !== '' && !block.compact && this.detailLevel(block) >= 5;
  }

  private showAxisRowTimes(row: WidgetWeekRowModel): boolean {
    const view = this.weekView();
    return view !== null && view.showAxisTimes && row.height * this.estimatedGridHeight() >= 24;
  }

  private blockInset(block: WidgetWeekBlockModel): number {
    return this.estimatedBlockHeight(block) >= 10 ? 1 : 0;
  }

  private nameFontSize(block: WidgetWeekBlockModel): number {
    const available = Math.max(1, this.estimatedBlockHeight(block) - this.blockInset(block) * 2);
    return Math.min(this.dimension === '6*4' ? 10 : 9, available);
  }

  private secondaryFontSize(block: WidgetWeekBlockModel): number {
    return Math.max(5, Math.min(this.dimension === '6*4' ? 8 : 7, this.nameFontSize(block) - 1));
  }

  private openSchedule(): void {
    postCardAction(this, {
      action: 'router',
      abilityName: 'EntryAbility',
      params: { target: 'schedule' },
    });
  }

  @Builder
  header() {
    Row() {
      Text($r('app.string.widget_week_header'))
        .fontSize(14)
        .fontWeight(FontWeight.Bold)
        .fontColor($r('app.color.widget_text_primary'))
      Text($r('app.string.widget_week_label', this.week()))
        .fontSize(11)
        .fontColor($r('app.color.widget_text_secondary'))
    }
    .width('100%')
    .justifyContent(FlexAlign.SpaceBetween)
  }

  @Builder
  dayHeading(day: WidgetDayModel) {
    Column({ space: 1 }) {
      Text(day.label)
        .fontSize(this.dimension === '6*4' ? 10 : 9)
        .fontColor(this.isToday(day)
          ? $r('app.color.widget_accent')
          : $r('app.color.widget_text_secondary'))
        .maxLines(1)
      Column()
        .width(16)
        .height(2)
        .borderRadius(1)
        .backgroundColor(this.isToday(day)
          ? $r('app.color.widget_accent')
          : Color.Transparent)
      Text(day.date.replace('-', '/'))
        .fontSize(this.dimension === '6*4' ? 8 : 7)
        .fontColor($r('app.color.widget_text_tertiary'))
        .maxLines(1)
    }
    .layoutWeight(1)
  }

  @Builder
  dayHeadings() {
    Row() {
      if (this.showAxis()) {
        Blank()
          .width(38)
      }
      Row() {
        ForEach(this.days(), (day: WidgetDayModel) => {
          this.dayHeading(day)
        }, (day: WidgetDayModel) => `${day.dayOfWeek}-${day.date}`)
      }
      .layoutWeight(1)
    }
    .width('100%')
    .margin({ top: 5, bottom: 3 })
  }

  @Builder
  axisRow(row: WidgetWeekRowModel) {
    Column({ space: 0 }) {
      if (this.weekView()?.classPeriods && row.period !== undefined) {
        Text(`${row.period}`)
          .fontSize(9)
          .fontColor($r('app.color.widget_text_primary'))
          .maxLines(1)
        if (this.showAxisRowTimes(row)) {
          Text(row.begin)
            .fontSize(6)
            .fontColor($r('app.color.widget_text_secondary'))
            .maxLines(1)
          Text(row.end)
            .fontSize(6)
            .fontColor($r('app.color.widget_text_secondary'))
            .maxLines(1)
        }
      } else if (!this.weekView()?.classPeriods && row.kind === 'hour') {
        Text(row.begin)
          .fontSize(7)
          .fontColor($r('app.color.widget_text_secondary'))
          .maxLines(1)
      }
    }
    .width('100%')
    .height(this.percentage(row.height))
    .justifyContent(FlexAlign.Center)
    .alignItems(HorizontalAlign.Center)
    .position({ x: 0, y: this.percentage(row.top) })
  }

  @Builder
  timeAxis() {
    Stack({ alignContent: Alignment.TopStart }) {
      ForEach(this.weekView()?.rows ?? [], (row: WidgetWeekRowModel) => {
        this.axisRow(row)
      }, (row: WidgetWeekRowModel, index: number) =>
        `${index}-${row.kind}-${row.begin}`)
    }
    .width(38)
    .height('100%')
  }

  @Builder
  gridLine(row: WidgetWeekRowModel) {
    if (row.kind === 'hour' || row.kind === 'gap') {
      Divider()
        .width('100%')
        .color($r('app.color.widget_divider'))
        .position({ x: 0, y: this.percentage(row.top) })
    }
  }

  @Builder
  courseBlock(block: WidgetWeekBlockModel) {
    Column() {
      Column({ space: 0 }) {
        Text(block.name)
          .fontSize(this.nameFontSize(block))
          .lineHeight(this.nameFontSize(block))
          .fontWeight(FontWeight.Bold)
          .fontColor(block.textColor)
          .maxLines(this.nameLines(block))
          .textOverflow({ overflow: TextOverflow.Ellipsis })
        if (this.showBlockTime(block)) {
          Text(block.timeLabel)
            .fontSize(this.secondaryFontSize(block))
            .lineHeight(this.secondaryFontSize(block))
            .fontColor(block.textColor)
            .maxLines(1)
            .textOverflow({ overflow: TextOverflow.Ellipsis })
        }
        if (this.showLocation(block)) {
          Text(`@${block.loc}`)
            .fontSize(this.secondaryFontSize(block))
            .lineHeight(this.secondaryFontSize(block))
            .fontColor(block.textColor)
            .maxLines(this.locationLines(block))
            .textOverflow({ overflow: TextOverflow.Ellipsis })
        }
      }
      .width('100%')
      .height('100%')
      .padding({
        left: 2,
        right: 2,
        top: this.blockInset(block) + 1,
        bottom: this.blockInset(block),
      })
      .alignItems(HorizontalAlign.Start)
      .backgroundColor(block.fill)
      .borderRadius(3)
      .clip(true)
    }
    .width(this.dayWidth())
    .height(this.percentage(block.height))
    .padding(1)
    .position({ x: this.dayLeft(block.dayOfWeek), y: this.percentage(block.top) })
  }

  @Builder
  weekGrid() {
    Row() {
      if (this.showAxis()) {
        this.timeAxis()
      }
      Stack({ alignContent: Alignment.TopStart }) {
        ForEach(this.weekView()?.rows ?? [], (row: WidgetWeekRowModel) => {
          this.gridLine(row)
        }, (row: WidgetWeekRowModel, index: number) =>
          `line-${index}-${row.kind}-${row.begin}`)
        ForEach(this.weekView()?.blocks ?? [], (block: WidgetWeekBlockModel) => {
          this.courseBlock(block)
        }, (block: WidgetWeekBlockModel, index: number) =>
          `${index}-${block.dayOfWeek}-${block.begin}-${block.name}`)
      }
      .height('100%')
      .layoutWeight(1)
    }
    .width('100%')
    .height('100%')
    .alignItems(VerticalAlign.Top)
  }

  @Builder
  mirroredWeek() {
    Column() {
      this.header()
      this.dayHeadings()
      if ((this.weekView()?.blocks.length ?? 0) === 0) {
        Text($r('app.string.widget_empty_none_week'))
          .fontSize(12)
          .fontColor($r('app.color.widget_text_tertiary'))
          .layoutWeight(1)
      } else {
        Column() {
          this.weekGrid()
        }
        .width('100%')
        .layoutWeight(1)
      }
    }
    .width('100%')
    .height('100%')
  }

  @Builder
  legacyItemBlock(item: WidgetItem) {
    Column() {
      Text(item.name)
        .fontSize(7)
        .fontColor(Color.White)
        .maxLines(1)
        .textOverflow({ overflow: TextOverflow.Ellipsis })
    }
    .width('100%')
    .layoutWeight(1)
    .alignItems(HorizontalAlign.Start)
    .padding(2)
    .borderRadius(4)
    .backgroundColor(item.color)
  }

  @Builder
  legacyDayColumn(day: WidgetDayModel, index: number) {
    Column({ space: 2 }) {
      ForEach(day.items, (item: WidgetItem) => {
        this.legacyItemBlock(item)
      }, (item: WidgetItem, itemIndex: number) =>
        `${this.dimension}-${itemIndex}-${item.begin}-${item.name}`)
    }
    .layoutWeight(1)
    .width('100%')
    .alignItems(HorizontalAlign.Start)
    .padding(index === 0 ? 2 : 0)
    .backgroundColor(index === 0 ? $r('app.color.widget_today_bg') : Color.Transparent)
    .borderRadius(4)
  }

  @Builder
  legacyWeek() {
    Column() {
      this.header()
      Row() {
        ForEach(this.days(), (day: WidgetDayModel) => {
          Column({ space: 1 }) {
            Text(day.label)
              .fontSize(10)
              .fontColor($r('app.color.widget_text_secondary'))
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
          this.legacyDayColumn(day, index)
        }, (day: WidgetDayModel) => `${day.dayOfWeek}-${day.date}`)
      }
      .layoutWeight(1)
      .width('100%')
      .alignItems(VerticalAlign.Top)
    }
    .width('100%')
    .height('100%')
  }

  build() {
    Column() {
      if (this.snapshot() === null || this.snapshot()?.empty) {
        Text($r('app.string.widget_empty_hint'))
          .fontSize(12)
          .fontColor($r('app.color.widget_text_tertiary'))
      } else if (this.weekView() === null) {
        this.legacyWeek()
      } else {
        this.mirroredWeek()
      }
    }
    .width('100%')
    .height('100%')
    .padding(12)
    .onClick(() => {
      this.openSchedule();
    })
  }
}
