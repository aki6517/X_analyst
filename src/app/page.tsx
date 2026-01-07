"use client";

import { useState, useMemo } from "react";
import {
  generateSearchCommand,
  generateSearchUrl,
  getDateNDaysAgo,
} from "@/lib/searchCommand";
import Link from "next/link";

export default function Home() {
  const [keyword, setKeyword] = useState("");
  const [minFaves, setMinFaves] = useState<number>(100);
  const [minRetweets, setMinRetweets] = useState<number>(10);
  const [periodDays, setPeriodDays] = useState<number>(7);
  const [copied, setCopied] = useState(false);

  const searchCommand = useMemo(() => {
    if (!keyword.trim()) return "";
    return generateSearchCommand({
      keyword: keyword.trim(),
      minFaves,
      minRetweets,
      sinceDate: getDateNDaysAgo(periodDays),
      lang: "ja",
    });
  }, [keyword, minFaves, minRetweets, periodDays]);

  const searchUrl = useMemo(() => {
    if (!searchCommand) return "";
    return generateSearchUrl(searchCommand);
  }, [searchCommand]);

  const handleCopy = async () => {
    if (searchCommand) {
      await navigator.clipboard.writeText(searchCommand);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            🚀 X投稿 分析＆生成ツール
          </h1>
          <p className="text-purple-200">
            バズった投稿から学び、あなたの投稿を生成
          </p>
        </div>

        {/* Main Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* Analyze Card */}
          <Link
            href="/analyze"
            className="group bg-gradient-to-br from-blue-600/20 to-cyan-600/20 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-blue-400/30 hover:border-blue-400/50 transition-all hover:scale-105"
          >
            <div className="text-center">
              <div className="text-5xl mb-4">📊</div>
              <h2 className="text-2xl font-bold text-white mb-3">
                投稿を分析する
              </h2>
              <p className="text-blue-200 text-sm mb-4">
                バズった投稿のURLを貼り付けて、<br />
                成功パターンを分析
              </p>
              <div className="inline-flex items-center text-blue-300 group-hover:text-white transition-colors">
                <span>分析を始める</span>
                <span className="ml-2">→</span>
              </div>
            </div>
          </Link>

          {/* Generate Card */}
          <Link
            href="/rewrite"
            className="group bg-gradient-to-br from-orange-600/20 to-pink-600/20 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-orange-400/30 hover:border-orange-400/50 transition-all hover:scale-105"
          >
            <div className="text-center">
              <div className="text-5xl mb-4">✨</div>
              <h2 className="text-2xl font-bold text-white mb-3">
                投稿を生成する
              </h2>
              <p className="text-orange-200 text-sm mb-4">
                分析不要！型を選んで<br />
                すぐに投稿文を作成
              </p>
              <div className="inline-flex items-center text-orange-300 group-hover:text-white transition-colors">
                <span>生成を始める</span>
                <span className="ml-2">→</span>
              </div>
            </div>
          </Link>
        </div>

        {/* Divider */}
        <div className="flex items-center my-12">
          <div className="flex-1 h-px bg-white/20"></div>
          <span className="px-4 text-purple-200 font-semibold">
            バズっている投稿を探す
          </span>
          <div className="flex-1 h-px bg-white/20"></div>
        </div>

        {/* Search Form Card */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20">
          <h2 className="text-xl font-semibold text-white mb-6">
            検索条件を入力
          </h2>

          {/* Keyword */}
          <div className="mb-6">
            <label className="block text-purple-200 text-sm font-medium mb-2">
              キーワード / ジャンル
            </label>
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="例: マーケティング, プログラミング"
              className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Period */}
          <div className="mb-6">
            <label className="block text-purple-200 text-sm font-medium mb-2">
              期間
            </label>
            <select
              value={periodDays}
              onChange={(e) => setPeriodDays(Number(e.target.value))}
              className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value={7} className="bg-slate-800">過去7日間</option>
              <option value={14} className="bg-slate-800">過去14日間</option>
              <option value={30} className="bg-slate-800">過去30日間</option>
            </select>
          </div>

          {/* Engagement Thresholds */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-purple-200 text-sm font-medium mb-2">
                最小いいね数
              </label>
              <input
                type="number"
                value={minFaves}
                onChange={(e) => setMinFaves(Number(e.target.value))}
                min={0}
                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-purple-200 text-sm font-medium mb-2">
                最小リポスト数
              </label>
              <input
                type="number"
                value={minRetweets}
                onChange={(e) => setMinRetweets(Number(e.target.value))}
                min={0}
                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Generated Command */}
          {searchCommand && (
            <div className="mb-6">
              <label className="block text-purple-200 text-sm font-medium mb-2">
                生成された検索コマンド
              </label>
              <div className="relative">
                <div className="w-full px-4 py-3 pr-20 rounded-lg bg-slate-800 border border-white/20 text-green-400 font-mono text-sm break-all">
                  {searchCommand}
                </div>
                <button
                  onClick={handleCopy}
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-md transition-colors"
                >
                  {copied ? "コピー済!" : "コピー"}
                </button>
              </div>
            </div>
          )}

          {/* Search Button */}
          <a
            href={searchUrl || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className={`w-full flex items-center justify-center gap-2 py-4 rounded-lg font-semibold text-lg transition-all ${searchCommand
                ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-purple-500/25"
                : "bg-gray-600 text-gray-400 cursor-not-allowed"
              }`}
            onClick={(e) => !searchCommand && e.preventDefault()}
          >
            🔍 Xで検索する →
          </a>
          <p className="mt-3 text-center text-purple-300 text-sm">
            💡 良い投稿が見つかったら、上の「投稿を分析する」から分析できます
          </p>
        </div>
      </div>
    </div>
  );
}
