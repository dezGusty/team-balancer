import { Injectable } from "@angular/core";
import { BehaviorSubject, shareReplay } from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class LoadingFlagService {

  private loadingFlagSubject$ = new BehaviorSubject<boolean>(false);
  public readonly loadingFlag$ = this.loadingFlagSubject$.asObservable().pipe(
    shareReplay(1)
  );

  public setLoadingFlag(flag: boolean) {
    this.loadingFlagSubject$.next(flag);
  }

  constructor() { }

}