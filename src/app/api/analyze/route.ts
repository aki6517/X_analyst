import { NextRequest, NextResponse } from "next/server";
import { getGeminiModel } from "@/lib/gemini";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { postContent, followerCount, impressionCount, likeCount, retweetCount } = body;

        // Validation
        if (!postContent || typeof postContent !== "string") {
            return NextResponse.json(
                { success: false, error: { code: "VALIDATION_ERROR", message: "postContent is required" } },
                { status: 400 }
            );
        }
        if (!followerCount || typeof followerCount !== "number" || followerCount <= 0) {
            return NextResponse.json(
                { success: false, error: { code: "VALIDATION_ERROR", message: "followerCount must be a positive number" } },
                { status: 400 }
            );
        }

        // Calculate engagement metrics
        const impressionRate = impressionCount ? (impressionCount / followerCount) * 100 : 0;
        const likeRate = likeCount ? (likeCount / followerCount) * 100 : 0;
        const retweetRate = retweetCount ? (retweetCount / followerCount) * 100 : 0;

        let overallScore: "S" | "A" | "B" | "C" = "C";
        if (impressionRate >= 100 || likeRate >= 5) {
            overallScore = "S";
        } else if (impressionRate >= 50 || likeRate >= 2) {
            overallScore = "A";
        } else if (impressionRate >= 20 || likeRate >= 1) {
            overallScore = "B";
        }

        // Get Gemini model
        let model;
        try {
            model = getGeminiModel();
        } catch (error) {
            console.error("Gemini initialization error:", error);
            return NextResponse.json(
                { success: false, error: { code: "CONFIG_ERROR", message: "Gemini APIキーが設定されていません。.env.localファイルにGEMINI_API_KEYを設定してください。" } },
                { status: 500 }
            );
        }

        // AI Analysis
        const prompt = `あなたはSNSマーケティングの専門家です。以下のX(Twitter)投稿を分析してください。

投稿本文:
"""
${postContent}
"""

投稿者情報:
- フォロワー数: ${followerCount}
${impressionCount ? `- インプレッション: ${impressionCount}` : ""}
${likeCount ? `- いいね: ${likeCount}` : ""}
${retweetCount ? `- リポスト: ${retweetCount}` : ""}
${impressionRate > 0 ? `- インプレッション/フォロワー比: ${impressionRate.toFixed(1)}倍` : ""}

以下のJSON形式で分析結果を返してください:
{
  "patternType": "投稿の型（共感ストーリー型、有益情報型、箇条書き型、権威アピール型、問いかけ型、扇動型 などから最も近いもの）",
  "analysis": {
    "hook": "冒頭のフック（読者を惹きつける要素）の説明",
    "structure": "投稿の構造（例: 問題提起 → 共感 → 解決策）",
    "keywords": ["効果的なキーワード1", "キーワード2", "キーワード3"],
    "emotionalTriggers": ["感情トリガー1", "感情トリガー2"],
    "strengthPoints": ["この投稿が伸びた理由1", "理由2", "理由3"]
  }
}

JSONのみを返してください。コードブロックは不要です。`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        // Parse JSON from response
        let analysisData;
        try {
            // Remove markdown code blocks if present
            const jsonMatch = responseText.match(/```json\n?([\s\S]*?)\n?```/) || responseText.match(/\{[\s\S]*\}/);
            const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : responseText;
            analysisData = JSON.parse(jsonStr);
        } catch {
            console.error("Failed to parse AI response:", responseText);
            analysisData = {
                patternType: "分析不可",
                analysis: {
                    hook: "解析できませんでした",
                    structure: "解析できませんでした",
                    keywords: [],
                    emotionalTriggers: [],
                    strengthPoints: [],
                },
            };
        }

        // Generate unique ID
        const analysisId = crypto.randomUUID();

        return NextResponse.json({
            success: true,
            data: {
                analysisId,
                engagementMetrics: {
                    impressionRate,
                    likeRate,
                    retweetRate,
                    overallScore,
                },
                patternType: analysisData.patternType,
                analysis: analysisData.analysis,
            },
        });
    } catch (error) {
        console.error("Analyze API error:", error);
        return NextResponse.json(
            { success: false, error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
            { status: 500 }
        );
    }
}
