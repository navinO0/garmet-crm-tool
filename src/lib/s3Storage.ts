import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { bucketStorage } from './bucketStorage';

const endpoint = process.env.BACKUP_S3_ENDPOINT || 'https://t3.storageapi.dev';
const region = process.env.BACKUP_S3_REGION || 'auto';
const bucket = process.env.BACKUP_S3_BUCKET || 'balanced-duffel-s9so1bptd';
const accessKeyId = process.env.BACKUP_S3_ACCESS_KEY_ID || '';
const secretAccessKey = process.env.BACKUP_S3_SECRET_ACCESS_KEY || '';

export const s3Client = new S3Client({
  endpoint,
  region,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
  forcePathStyle: true,
});

export interface UploadResult {
  filename: string;
  url: string;
  bytes: number;
}

/**
 * Uploads generated Invoices and Agreements to S3 Bucket
 * Falls back gracefully to local bucket storage if S3 network call fails.
 */
export async function uploadInvoiceToS3(invoiceNumber: string, htmlContent: string): Promise<UploadResult> {
  const filename = `INVOICE_${invoiceNumber}_${Date.now()}.html`;
  const key = `invoices/${filename}`;

  try {
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: htmlContent,
      ContentType: 'text/html; charset=utf-8',
      ACL: 'public-read',
    });

    await s3Client.send(command);

    // Form S3 public URL
    const s3Url = `${endpoint.replace(/\/$/, '')}/${bucket}/${key}`;
    return {
      filename,
      url: s3Url,
      bytes: Buffer.byteLength(htmlContent, 'utf-8'),
    };
  } catch (error) {
    console.warn('S3 upload warning (falling back to local bucket):', error);
    return await bucketStorage.saveInvoice(invoiceNumber, htmlContent);
  }
}

export async function uploadAgreementToS3(orderNumber: string, htmlContent: string): Promise<UploadResult> {
  const filename = `AGREEMENT_${orderNumber}_${Date.now()}.html`;
  const key = `agreements/${filename}`;

  try {
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: htmlContent,
      ContentType: 'text/html; charset=utf-8',
      ACL: 'public-read',
    });

    await s3Client.send(command);

    const s3Url = `${endpoint.replace(/\/$/, '')}/${bucket}/${key}`;
    return {
      filename,
      url: s3Url,
      bytes: Buffer.byteLength(htmlContent, 'utf-8'),
    };
  } catch (error) {
    console.warn('S3 upload warning (falling back to local bucket):', error);
    return await bucketStorage.saveAgreement(orderNumber, htmlContent);
  }
}
