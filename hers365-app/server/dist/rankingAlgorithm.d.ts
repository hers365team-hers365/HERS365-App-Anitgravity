export interface AthleteData {
    id: number;
    name: string;
    state: string;
    highSchool: string;
    graduationYear: number;
    position: string;
    combineStats?: CombineStats;
    maxPrepsStats?: MaxPrepsStats;
    zybekStats?: ZybekStats;
    usaTalentIdStats?: USATalentIdStats;
    otherStats?: OtherSourceStats;
}
export interface CombineStats {
    fortyYardDash?: number;
    threeConeDrill?: number;
    shuttleRun?: number;
    verticalJump?: number;
    broadJump?: number;
    benchPress?: number;
    sixtyYardDash?: number;
    routeRunning?: number;
    catching?: number;
    throwingAccuracy?: number;
    throwingPower?: number;
    eventId: string;
    eventDate: string;
}
export interface MaxPrepsStats {
    totalTackles?: number;
    totalSacks?: number;
    interceptions?: number;
    passingYards?: number;
    rushingYards?: number;
    receivingYards?: number;
    totalTouchdowns?: number;
    gamesPlayed: number;
    schoolYear: string;
    verified: boolean;
}
export interface ZybekStats {
    fortyYardDash?: number;
    shuttleRun?: number;
    threeConeDrill?: number;
    verticalJump?: number;
    broadJump?: number;
    powerThrow?: number;
    accuracy?: number;
    eventName: string;
    eventDate: string;
    verified: boolean;
}
export interface USATalentIdStats {
    overallRating?: number;
    speedRating?: number;
    agilityRating?: number;
    strengthRating?: number;
    techniqueRating?: number;
    eventName: string;
    eventDate: string;
    verified: boolean;
}
export interface OtherSourceStats {
    sourceName: string;
    stats: Record<string, number | string>;
    eventDate: string;
    verified: boolean;
}
export declare const RANKING_WEIGHTS: {
    combine: {
        fortyYardDash: number;
        threeConeDrill: number;
        shuttleRun: number;
        verticalJump: number;
        broadJump: number;
        routeRunning: number;
        catching: number;
        throwingAccuracy: number;
        throwingPower: number;
    };
    maxPreps: {
        pointsPerGame: number;
        tacklesPerGame: number;
        sacksPerGame: number;
        interceptionsPerGame: number;
        touchdowns: number;
        verified: number;
    };
    zybek: {
        fortyYardDash: number;
        shuttleRun: number;
        threeConeDrill: number;
        verticalJump: number;
        broadJump: number;
        powerThrow: number;
        accuracy: number;
        verified: number;
    };
    usaTalentId: {
        overallRating: number;
        speedRating: number;
        agilityRating: number;
        strengthRating: number;
        techniqueRating: number;
        verified: number;
    };
};
export declare function normalizeValue(value: number, min: number, max: number, lowerIsBetter?: boolean): number;
export declare function calculateCombineScore(stats: CombineStats | undefined): number;
export declare function calculateMaxPrepsScore(stats: MaxPrepsStats | undefined): number;
export declare function calculateZybekScore(stats: ZybekStats | undefined): number;
export declare function calculateUSATalentIdScore(stats: USATalentIdStats | undefined): number;
export declare function calculateRankingScore(athlete: AthleteData): {
    overallScore: number;
    combineScore: number;
    maxPrepsScore: number;
    zybekScore: number;
    usaTalentIdScore: number;
    dataSources: string[];
};
export declare function getRankingTier(score: number): string;
export declare function getTierColor(tier: string): string;
