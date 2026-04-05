import type { DataReliability } from './contracts';

export type StatementDataOrigin =
  | 'BANK_FILE'
  | 'BROKER_FILE'
  | 'OCR_EXTRACTED'
  | 'PDF_TEXT_EXTRACTED'
  | 'USER_INFERRED'
  | 'SYSTEM_INFERRED';

export interface StatementParsingIssue {
  code:
    | 'UNRECOGNIZED_ROW'
    | 'MISSING_DATE'
    | 'MISSING_AMOUNT'
    | 'LOW_CONFIDENCE_OCR'
    | 'PARTIAL_DESCRIPTION';
  severity: 'info' | 'warning' | 'error';
  message: string;
}

export interface StatementProvenance {
  origin: StatementDataOrigin;
  reliability: DataReliability;
  parser: 'csv' | 'ofx' | 'pdf-text' | 'image-ocr';
  extractionMethod: 'structured' | 'regex' | 'ocr';
  confidence?: number;
  sourceFileName?: string;
  issues?: StatementParsingIssue[];
}