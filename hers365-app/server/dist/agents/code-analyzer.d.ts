export interface BugReport {
    file: string;
    line?: number;
    severity: string;
    type: string;
    message: string;
}
export interface VulnerabilityReport {
    file: string;
    severity: string;
    cwe?: string;
    message: string;
}
export interface CodeQualityIssue {
    file: string;
    line?: number;
    rule: string;
    message: string;
}
export interface AnalysisResult {
    bugs: BugReport[];
    vulnerabilities: VulnerabilityReport[];
    quality: CodeQualityIssue[];
    timestamp: string;
}
export declare class StaticCodeAnalyzer {
    analyzeDirectory(dirPath: string): Promise<AnalysisResult>;
}
export declare class DependencyVulnerabilityScanner {
    checkDependencies(): Promise<VulnerabilityReport[]>;
}
export declare class CodeAnalysisOrchestrator {
    runFullAnalysis(_dirPath: string): Promise<AnalysisResult>;
    start(): void;
    stop(): void;
}
