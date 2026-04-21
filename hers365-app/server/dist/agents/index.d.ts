export { WebScraperOrchestrator } from './web-scraper.js';
export { CodeAnalysisOrchestrator } from './code-analyzer.js';
export { RuntimeMonitorOrchestrator } from './runtime-monitor.js';
export { APITestingOrchestrator } from './api-tester.js';
export interface AgentStatus {
    webScraper: {
        running: boolean;
    };
    codeAnalyzer: {
        running: boolean;
    };
    runtimeMonitor: {
        running: boolean;
    };
    apiTester: {
        running: boolean;
    };
    timestamp: string;
}
declare class AgentOrchestrator {
    private webScraper;
    private codeAnalyzer;
    private runtimeMonitor;
    private apiTester;
    constructor();
    startAll(config?: {
        codePath?: string;
    }): void;
    stopAll(): void;
    getStatus(): AgentStatus;
}
declare const agentOrchestrator: AgentOrchestrator;
export default agentOrchestrator;
