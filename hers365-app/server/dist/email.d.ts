interface EmailOptions {
    to: string;
    subject: string;
    html: string;
    from?: string;
}
export declare function sendEmail({ to, subject, html, from }: EmailOptions): Promise<{
    success: boolean;
    data: {
        id: string;
    };
    error?: undefined;
} | {
    success: boolean;
    error: unknown;
    data?: undefined;
}>;
export declare function sendPasswordResetEmail(to: string, resetToken: string): Promise<{
    success: boolean;
    data: {
        id: string;
    };
    error?: undefined;
} | {
    success: boolean;
    error: unknown;
    data?: undefined;
}>;
export declare function sendWelcomeEmail(to: string, name: string): Promise<{
    success: boolean;
    data: {
        id: string;
    };
    error?: undefined;
} | {
    success: boolean;
    error: unknown;
    data?: undefined;
}>;
export {};
