export interface UploadResult {
    url: string;
    key: string;
}
export declare function uploadVideo(file: Buffer, filename: string, contentType: string): Promise<UploadResult>;
export declare function uploadImage(file: Buffer, filename: string, contentType: string): Promise<UploadResult>;
export declare function getSignedUploadUrl(key: string, contentType: string, expiresIn?: number): Promise<string>;
export declare function getSignedDownloadUrl(key: string, expiresIn?: number): Promise<string>;
