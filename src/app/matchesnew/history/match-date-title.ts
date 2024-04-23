export class MatchDateTitle {
  title: string;
  year: string;
  month: string;
  day: string;
  suffix?: string;

  fromString: (entry: string) => MatchDateTitle;
  constructor() {
    this.fromString = _fromString;
    this.title = '1970-01-01';
    this.year = '1970';
    this.month = '01';
    this.day = '01';
  }

  get date(): Date {
    return new Date(`${this.year}-${this.month}-${this.day}`);
  }
}

function _fromString(entry: string): MatchDateTitle {
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

export function toDate(match: MatchDateTitle): Date {
  return new Date(`${match.year}-${match.month}-${match.day}`);
}

export function createDefaultMatchDateTitle(): MatchDateTitle {
  return _fromString('1970-01-01_undef');
}

export namespace MatchDateTitle {
  export const DEFAULT = createDefaultMatchDateTitle();
  export function fromString(entry: string): MatchDateTitle {
    return _fromString(entry);
  }
}
