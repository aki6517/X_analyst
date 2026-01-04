"use client";

import { useState } from "react";
import Link from "next/link";

interface EngagementMetrics {
    impressionRate: number;
    likeRate: number;
    retweetRate: number;
    overallScore: "S" | "A" | "B" | "C";
}

function calculateEngagement(
    followerCount: number,
    impressionCount?: number,
    likeCount?: number,
    retweetCount?: number
): EngagementMetrics {
    const impressionRate = impressionCount
        ? (impressionCount / followerCount) * 100
        : 0;
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

    return { impressionRate, likeRate, retweetRate, overallScore };
}

export default function AnalyzePage() {
    const [postContent, setPostContent] = useState("");
    const [postUrl, setPostUrl] = useState("");
    const [followerCount, setFollowerCount] = useState<number>(0);
    const [impressionCount, setImpressionCount] = useState<number>(0);
    const [likeCount, setLikeCount] = useState<number>(0);
    const [retweetCount, setRetweetCount] = useState<number>(0);

    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<{
        patternType: string;
        analysis: {
            hook: string;
            structure: string;
            keywords: string[];
            strengthPoints: string[];
        };
    } | null>(null);

    const metrics =
        followerCount > 0
            ? calculateEngagement(followerCount, impressionCount, likeCount, retweetCount)
            : null;

    const handleAnalyze = async () => {
        if (!postContent.trim() || followerCount <= 0) return;

        setIsAnalyzing(true);
        setAnalysisResult(null);

        try {
            const response = await fetch("/api/analyze", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    postContent,
                    postUrl,
                    followerCount,
                    impressionCount: impressionCount || undefined,
                    likeCount: likeCount || undefined,
                    retweetCount: retweetCount || undefined,
                }),
            });

            const data = await response.json();
            if (data.success) {
                setAnalysisResult({
                    patternType: data.data.patternType,
                    analysis: data.data.analysis,
                });
            } else {
                alert("分析に失敗しました: " + (data.error?.message || "不明なエラー"));
            }
        } catch (error) {
            console.error(error);
            alert("通信エラーが発生しました");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const scoreColor = {
        S: "text-yellow-400",
        A: "text-green-400",
        B: "text-blue-400",
        C: "text-gray-400",
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
            <div className="container mx-auto px-4 py-12 max-w-2xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold text-white">📊 投稿分析</h1>
                    <Link
                        href="/"
                        className="text-purple-300 hover:text-white transition-colors"
                    >
                        ← 戻る
                    </Link>
                </div>

                {/* Input Form */}
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20 mb-8">
                    {/* Post Content */}
                    <div className="mb-6">
                        <label className="block text-blue-200 text-sm font-medium mb-2">
                            投稿本文 <span className="text-red-400">*</span>
                        </label>
                        <textarea
                            value={postContent}
                            onChange={(e) => setPostContent(e.target.value)}
                            placeholder="分析したい投稿の本文を貼り付けてください"
                            rows={5}
                            className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        />
                    </div>

                    {/* Post URL */}
                    <div className="mb-6">
                        <label className="block text-blue-200 text-sm font-medium mb-2">
                            投稿URL（任意）
                        </label>
                        <input
                            type="url"
                            value={postUrl}
                            onChange={(e) => setPostUrl(e.target.value)}
                            placeholder="https://x.com/username/status/..."
                            className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div>
                            <label className="block text-blue-200 text-sm font-medium mb-2">
                                フォロワー数 <span className="text-red-400">*</span>
                            </label>
                            <input
                                type="number"
                                value={followerCount || ""}
                                onChange={(e) => setFollowerCount(Number(e.target.value))}
                                min={1}
                                placeholder="500"
                                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-blue-200 text-sm font-medium mb-2">
                                インプレッション数
                            </label>
                            <input
                                type="number"
                                value={impressionCount || ""}
                                onChange={(e) => setImpressionCount(Number(e.target.value))}
                                min={0}
                                placeholder="50000"
                                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-blue-200 text-sm font-medium mb-2">
                                いいね数
                            </label>
                            <input
                                type="number"
                                value={likeCount || ""}
                                onChange={(e) => setLikeCount(Number(e.target.value))}
                                min={0}
                                placeholder="1200"
                                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-blue-200 text-sm font-medium mb-2">
                                リポスト数
                            </label>
                            <input
                                type="number"
                                value={retweetCount || ""}
                                onChange={(e) => setRetweetCount(Number(e.target.value))}
                                min={0}
                                placeholder="300"
                                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    {/* Analyze Button */}
                    <button
                        onClick={handleAnalyze}
                        disabled={!postContent.trim() || followerCount <= 0 || isAnalyzing}
                        className={`w-full py-4 rounded-lg font-semibold text-lg transition-all ${postContent.trim() && followerCount > 0 && !isAnalyzing
                                ? "bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg"
                                : "bg-gray-600 text-gray-400 cursor-not-allowed"
                            }`}
                    >
                        {isAnalyzing ? "分析中..." : "分析する"}
                    </button>
                </div>

                {/* Engagement Metrics Display */}
                {metrics && (
                    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-white/20 mb-8">
                        <h2 className="text-xl font-semibold text-white mb-4">
                            📈 エンゲージメント
                        </h2>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-blue-200 text-sm">
                                    インプレ/フォロワー:{" "}
                                    <span className="text-white font-bold">
                                        {metrics.impressionRate.toFixed(1)}倍
                                    </span>
                                </p>
                                <p className="text-blue-200 text-sm">
                                    いいね率:{" "}
                                    <span className="text-white font-bold">
                                        {metrics.likeRate.toFixed(2)}%
                                    </span>
                                    {"  "}リポスト率:{" "}
                                    <span className="text-white font-bold">
                                        {metrics.retweetRate.toFixed(2)}%
                                    </span>
                                </p>
                            </div>
                            <div
                                className={`text-5xl font-bold ${scoreColor[metrics.overallScore]}`}
                            >
                                {metrics.overallScore}
                            </div>
                        </div>
                    </div>
                )}

                {/* Analysis Result */}
                {analysisResult && (
                    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-white/20 mb-8">
                        <h2 className="text-xl font-semibold text-white mb-4">
                            🎯 分析結果
                        </h2>

                        <div className="mb-4">
                            <span className="inline-block px-3 py-1 bg-purple-600 text-white rounded-full text-sm font-medium">
                                {analysisResult.patternType}
                            </span>
                        </div>

                        <div className="space-y-4 text-blue-100">
                            <div>
                                <p className="text-sm text-blue-300 mb-1">フック</p>
                                <p>{analysisResult.analysis.hook}</p>
                            </div>
                            <div>
                                <p className="text-sm text-blue-300 mb-1">構造</p>
                                <p>{analysisResult.analysis.structure}</p>
                            </div>
                            <div>
                                <p className="text-sm text-blue-300 mb-1">キーワード</p>
                                <div className="flex flex-wrap gap-2">
                                    {analysisResult.analysis.keywords.map((kw, i) => (
                                        <span
                                            key={i}
                                            className="px-2 py-1 bg-white/10 rounded text-sm"
                                        >
                                            {kw}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <p className="text-sm text-blue-300 mb-1">強みポイント</p>
                                <ul className="list-disc list-inside">
                                    {analysisResult.analysis.strengthPoints.map((point, i) => (
                                        <li key={i}>{point}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* Rewrite Button */}
                        <Link
                            href={`/rewrite?pattern=${encodeURIComponent(analysisResult.patternType)}`}
                            className="mt-6 w-full flex items-center justify-center gap-2 py-4 rounded-lg font-semibold text-lg bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white shadow-lg transition-all"
                        >
                            ✍️ この型でリライトする →
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
