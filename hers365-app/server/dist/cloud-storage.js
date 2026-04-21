// Cloud storage service for video uploads and media
// Supports: AWS S3, Cloudflare R2, or any S3-compatible storage
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
const s3Client = new S3Client({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
});
const bucket = process.env.S3_BUCKET || 'hers365-media';
const cloudfrontUrl = process.env.CLOUDFRONT_URL || '';
export async function uploadVideo(file, filename, contentType) {
    const key = `videos/${Date.now()}-${filename}`;
    const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: file,
        ContentType: contentType,
    });
    await s3Client.send(command);
    const url = cloudfrontUrl ? `${cloudfrontUrl}/${key}` : `https://${bucket}.s3.amazonaws.com/${key}`;
    return { url, key };
}
export async function uploadImage(file, filename, contentType) {
    const key = `images/${Date.now()}-${filename}`;
    const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: file,
        ContentType: contentType,
    });
    await s3Client.send(command);
    const url = cloudfrontUrl ? `${cloudfrontUrl}/${key}` : `https://${bucket}.s3.amazonaws.com/${key}`;
    return { url, key };
}
export async function getSignedUploadUrl(key, contentType, expiresIn = 3600) {
    const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        ContentType: contentType,
    });
    return await getSignedUrl(s3Client, command, { expiresIn });
}
export async function getSignedDownloadUrl(key, expiresIn = 3600) {
    const command = new GetObjectCommand({
        Bucket: bucket,
        Key: key,
    });
    return await getSignedUrl(s3Client, command, { expiresIn });
}
//# sourceMappingURL=cloud-storage.js.map