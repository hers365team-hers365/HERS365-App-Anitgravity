export interface ScrapedNews {
    title: string;
    url: string;
    source: string;
    publishedAt: string;
}
export interface SportsData {
    sport: string;
    data: any;
    source: string;
    timestamp: string;
}
export interface CompetitorInfo {
    name: string;
    url: string;
    description: string;
    features: string[];
}
declare abstract class BaseScraper {
    protected baseUrl: string;
    constructor(baseUrl: string);
}
export declare class FlagFootballNewsScraper extends BaseScraper {
    scrapeNews(): Promise<ScrapedNews[]>;
}
export declare class MaxPrepsEnhancer extends BaseScraper {
    enhanceData(): Promise<SportsData[]>;
}
export declare class ScholarshipFinder extends BaseScraper {
    findOpportunities(): Promise<any[]>;
}
export declare class CompetitorMonitor extends BaseScraper {
    monitorCompetitors(): Promise<CompetitorInfo[]>;
}
export declare class RecruitingTracker extends BaseScraper {
    trackRecruitingNews(): Promise<ScrapedNews[]>;
}
export declare class WebScraperOrchestrator {
    private running;
    start(): void;
    stop(): void;
    getStatus(): any;
}
export {};
