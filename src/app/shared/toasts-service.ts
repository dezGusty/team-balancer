import { Injectable, TemplateRef } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ToastService {
  toasts: any[] = [];

  show(textOrTpl: string | TemplateRef<any>, options: any = {}) {
    this.toasts.push({ textOrTpl, ...options });
  }

  showWithHeader(header: string, textOrTpl: string | TemplateRef<any>, options: any = {}) {
    let newToast = { header: header, textOrTpl, ...options };
    this.toasts.push(newToast);
  }

  remove(toast: any) {
    this.toasts = this.toasts.filter(t => t !== toast);
  }
}