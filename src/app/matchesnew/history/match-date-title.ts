export interface MatchDateTitle {
  title: string;
  year: string;
  month: string;
  day: string;
  suffix?: string;

  fromString: (entry: string) => MatchDateTitle;
}

export function fromString(entry: string): MatchDateTitle {
  // The entry could be either in the form YYYY-MM-DD, or in the form YYYY-MM-DD_suffix.
  // Strip the optional suffix
  const suffixIndex = entry.indexOf('_');
  let dateEntry = entry;
  let suffix = '';
  if (suffixIndex >= 0) {
    suffix = entry.substring(suffixIndex + 1);
    dateEntry = entry.substring(0, suffixIndex);
  }
  const [year, month, day] = dateEntry.split('-');
  return { title: entry, year, month, day, suffix } as MatchDateTitle;
}

export function createDefaultMatchDateTitle(): MatchDateTitle {
  return fromString('1970-01-01_undef');
}

export namespace MatchDateTitle {
  export const DEFAULT = createDefaultMatchDateTitle();
}
