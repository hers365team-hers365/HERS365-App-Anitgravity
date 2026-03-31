export declare function assignArchetype(position: string, stats: any): Promise<string>;
export declare function generateBotName(): Promise<{
    botName: string;
    personality: string;
}>;
export declare function chatBot(botId: number, messages: any[], context: any): Promise<string>;
export declare function chatNIL(messages: any[]): Promise<string>;
export declare function generateTrainingPlan(position: string, age: number, level: string): Promise<any>;
export declare function supportChat(question: string, context?: any): Promise<string>;
export declare function curateFAQ(question: string, answer: string): Promise<any>;
