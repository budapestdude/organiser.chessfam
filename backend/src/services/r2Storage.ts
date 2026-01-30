import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import crypto from 'crypto';

interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicUrl: string;
}

class R2StorageService {
  private client: S3Client | null = null;
  private config: R2Config | null = null;
  private isConfigured = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    const bucketName = process.env.R2_BUCKET_NAME;
    const publicUrl = process.env.R2_PUBLIC_URL;

    // If R2 is not configured, fall back to local storage
    if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
      console.warn('⚠️  R2 not configured. Image uploads will use local filesystem.');
      console.warn('   To use R2, set: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME');
      this.isConfigured = false;
      return;
    }

    // Check if public URL is provided
    if (!publicUrl) {
      console.error('❌ R2_PUBLIC_URL is required!');
      console.error('   Get it from: Cloudflare Dashboard → R2 → Your Bucket → Settings');
      console.error('   Look for "Public Development URL" and copy the full URL');
      console.error('   Example: https://pub-abc123.r2.dev');
      console.error('   Then set: R2_PUBLIC_URL=https://pub-abc123.r2.dev');
      console.warn('⚠️  Falling back to local filesystem storage.');
      this.isConfigured = false;
      return;
    }

    this.config = {
      accountId,
      accessKeyId,
      secretAccessKey,
      bucketName,
      publicUrl: publicUrl,
    };

    this.client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    this.isConfigured = true;
    console.log('✅ R2 storage configured successfully');
    console.log(`   Bucket: ${bucketName}`);
    console.log(`   Public URL: ${this.config.publicUrl}`);
  }

  /**
   * Check if R2 is configured and available
   */
  isEnabled(): boolean {
    return this.isConfigured;
  }

  /**
   * Generate a unique filename
   */
  private generateFilename(originalName: string): string {
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    const ext = originalName.substring(originalName.lastIndexOf('.'));
    return `${timestamp}-${randomString}${ext}`;
  }

  /**
   * Upload a file to R2
   */
  async uploadFile(
    file: Express.Multer.File,
    folder: string = 'images'
  ): Promise<{ url: string; key: string }> {
    if (!this.isConfigured || !this.client || !this.config) {
      throw new Error('R2 storage is not configured');
    }

    const filename = this.generateFilename(file.originalname);
    const key = `${folder}/${filename}`;

    const upload = new Upload({
      client: this.client,
      params: {
        Bucket: this.config.bucketName,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        // Make the file publicly accessible
        // Note: Your R2 bucket must have "Public Access" enabled
      },
    });

    await upload.done();

    const url = `${this.config.publicUrl}/${key}`;

    return { url, key };
  }

  /**
   * Upload file buffer directly (for files not from multer)
   */
  async uploadBuffer(
    buffer: Buffer,
    filename: string,
    mimetype: string,
    folder: string = 'images'
  ): Promise<{ url: string; key: string }> {
    if (!this.isConfigured || !this.client || !this.config) {
      throw new Error('R2 storage is not configured');
    }

    const generatedFilename = this.generateFilename(filename);
    const key = `${folder}/${generatedFilename}`;

    const command = new PutObjectCommand({
      Bucket: this.config.bucketName,
      Key: key,
      Body: buffer,
      ContentType: mimetype,
    });

    await this.client.send(command);

    const url = `${this.config.publicUrl}/${key}`;

    return { url, key };
  }

  /**
   * Delete a file from R2
   */
  async deleteFile(key: string): Promise<void> {
    if (!this.isConfigured || !this.client || !this.config) {
      throw new Error('R2 storage is not configured');
    }

    const command = new DeleteObjectCommand({
      Bucket: this.config.bucketName,
      Key: key,
    });

    await this.client.send(command);
  }

  /**
   * Get the public URL for a key
   */
  getPublicUrl(key: string): string {
    if (!this.config) {
      throw new Error('R2 storage is not configured');
    }
    return `${this.config.publicUrl}/${key}`;
  }
}

// Export singleton instance
export const r2Storage = new R2StorageService();
