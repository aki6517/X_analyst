import { NextRequest, NextResponse } from "next/server";

interface OEmbedResponse {
    html: string;
    author_name: string;
    author_url: string;
    url?: string;
}

interface SyndicationResponse {
    text?: string;
    full_text?: string;
    user?: {
        name: string;
        screen_name: string;
    };
    // 長文ツイート（280文字以上）のデータ構造
    // 実際のレスポンスでは note_tweet に id しか含まれない場合がある
    note_tweet?: {
        id?: string;
        note_tweet_results?: {
            result?: {
                text?: string;
                entity_set?: {
                    hashtags?: Array<{ text: string }>;
                    urls?: Array<{ url: string; expanded_url: string }>;
                };
            };
        };
    };
    // 通常ツイートのエンティティ情報
    entities?: {
        hashtags?: Array<{ text: string }>;
        urls?: Array<{ url: string; expanded_url: string }>;
    };
}

interface TweetData {
    text: string;
    authorName: string;
    authorHandle: string;
    tweetUrl: string;
}

/**
 * ツイートURLからツイート情報を取得
 * まずSyndication APIを試み、失敗時はoEmbedにフォールバック
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { url } = body;

        if (!url) {
            return NextResponse.json(
                { success: false, error: { message: "URLが必要です" } },
                { status: 400 }
            );
        }

        // URLからツイートIDを抽出（様々な形式に対応）
        // 対応形式: twitter.com, x.com, vxtwitter.com, fxtwitter.com など
        const normalizedUrl = url.replace(/^https?:\/\/(www\.)?(twitter|x|vxtwitter|fxtwitter|fixupx)\.com/, 'https://x.com');
        const tweetIdMatch = normalizedUrl.match(/status\/(\d+)/);
        if (!tweetIdMatch) {
            return NextResponse.json(
                { success: false, error: { message: "有効なX/TwitterのURLを入力してください" } },
                { status: 400 }
            );
        }

        const tweetId = tweetIdMatch[1];

        // 1. まずvxtwitter APIを試す（長文ツイート対応が良好）
        const vxtwitterResult = await fetchFromVxTwitter(tweetId, url);
        if (vxtwitterResult) {
            return NextResponse.json({
                success: true,
                data: vxtwitterResult,
            });
        }

        // 2. vxtwitter APIが失敗した場合、Syndication APIを試す
        const syndicationResult = await fetchFromSyndication(tweetId, url);
        if (syndicationResult) {
            return NextResponse.json({
                success: true,
                data: syndicationResult,
            });
        }

        // 3. 両方とも失敗した場合、oEmbedにフォールバック
        const oembedResult = await fetchFromOEmbed(url);
        if (oembedResult) {
            return NextResponse.json({
                success: true,
                data: oembedResult,
            });
        }

        return NextResponse.json(
            { success: false, error: { message: "ツイートを取得できませんでした。URLが正しいか確認してください。" } },
            { status: 404 }
        );

    } catch (error) {
        console.error("Tweet fetch error:", error);
        return NextResponse.json(
            { success: false, error: { message: "ツイートの取得中にエラーが発生しました" } },
            { status: 500 }
        );
    }
}

/**
 * vxtwitter APIからツイートを取得（長文ツイート対応が良好）
 */
async function fetchFromVxTwitter(tweetId: string, originalUrl: string): Promise<TweetData | null> {
    try {
        // vxtwitter の API エンドポイント
        const apiUrl = `https://api.vxtwitter.com/Twitter/status/${tweetId}`;

        const response = await fetch(apiUrl, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                "Accept": "application/json",
            },
            signal: AbortSignal.timeout(10000),
        });

        if (!response.ok) {
            console.log(`vxtwitter API returned ${response.status}`);
            return null;
        }

        const data = await response.json();

        console.log("🔍 vxtwitter Response:", JSON.stringify(data, null, 2));

        // vxtwitterのレスポンス構造を確認
        if (data.text && data.user_name && data.user_screen_name) {
            const text = normalizeText(data.text);
            console.log("✓ Using vxtwitter API");
            console.log(`📏 Text length: ${text.length} characters`);

            return {
                text,
                authorName: data.user_name,
                authorHandle: `@${data.user_screen_name}`,
                tweetUrl: originalUrl,
            };
        }

        return null;
    } catch (error) {
        console.error("vxtwitter API error:", error);
        return null;
    }
}

/**
 * Twitter Syndication APIからツイートを取得（全文対応）
 */
async function fetchFromSyndication(tweetId: string, originalUrl: string): Promise<TweetData | null> {
    const maxRetries = 3;
    const retryDelay = 1000; // 1秒

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            // Syndication API - react-tweetなどで使用されているエンドポイント
            const syndicationUrl = `https://cdn.syndication.twimg.com/tweet-result?id=${tweetId}&lang=ja&token=x`;

            const response = await fetch(syndicationUrl, {
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                    "Accept": "application/json",
                },
                // タイムアウト設定
                signal: AbortSignal.timeout(10000), // 10秒
            });

            if (!response.ok) {
                // 429 (Rate Limit) の場合はリトライ
                if (response.status === 429 && attempt < maxRetries - 1) {
                    console.log(`Rate limited, retrying after ${retryDelay}ms (attempt ${attempt + 1}/${maxRetries})`);
                    await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
                    continue;
                }
                console.error(`Syndication API returned ${response.status}`);
                return null;
            }

            const data: SyndicationResponse = await response.json();

            // デバッグ: レスポンス構造を確認
            console.log("📊 Syndication API Response Keys:", Object.keys(data));
            console.log("📝 Available text fields:", {
                hasNoteTweet: !!data.note_tweet,
                hasFullText: !!data.full_text,
                hasText: !!data.text,
            });

            // 完全なレスポンスをログ出力（デバッグ用）
            console.log("🔍 Full API Response:", JSON.stringify(data, null, 2));

            // note_tweet（長文ツイート）の場合はそちらから取得
            let text = "";
            if (data.note_tweet?.note_tweet_results?.result?.text) {
                text = data.note_tweet.note_tweet_results.result.text;
                console.log("✓ Long-form tweet detected (note_tweet)");
                console.log(`📏 Text length: ${text.length} characters`);
            } else if (data.full_text) {
                text = data.full_text;
                console.log("✓ Using full_text");
                console.log(`📏 Text length: ${text.length} characters`);
            } else if (data.text) {
                text = data.text;
                console.log("✓ Using text");
                console.log(`📏 Text length: ${text.length} characters`);
            }

            if (!text || !data.user) {
                console.error("Missing text or user data in Syndication response");
                console.log("📋 Full response:", JSON.stringify(data, null, 2));
                return null;
            }

            // URL情報をログ出力（デバッグ用）
            if (data.entities?.urls && data.entities.urls.length > 0) {
                console.log("🔗 URLs found:", data.entities.urls.length);
            }

            // テキストの正規化とURL除去
            text = normalizeText(text);

            // エンティティ情報を取得（note_tweetとtweetで異なる場所に格納されている）
            const urlEntities = data.note_tweet?.note_tweet_results?.result?.entity_set?.urls || data.entities?.urls;
            text = removeTwitterUrls(text, urlEntities);

            return {
                text,
                authorName: data.user.name,
                authorHandle: `@${data.user.screen_name}`,
                tweetUrl: originalUrl,
            };
        } catch (error) {
            console.error(`Syndication API error (attempt ${attempt + 1}/${maxRetries}):`, error);

            // 最後の試行でない場合はリトライ
            if (attempt < maxRetries - 1) {
                await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
                continue;
            }

            return null;
        }
    }

    return null;
}

/**
 * oEmbed APIからツイートを取得（フォールバック用）
 */
async function fetchFromOEmbed(url: string): Promise<TweetData | null> {
    try {
        const oembedUrl = `https://publish.twitter.com/oembed?url=${encodeURIComponent(url)}&omit_script=true`;

        const response = await fetch(oembedUrl);

        if (!response.ok) {
            return null;
        }

        const data: OEmbedResponse = await response.json();
        const text = extractTextFromHtml(data.html);

        const handleMatch = data.author_url.match(/(?:twitter\.com|x\.com)\/(\w+)/);
        const authorHandle = handleMatch ? `@${handleMatch[1]}` : "";

        return {
            text,
            authorName: data.author_name,
            authorHandle,
            tweetUrl: url,
        };
    } catch (error) {
        console.error("oEmbed API error:", error);
        return null;
    }
}

/**
 * oEmbedのHTMLからツイート本文を抽出
 */
function extractTextFromHtml(html: string): string {
    // blockquote内のすべてのpタグの内容を取得
    const pMatches = html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g);
    const textParts: string[] = [];

    for (const match of pMatches) {
        let text = match[1];

        // aタグ内のテキストを保持しながらタグを除去
        // まずaタグのhrefとテキストを抽出して置換
        text = text.replace(/<a[^>]*>([^<]*)<\/a>/g, "$1");

        // その他のHTMLタグを除去
        text = text.replace(/<[^>]+>/g, "");

        // HTMLエンティティをデコード
        text = text.replace(/&amp;/g, "&");
        text = text.replace(/&lt;/g, "<");
        text = text.replace(/&gt;/g, ">");
        text = text.replace(/&quot;/g, '"');
        text = text.replace(/&#39;/g, "'");
        text = text.replace(/&nbsp;/g, " ");
        text = text.replace(/&#x27;/g, "'");
        text = text.replace(/&#x2F;/g, "/");

        const trimmedText = text.trim();
        if (trimmedText) {
            textParts.push(trimmedText);
        }
    }

    // 複数の段落を改行で結合
    const result = textParts.join("\n\n");
    return normalizeText(result);
}

/**
 * テキストの正規化処理
 * - 余分な空白を削除
 * - 改行を正規化
 */
function normalizeText(text: string): string {
    if (!text) return "";

    return text
        // 連続する空白を1つにまとめる（改行以外）
        .replace(/[^\S\n]+/g, " ")
        // 3つ以上の連続する改行を2つにまとめる
        .replace(/\n{3,}/g, "\n\n")
        // 行頭・行末の空白を削除
        .split("\n")
        .map(line => line.trim())
        .join("\n")
        // 全体のトリム
        .trim();
}

/**
 * t.co短縮URLをテキストから除去
 * Twitter/Xは画像や引用ツイートのURLをt.coとして本文末尾に追加するため、
 * これらを除去してクリーンなテキストを取得
 */
function removeTwitterUrls(text: string, urls?: Array<{ url: string; expanded_url: string }>): string {
    if (!text) return "";

    let cleanedText = text;

    // t.coで終わるURLパターンを除去
    // 例: https://t.co/xxxxx
    cleanedText = cleanedText.replace(/https?:\/\/t\.co\/\w+\s*$/g, "");
    cleanedText = cleanedText.replace(/https?:\/\/t\.co\/\w+/g, (match) => {
        // URLが本文中に含まれている場合、展開されたURLに置き換えるか削除
        const urlInfo = urls?.find(u => u.url === match);
        if (urlInfo) {
            // 画像やツイートへのリンクは除去、外部リンクは保持
            const expanded = urlInfo.expanded_url;
            if (expanded.includes('/status/') || expanded.includes('/photo/') || expanded.includes('/video/')) {
                console.log(`🗑️  Removing media/tweet URL: ${match}`);
                return "";
            }
            // 外部リンクの場合は展開されたURLを保持
            console.log(`🔗 Expanding URL: ${match} -> ${expanded}`);
            return expanded;
        }
        // 情報がない場合は削除
        return "";
    });

    // URL除去後の余分な空白を削除
    cleanedText = cleanedText.replace(/\s+$/g, "").trim();

    return cleanedText;
}
