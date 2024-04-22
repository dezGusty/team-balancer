import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Output, viewChild } from '@angular/core';

@Component({
  selector: 'app-summary',
  standalone: true,
  imports: [],
  templateUrl: './summary.component.html',
  styleUrl: './summary.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SummaryComponent {
  @Output() onCloseBtnClicked = new EventEmitter<void>();

  onSideNavInnerContainerClicked(event: Event) {
    event.stopPropagation();
  }

  onCloseBtnClick() {
    this.onCloseBtnClicked.emit();
  }

  tab1 = viewChild<ElementRef>('tab1');

  selectTable() {
    const el = this.tab1()?.nativeElement;

    let range: Range;
    let sel: Selection | null;
    if (document.createRange && window.getSelection) {
      range = document.createRange();
      sel = window.getSelection();
      if (!sel) {
        return;
      }
      sel.removeAllRanges();
      try {
        range.selectNodeContents(el);
        sel.addRange(range);
      } catch (e) {
        range.selectNode(el);
        sel.addRange(range);
      }
    }
  }

  onCopyBtnClick() {
    this.selectTable();
    // TODO(Augustin Preda, 2024-04-22): Use the Clipboard API when it is available in all browsers.
    document.execCommand('copy');
  }
}
