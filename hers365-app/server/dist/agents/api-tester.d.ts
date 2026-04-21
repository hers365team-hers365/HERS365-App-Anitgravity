export interface TestResult {
    endpoint: string;
    method: string;
    status: number;
    passed: boolean;
    duration: number;
}
export interface TestSuite {
    name: string;
    tests: TestResult[];
    passed: number;
    failed: number;
}
export declare class EndpointTester {
    private baseUrl;
    constructor(baseUrl?: string);
    testEndpoint(method: string, path: string): Promise<TestResult>;
}
export declare class RegressionTester {
    runRegressionTests(): Promise<TestSuite>;
}
export declare class APITestingOrchestrator {
    runFullTestSuite(): Promise<{
        regression: TestSuite;
    }>;
    start(): void;
    stop(): void;
}
