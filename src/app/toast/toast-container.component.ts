import { NgFor, NgIf, NgTemplateOutlet } from '@angular/common';
import { Component, TemplateRef } from '@angular/core';
import { NgbToastModule } from '@ng-bootstrap/ng-bootstrap';
import { ToastService } from '../shared/toasts-service';


@Component({
  imports: [NgbToastModule, NgIf, NgFor, NgTemplateOutlet],
  selector: 'app-toasts',
  standalone: true,
  template: `
    <ngb-toast
      *ngFor="let toast of toastService.toasts"
      [class]="toast.classname"
      [autohide]="true"
      [delay]="toast.delay || 4000"
      [header]="toast.header"
      (hidden)="toastService.remove(toast)"
    >
      <ng-template [ngIf]="isTemplate(toast)" [ngIfElse]="text">
        <ng-template [ngbToastHeader] [ngTemplateOutlet]="toast.textOrTpl"></ng-template>
      </ng-template>

      <ng-template #text>{{ toast.textOrTpl }}</ng-template>
    </ngb-toast>
  `,
  host: { 'class': 'toast-container end-0 p-3', 'style': 'position: fixed; z-index: 1200; top: auto; bottom: 5vh; right: 5rem;' }
})
export class ToastsContainer {
  constructor(public toastService: ToastService) { }

  isTemplate(toast: any) { return toast.textOrTpl instanceof TemplateRef; }
}