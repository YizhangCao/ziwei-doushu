import type { BirthInfo } from '@/lib/ziwei/types';

/** A saved chart as lists show it: no birth data, so a list never has to decrypt anything. */
export interface ChartSummary {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

/** One saved chart with its decrypted birth data, for building the chart in the browser. */
export interface SavedChart extends ChartSummary {
  ownerId: string;
  birthInfo: BirthInfo;
}

export interface CreateChartInput {
  name: string;
  birthInfo: BirthInfo;
}

/** Invalid input from the caller; a route turns it into 400 `{ error }`. */
export class ChartInputError extends Error {
  readonly status = 400;

  constructor(message: string) {
    super(message);
    this.name = 'ChartInputError';
  }
}
