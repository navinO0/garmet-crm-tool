import fs from 'fs';
import path from 'path';

export interface StorageBucketFile {
  filename: string;
  url: string;
  bytes: number;
}

/**
 * Storage Bucket abstraction for Invoices and Agreements.
 * Currently uses local filesystem bucket inside public/bucket for SQLite demo.
 * Can be swapped for S3/Supabase/Railway Storage Bucket in production.
 */
export class BucketStorage {
  private baseDir: string;

  constructor() {
    this.baseDir = path.join(process.cwd(), 'public', 'bucket');
    this.ensureDirectoryExists(this.baseDir);
    this.ensureDirectoryExists(path.join(this.baseDir, 'invoices'));
    this.ensureDirectoryExists(path.join(this.baseDir, 'agreements'));
  }

  private ensureDirectoryExists(dir: string) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  /** Save HTML/PDF content to invoice bucket */
  async saveInvoice(invoiceNumber: string, content: string): Promise<StorageBucketFile> {
    const filename = `INVOICE_${invoiceNumber}_${Date.now()}.html`;
    const filePath = path.join(this.baseDir, 'invoices', filename);
    await fs.promises.writeFile(filePath, content, 'utf-8');
    
    return {
      filename,
      url: `/bucket/invoices/${filename}`,
      bytes: Buffer.byteLength(content, 'utf-8'),
    };
  }

  /** Save HTML/PDF content to agreement bucket */
  async saveAgreement(orderNumber: string, content: string): Promise<StorageBucketFile> {
    const filename = `AGREEMENT_${orderNumber}_${Date.now()}.html`;
    const filePath = path.join(this.baseDir, 'agreements', filename);
    await fs.promises.writeFile(filePath, content, 'utf-8');

    return {
      filename,
      url: `/bucket/agreements/${filename}`,
      bytes: Buffer.byteLength(content, 'utf-8'),
    };
  }
}

export const bucketStorage = new BucketStorage();
