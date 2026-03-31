/**
 * MaxPreps Girls Flag Football Data Service
 *
 * MaxPreps does not have an official public API.
 * This service uses:
 *   1. MaxPreps internal JSON web API endpoints (used by their site)
 *   2. Cheerio HTML scraping as a fallback
 *   3. A normalized local schema so stats can be stored & verified in our DB
 *
 * All requests go through our backend to avoid CORS issues and to allow caching.
 */
export type MaxPrepsPlayer = {
    source: 'maxpreps';
    maxprepsId?: string;
    name: string;
    position: string;
    schoolName: string;
    schoolState: string;
    gradYear?: number;
    stats: MaxPrepsFlagFootballStats;
};
export type MaxPrepsFlagFootballStats = {
    passingAttempts?: number;
    passingCompletions?: number;
    passingYards?: number;
    passingTouchdowns?: number;
    passingInterceptions?: number;
    rushingAttempts?: number;
    rushingYards?: number;
    rushingTouchdowns?: number;
    receptions?: number;
    receivingYards?: number;
    receivingTouchdowns?: number;
    flagPulls?: number;
    interceptions?: number;
    sacksAllowed?: number;
    gamesPlayed?: number;
    season?: string;
};
export type MaxPrepsTeam = {
    source: 'maxpreps';
    teamId?: string;
    name: string;
    schoolGID?: string;
    city: string;
    state: string;
    record?: string;
    season?: string;
};
/**
 * Fetch top statistical leaders for girls flag football nationally.
 * MaxPreps structures stat leaders at: /api/sports/v2/stats/leaders
 */
export declare function fetchFlagFootballLeaders(statCategory?: 'receiving' | 'passing' | 'rushing' | 'defense', state?: string, season?: string): Promise<MaxPrepsPlayer[]>;
/**
 * Fetch a team's roster and season stats by MaxPreps school GID.
 */
export declare function fetchTeamRoster(schoolGID: string, season?: string): Promise<MaxPrepsPlayer[]>;
/**
 * Fetch team rankings/standings for a given state.
 */
export declare function fetchStateTeamRankings(state: string, season?: string): Promise<MaxPrepsTeam[]>;
/**
 * Search for a specific player by name + school/state.
 */
export declare function searchMaxPrepsPlayer(name: string, state?: string): Promise<MaxPrepsPlayer[]>;
/**
 * Fetch individual player career stats from MaxPreps profile page.
 */
export declare function fetchPlayerStats(maxprepsId: string): Promise<MaxPrepsFlagFootballStats | null>;
