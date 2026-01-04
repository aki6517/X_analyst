// 共通の型定義

// 検索パラメータ
export interface SearchParams {
    keyword: string;
    minFaves?: number;
    minRetweets?: number;
    sinceDate?: string;
    untilDate?: string;
    lang?: string;
}

// 投稿分析リクエスト
export interface AnalyzeRequest {
    postContent: string;
    postUrl?: string;
    followerCount: number;
    impressionCount?: number;
    likeCount?: number;
    retweetCount?: number;
}

// エンゲージメント指標
export interface EngagementMetrics {
    impressionRate: number; // インプレッション / フォロワー * 100
    likeRate: number;       // いいね / フォロワー * 100
    retweetRate: number;    // リポスト / フォロワー * 100
    overallScore: "S" | "A" | "B" | "C";
}

// 分析結果
export interface AnalysisResult {
    analysisId: string;
    engagementMetrics: EngagementMetrics;
    patternType: string;
    analysis: {
        hook: string;
        structure: string;
        keywords: string[];
        emotionalTriggers: string[];
        strengthPoints: string[];
    };
}

// リライトリクエスト
export interface RewriteRequest {
    analysisId?: string;
    patternType?: string;
    userTheme: string;
    userElements?: string[];
    outputPatterns?: string[];
}

// リライト出力
export interface RewriteOutput {
    patternType: string;
    content: string;
    characterCount: number;
}

// リライト結果
export interface RewriteResult {
    rewriteId: string;
    outputs: RewriteOutput[];
}

// API レスポンス共通型
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
    };
}
