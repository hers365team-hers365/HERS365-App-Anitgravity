/**
 * Multi-Cloud Configuration
 * Supports: AWS, GCP, Azure for high-availability deployment
 */
export declare const cloudConfig: {
    provider: string;
    region: string;
    multiRegion: boolean;
    cdn: {
        enabled: boolean;
        provider: string;
    };
    database: {
        primary: string;
        replica: string | null;
    };
};
