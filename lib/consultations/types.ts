/** One member→practitioner share of one chart. Revoking sets revokedAt; sharing again clears it. */
export interface ShareSummary {
  id: string;
  chartId: string;
  practitionerId: string;
  createdAt: Date;
  revokedAt: Date | null;
}

/** A chart shared with the signed-in practitioner, as /consultations lists it. No birth data. */
export interface SharedChartSummary {
  shareId: string;
  chartId: string;
  chartName: string;
  sharedAt: Date;
}

/** A consultation message. Authors are identified by role in the thread, never by email. */
export interface ConsultationMessage {
  id: string;
  shareId: string;
  authorId: string;
  authorRole: 'owner' | 'practitioner';
  body: string;
  createdAt: Date;
}

/** Invalid input from the caller; a route turns it into 400 `{ error }`. */
export class ConsultationInputError extends Error {
  readonly status = 400;

  constructor(message: string) {
    super(message);
    this.name = 'ConsultationInputError';
  }
}
