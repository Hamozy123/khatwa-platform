declare module 'pdfkit' {
  interface PDFDocumentOptions {
    margin?: number;
    size?: string | [number, number];
  }
  class PDFDocument {
    constructor(options?: PDFDocumentOptions);
    on(event: string, callback: (...args: any[]) => void): this;
    fontSize(size: number): this;
    text(text: string, options?: any): this;
    moveDown(n?: number): this;
    end(): void;
  }
  export = PDFDocument;
}
