"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function RewriteContent() {
    const searchParams = useSearchParams();
    const patternFromUrl = searchParams.get("pattern") || "";

    const [patternType, setPatternType] = useState(patternFromUrl);
    const [userTheme, setUserTheme] = useState("");
    const [userElements, setUserElements] = useState<string[]>([]);
    const [newElement, setNewElement] = useState("");

    const [isGenerating, setIsGenerating] = useState(false);
    const [outputs, setOutputs] = useState<
        { patternType: string; content: string; characterCount: number }[]
    >([]);

    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

    useEffect(() => {
        if (patternFromUrl) {
            setPatternType(patternFromUrl);
        }
    }, [patternFromUrl]);

    const addElement = () => {
        if (newElement.trim() && !userElements.includes(newElement.trim())) {
            setUserElements([...userElements, newElement.trim()]);
            setNewElement("");
        }
    };

    const removeElement = (index: number) => {
        setUserElements(userElements.filter((_, i) => i !== index));
    };

    const handleGenerate = async () => {
        if (!userTheme.trim()) return;

        setIsGenerating(true);
        setOutputs([]);

        try {
            const response = await fetch("/api/rewrite", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    patternType: patternType || undefined,
                    userTheme,
                    userElements: userElements.length > 0 ? userElements : undefined,
                }),
            });

            const data = await response.json();
            if (data.success) {
                setOutputs(data.data.outputs);
            } else {
                alert("生成に失敗しました: " + (data.error?.message || "不明なエラー"));
            }
        } catch (error) {
            console.error(error);
            alert("通信エラーが発生しました");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCopy = async (content: string, index: number) => {
        await navigator.clipboard.writeText(content);
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    const patternOptions = [
        "共感ストーリー型",
        "有益情報型",
        "箇条書き型",
        "権威アピール型",
        "問いかけ型",
        "扇動型",
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-orange-900 to-slate-900">
            <div className="container mx-auto px-4 py-12 max-w-2xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold text-white">✍️ リライト生成</h1>
                    <Link
                        href="/analyze"
                        className="text-orange-300 hover:text-white transition-colors"
                    >
                        ← 分析に戻る
                    </Link>
                </div>

                {/* Input Form */}
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20 mb-8">
                    {/* Pattern Type */}
                    <div className="mb-6">
                        <label className="block text-orange-200 text-sm font-medium mb-2">
                            適用する型
                        </label>
                        <select
                            value={patternType}
                            onChange={(e) => setPatternType(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                        >
                            <option value="" className="bg-slate-800">
                                型を選択（任意）
                            </option>
                            {patternOptions.map((opt) => (
                                <option key={opt} value={opt} className="bg-slate-800">
                                    {opt}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* User Theme */}
                    <div className="mb-6">
                        <label className="block text-orange-200 text-sm font-medium mb-2">
                            あなたのテーマ <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="text"
                            value={userTheme}
                            onChange={(e) => setUserTheme(e.target.value)}
                            placeholder="例: プログラミング学習のコツ"
                            className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                    </div>

                    {/* User Elements */}
                    <div className="mb-6">
                        <label className="block text-orange-200 text-sm font-medium mb-2">
                            含めたい要素（複数可）
                        </label>
                        <div className="flex gap-2 mb-2">
                            <input
                                type="text"
                                value={newElement}
                                onChange={(e) => setNewElement(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && addElement()}
                                placeholder="例: 初心者向け"
                                className="flex-1 px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                            />
                            <button
                                onClick={addElement}
                                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
                            >
                                追加
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {userElements.map((el, i) => (
                                <span
                                    key={i}
                                    className="inline-flex items-center gap-1 px-3 py-1 bg-orange-600/30 text-orange-200 rounded-full text-sm"
                                >
                                    {el}
                                    <button
                                        onClick={() => removeElement(i)}
                                        className="hover:text-white"
                                    >
                                        ×
                                    </button>
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Generate Button */}
                    <button
                        onClick={handleGenerate}
                        disabled={!userTheme.trim() || isGenerating}
                        className={`w-full py-4 rounded-lg font-semibold text-lg transition-all ${userTheme.trim() && !isGenerating
                                ? "bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white shadow-lg"
                                : "bg-gray-600 text-gray-400 cursor-not-allowed"
                            }`}
                    >
                        {isGenerating ? "生成中..." : "リライトを生成"}
                    </button>
                </div>

                {/* Generated Outputs */}
                {outputs.length > 0 && (
                    <div className="space-y-6">
                        <h2 className="text-xl font-semibold text-white">📝 生成結果</h2>

                        {outputs.map((output, index) => (
                            <div
                                key={index}
                                className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-white/20"
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <span className="inline-block px-3 py-1 bg-orange-600 text-white rounded-full text-sm font-medium">
                                        {output.patternType}
                                    </span>
                                    <span className="text-orange-200 text-sm">
                                        {output.characterCount}文字
                                    </span>
                                </div>

                                <div className="bg-slate-800 rounded-lg p-4 mb-4">
                                    <p className="text-white whitespace-pre-wrap">
                                        {output.content}
                                    </p>
                                </div>

                                <button
                                    onClick={() => handleCopy(output.content, index)}
                                    className="w-full py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                                >
                                    {copiedIndex === index ? "コピーしました!" : "コピー"}
                                </button>
                            </div>
                        ))}

                        {/* Regenerate Button */}
                        <button
                            onClick={handleGenerate}
                            disabled={isGenerating}
                            className="w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg border border-white/20 transition-colors"
                        >
                            🔄 別パターンで再生成
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function RewritePage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-slate-900 via-orange-900 to-slate-900 flex items-center justify-center text-white">読み込み中...</div>}>
            <RewriteContent />
        </Suspense>
    );
}
