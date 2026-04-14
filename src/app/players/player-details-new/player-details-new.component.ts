
import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, EventEmitter, OnDestroy, Output, ViewChild, effect, inject, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Chart, ChartConfiguration, TooltipItem, registerables } from 'chart.js';
import { UserAuthService } from 'src/app/auth/user-auth.service';
import { Player, RecentEntry, RecentEntryType, getDisplayName } from 'src/app/shared/player.model';
import { PlayersService } from 'src/app/shared/players.service';

Chart.register(...registerables);

interface RatingHistoryPoint {
  label: string;
  date: string;
  rating: number;
  diff: number;
  type?: RecentEntryType;
}

@Component({
    selector: 'app-player-details-new',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './player-details-new.component.html',
    styleUrl: './player-details-new.component.css'
})
export class PlayerDetailsNewComponent implements AfterViewInit, OnDestroy {
  @Output() onCloseBtnClicked = new EventEmitter<void>();
  @Output() onSaveBtnClicked = new EventEmitter<void>();
  @Output() onMovePlayerToArchiveClicked = new EventEmitter<void>();
  @Output() onMovePlayerToActiveClicked = new EventEmitter<void>();
  @ViewChild('ratingHistoryChart') ratingHistoryChart?: ElementRef<HTMLCanvasElement>;

  private authSvc = inject(UserAuthService);
  private ratingChart?: Chart;
  private viewInitialized = false;

  player = model<Player>();
  playersSvc = inject(PlayersService);

  private readonly chartRenderEffect = effect(() => {
    this.player();
    this.scheduleChartRender();
  });

  ngAfterViewInit(): void {
    this.viewInitialized = true;
    this.scheduleChartRender();
  }

  ngOnDestroy(): void {
    this.destroyChart();
  }

  onSideNavInnerContainerClicked(event: Event) {
    event.stopPropagation();
  }

  onCloseBtnClick() {
    this.onCloseBtnClicked.emit();
  }

  onMovePlayerToArchive() {
    this.onMovePlayerToArchiveClicked.emit();
  }

  onMovePlayerToActive() {
    this.onMovePlayerToActiveClicked.emit();
  }

  async onSaveBtnClick() {
    const player = this.player();
    console.log("Save button clicked. Player is: ", player);
    if (player) {
      const existing = this.playersSvc.getPlayerById(player.id);
      if (existing) {
        const oldRating = existing.rating;
        this.playersSvc.updatePlayerById(player.id, player);
        this.playersSvc.addManualRatingEntry(player, oldRating, player.rating);
      } else {
        await this.playersSvc.addPlayer(player);
      }
    }

    this.onCloseBtnClicked.emit();
  }

  onRatingChanged() {
    this.scheduleChartRender();
  }

  public playerDisplayName(): string {
    const player = this.player();
    if (!player) {
      return '';
    }

    return getDisplayName(player);
  }

  public canEditPlayers(): boolean {
    return this.authSvc.isAuthenticatedAsOrganizer();
  }

  public canArchivePlayer(): boolean {
    let playerToArchive = this.player();
    if (!playerToArchive) {
      return false;
    }
    return this.authSvc.isAuthenticatedAsOrganizer() && (!playerToArchive.isArchived);
  }

  public canUnarchivePlayer(): boolean {
    let playerToArchive = this.player();
    if (!playerToArchive) {
      return false;
    }
    return this.authSvc.isAuthenticatedAsOrganizer() && playerToArchive.isArchived;
  }

  public hasRecentRatingHistory(): boolean {
    return this.getRatingHistoryPoints().length > 0;
  }

  public getRecentHistoryCaption(): string {
    const player = this.player();
    const count = player?.mostRecentMatches?.slice(0, 8).length ?? 0;
    if (count === 0) {
      return 'No recent rating history available yet.';
    }
    if (count === 1) {
      return 'Based on the most recent recorded match or manual edit.';
    }
    return `Based on the last ${count} recorded matches and edits.`;
  }

  public getCurrentRatingText(): string {
    const player = this.player();
    return player ? player.rating.toFixed(3) : '0.000';
  }

  private scheduleChartRender(): void {
    if (!this.viewInitialized) {
      return;
    }

    queueMicrotask(() => this.renderRatingHistoryChart());
  }

  private renderRatingHistoryChart(): void {
    const canvas = this.ratingHistoryChart?.nativeElement;
    const historyPoints = this.getRatingHistoryPoints();

    if (!canvas || historyPoints.length === 0) {
      this.destroyChart();
      return;
    }

    const docStyle = getComputedStyle(document.documentElement);
    const textColor = this.getCssColor(docStyle, '--gus-primary-text-color', '#dfe6ea');
    const gridColor = this.getCssColor(docStyle, '--gus-secondary-bck-color', 'rgba(120, 120, 120, 0.25)');
    const borderColor = this.getCssColor(docStyle, '--gus-impact-text-color', '#2bb7e2');
    const fillColor = `${borderColor}22`;

    this.destroyChart();

    const config: ChartConfiguration<'line'> = {
      type: 'line',
      data: {
        labels: historyPoints.map(point => point.label),
        datasets: [{
          data: historyPoints.map(point => point.rating),
          borderColor,
          backgroundColor: fillColor,
          fill: true,
          tension: 0.25,
          borderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: historyPoints.map(point => this.getPointColor(docStyle, point)),
          pointBorderColor: historyPoints.map(point => this.getPointColor(docStyle, point)),
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              title: (items: TooltipItem<'line'>[]) => {
                const point = historyPoints[items[0].dataIndex];
                return point.date;
              },
              label: (item: TooltipItem<'line'>) => {
                const point = historyPoints[item.dataIndex];
                return `Rating: ${point.rating.toFixed(3)}`;
              },
              afterLabel: (item: TooltipItem<'line'>) => {
                const point = historyPoints[item.dataIndex];
                if (point.diff === 0) {
                  return point.type ? `Change: 0.000 (${point.type})` : 'Change: 0.000';
                }

                const sign = point.diff > 0 ? '+' : '';
                const suffix = point.type ? ` (${point.type})` : '';
                return `Change: ${sign}${point.diff.toFixed(3)}${suffix}`;
              }
            }
          }
        },
        scales: {
          x: {
            ticks: {
              color: textColor,
              maxRotation: 0,
              autoSkip: true,
            },
            grid: {
              color: gridColor,
            }
          },
          y: {
            ticks: {
              color: textColor,
            },
            grid: {
              color: gridColor,
            }
          }
        }
      }
    };

    this.ratingChart = new Chart(canvas, config);
  }

  private destroyChart(): void {
    this.ratingChart?.destroy();
    this.ratingChart = undefined;
  }

  private getRatingHistoryPoints(): RatingHistoryPoint[] {
    const player = this.player();
    if (!player) {
      return [];
    }

    const entries = [...(player.mostRecentMatches ?? [])].slice(0, 8).reverse();
    if (entries.length === 0) {
      return [];
    }

    let runningRating = player.rating - entries.reduce((sum, entry) => sum + entry.diff, 0);
    const points: RatingHistoryPoint[] = [{
      label: 'Start',
      date: 'Before the shown history window',
      rating: +runningRating.toFixed(3),
      diff: 0,
    }];

    entries.forEach((entry, index) => {
      runningRating += entry.diff;
      points.push({
        label: this.getEntryLabel(entry, index, entries.length),
        date: entry.date,
        rating: +runningRating.toFixed(3),
        diff: entry.diff,
        type: entry.type,
      });
    });

    return points;
  }

  private getEntryLabel(entry: RecentEntry, index: number, totalCount: number): string {
    const shortDate = entry.date.length >= 10 ? entry.date.slice(5) : entry.date;
    if (index === totalCount - 1) {
      return `${shortDate} now`;
    }
    return shortDate;
  }

  private getPointColor(style: CSSStyleDeclaration, point: RatingHistoryPoint): string {
    if (point.label === 'Start') {
      return this.getCssColor(style, '--gus-secondary-text-color', '#9aa4b0');
    }

    switch (point.type) {
      case RecentEntryType.ManualEdit:
        return '#d8a31a';
      case RecentEntryType.Ignored:
      case RecentEntryType.NotPlayed:
        return this.getCssColor(style, '--gus-secondary-text-color', '#8a8f98');
      default:
        if (point.diff > 0) {
          return '#2ea043';
        }
        if (point.diff < 0) {
          return '#d73a49';
        }
        return this.getCssColor(style, '--gus-secondary-text-color', '#8a8f98');
    }
  }

  private getCssColor(style: CSSStyleDeclaration, variableName: string, fallback: string): string {
    return style.getPropertyValue(variableName).trim() || fallback;
  }
}
