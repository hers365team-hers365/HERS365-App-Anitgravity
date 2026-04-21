// H.E.R.S.365 AI Agents Index
// Orchestrates all 4 types of AI agents for comprehensive monitoring and testing
export { WebScraperOrchestrator } from './web-scraper.js';
export { CodeAnalysisOrchestrator } from './code-analyzer.js';
export { RuntimeMonitorOrchestrator } from './runtime-monitor.js';
export { APITestingOrchestrator } from './api-tester.js';
import { WebScraperOrchestrator } from './web-scraper.js';
import { CodeAnalysisOrchestrator } from './code-analyzer.js';
import { RuntimeMonitorOrchestrator } from './runtime-monitor.js';
import { APITestingOrchestrator } from './api-tester.js';
class AgentOrchestrator {
    constructor() {
        this.webScraper = new WebScraperOrchestrator();
        this.codeAnalyzer = new CodeAnalysisOrchestrator();
        this.runtimeMonitor = new RuntimeMonitorOrchestrator();
        this.apiTester = new APITestingOrchestrator();
        console.log('[AgentOrchestrator] Initializing all agents...');
    }
    startAll(config) {
        console.log('[AgentOrchestrator] Starting all agents...');
        this.webScraper.start();
        if (config?.codePath) {
            this.codeAnalyzer.runFullAnalysis(config.codePath);
        }
        this.runtimeMonitor.start();
        this.apiTester.start();
        console.log('[AgentOrchestrator] All agents started');
    }
    stopAll() {
        console.log('[AgentOrchestrator] Stopping all agents...');
        this.webScraper.stop();
        this.codeAnalyzer.stop();
        this.runtimeMonitor.stop();
        this.apiTester.stop();
    }
    getStatus() {
        return {
            webScraper: this.webScraper.getStatus(),
            codeAnalyzer: { running: false },
            runtimeMonitor: { running: false },
            apiTester: { running: false },
            timestamp: new Date().toISOString()
        };
    }
}
const agentOrchestrator = new AgentOrchestrator();
export default agentOrchestrator;
//# sourceMappingURL=index.js.map