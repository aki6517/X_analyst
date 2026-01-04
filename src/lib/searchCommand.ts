/**
 * X (Twitter) 高度な検索コマンドを生成するユーティリティ
 */

export interface SearchParams {
    keyword: string;
    minFaves?: number;
    minRetweets?: number;
    sinceDate?: string; // YYYY-MM-DD
    untilDate?: string; // YYYY-MM-DD
    lang?: string;
}

/**
 * 検索パラメータからX検索コマンド文字列を生成
 */
export function generateSearchCommand(params: SearchParams): string {
    const parts: string[] = [];

    // キーワード
    if (params.keyword) {
        parts.push(params.keyword);
    }

    // 最小いいね数
    if (params.minFaves && params.minFaves > 0) {
        parts.push(`min_faves:${params.minFaves}`);
    }

    // 最小リポスト数
    if (params.minRetweets && params.minRetweets > 0) {
        parts.push(`min_retweets:${params.minRetweets}`);
    }

    // 開始日
    if (params.sinceDate) {
        parts.push(`since:${params.sinceDate}`);
    }

    // 終了日
    if (params.untilDate) {
        parts.push(`until:${params.untilDate}`);
    }

    // 言語（デフォルト: 日本語）
    if (params.lang) {
        parts.push(`lang:${params.lang}`);
    }

    return parts.join(" ");
}

/**
 * 検索コマンドからX検索URLを生成
 */
export function generateSearchUrl(command: string): string {
    const encodedQuery = encodeURIComponent(command);
    return `https://x.com/search?q=${encodedQuery}&src=typed_query&f=top`;
}

/**
 * 日付ヘルパー: 今日からN日前の日付を取得
 */
export function getDateNDaysAgo(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().split("T")[0]; // YYYY-MM-DD
}
