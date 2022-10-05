import { Directive, Input, Output, EventEmitter, HostListener } from '@angular/core';

@Directive({
  selector: '[copy-clipboard]'
})
export class CopyClipboardDirective {

  @Input('copy-clipboard')
  public payload: string = '';

  @Output('copied')
  public copied: EventEmitter<string> = new EventEmitter<string>();

  @HostListener('click', ['$event'])
  public onClick(event: MouseEvent): void {

    event.preventDefault();
    if (!this.payload) {
      return;
    }

    const listener = (e: ClipboardEvent) => {
      //todo:xxx
      const clipData = (window as { [key: string]: any })["clipboardData"] as DataTransfer;
      const clipboard = e.clipboardData || clipData;
      clipboard.setData('text', this.payload.toString());
      e.preventDefault();

      this.copied.emit(this.payload);
    };

    document.addEventListener('copy', listener, false)
    document.execCommand('copy');
    document.removeEventListener('copy', listener, false);
  }

}
