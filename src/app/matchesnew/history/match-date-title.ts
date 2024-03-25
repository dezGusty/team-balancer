export interface MatchDateTitle {
  title: string;
  year: string;
  month: string;
  day: string;

  fromString: (entry: string) => MatchDateTitle;
}

export function fromString(entry: string): MatchDateTitle {
  // The entry could be either in the form YYYY-MM-DD, or in the form YYYY-MM-DD_suffix.
  // Strip the optional suffix
  const suffixIndex = entry.indexOf('_');
  let dateEntry = entry;
  if (suffixIndex >= 0) {
    dateEntry = entry.substring(0, suffixIndex);
  }
  const [year, month, day] = dateEntry.split('-');
  return { title: dateEntry, year, month, day } as MatchDateTitle;
}