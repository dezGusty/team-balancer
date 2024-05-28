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

  // store the latest 10 sources.
  protected readonly latestSources: string[] = [];

  public setLoadingFlag(flag: boolean, source: string = '') {
    this.loadingFlagSubject$.next(flag);

    this.latestSources.push(source);
    if (this.latestSources.length > 10) {
      this.latestSources.shift();
    }
  }

  constructor() { }

  public getRecentSources() {
    return this.latestSources;
  }

}