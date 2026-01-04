import { NextRequest, NextResponse } from "next/server";
import { getGeminiModel } from "@/lib/gemini";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { patternType, userTheme, userElements } = body;

        // Validation
        if (!userTheme || typeof userTheme !== "string") {
            return NextResponse.json(
                { success: false, error: { code: "VALIDATION_ERROR", message: "userTheme is required" } },
                { status: 400 }
            );
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

        const elementsText = userElements && userElements.length > 0
            ? `含めたい要素: ${userElements.join("、")}`
            : "";

        const patternText = patternType
            ? `「${patternType}」のパターンで`
            : "様々なパターンで";

        const prompt = `あなたはX(Twitter)投稿のプロフェッショナルライターです。バズる投稿を作成する専門家です。

X(Twitter)投稿のリライトを生成してください。

テーマ: ${userTheme}
${elementsText}

${patternText}、以下の2つのパターンで投稿案を作成してください:
1. 共感・ストーリー型: 読者の共感を誘い、ストーリー性のある投稿
2. 有益・箇条書き型: 具体的で役立つ情報を箇条書きでまとめた投稿

各投稿は以下のルールを守ってください:
- 140文字以内（日本語）
- 絵文字を効果的に使用
- 読者が「いいね」や「リポスト」したくなるような内容
- 冒頭で興味を引くフックを入れる

以下のJSON形式で返してください:
{
  "outputs": [
    {
      "patternType": "共感ストーリー型",
      "content": "投稿内容をここに",
      "characterCount": 文字数
    },
    {
      "patternType": "有益情報型",
      "content": "投稿内容をここに",
      "characterCount": 文字数
    }
  ]
}

JSONのみを返してください。コードブロックは不要です。`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        // Parse JSON from response
        let rewriteData;
        try {
            // Remove markdown code blocks if present
            const jsonMatch = responseText.match(/```json\n?([\s\S]*?)\n?```/) || responseText.match(/\{[\s\S]*\}/);
            const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : responseText;
            rewriteData = JSON.parse(jsonStr);
        } catch {
            console.error("Failed to parse AI response:", responseText);
            rewriteData = {
                outputs: [
                    {
                        patternType: "生成失敗",
                        content: "投稿の生成に失敗しました。もう一度お試しください。",
                        characterCount: 0,
                    },
                ],
            };
        }

        // Generate unique ID
        const rewriteId = crypto.randomUUID();

        return NextResponse.json({
            success: true,
            data: {
                rewriteId,
                outputs: rewriteData.outputs,
            },
        });
    } catch (error) {
        console.error("Rewrite API error:", error);
        return NextResponse.json(
            { success: false, error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
            { status: 500 }
        );
    }
}
