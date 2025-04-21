import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NotificationService } from './notification.service';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-notification',
    imports: [CommonModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
@for (notification of this.notifications$ | async; track $index) {
<div class='notification' [ngClass]='this.cssClassForIndex($index)'>
  {{notification.message}}
</div>
}
`,
    styles: `
.notification {
  position: absolute;
  background: #448888;
  color: #ffffff;
  display: inline-block;
  padding: 0.75em 1.25em;
  right: 2em;
  z-index: 10;
}
.notification-0 {bottom: 4em;}
.notification-1 {bottom: 8em;}
.notification-2 {bottom: 12em;}
.notification-3 {bottom: 16em;}
.notification-4 {bottom: 20em;}
.notification-5 {bottom: 24em;}
.notification-6 {bottom: 28em;}
.notification-7 {bottom: 32em;}
.notification-8 {bottom: 36em;}
.notification-9 {bottom: 40em;}

`
})
export class NotificationComponent {

  notifications$ = this.notificationService.notifications$;

  constructor(private notificationService: NotificationService) { }

  cssClassForIndex(index: number): string {
    return `notification-${index}`;
  }
}
