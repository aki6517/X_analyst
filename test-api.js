/**
 * ツイート取得APIのテストスクリプト
 *
 * 使い方:
 * node test-api.js "https://x.com/username/status/123456789"
 */

const testUrl = process.argv[2];

if (!testUrl) {
    console.error('❌ エラー: ツイートURLを指定してください');
    console.log('使い方: node test-api.js "https://x.com/username/status/123456789"');
    process.exit(1);
}

console.log('🔍 テスト開始...');
console.log(`📎 URL: ${testUrl}\n`);

async function testFetchTweet(url) {
    try {
        const startTime = Date.now();

        const response = await fetch('http://localhost:3001/api/fetch-tweet', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url }),
        });

        const endTime = Date.now();
        const duration = endTime - startTime;

        console.log(`⏱️  レスポンス時間: ${duration}ms`);
        console.log(`📊 ステータス: ${response.status} ${response.statusText}\n`);

        const data = await response.json();

        if (data.success) {
            console.log('✅ 取得成功！\n');
            console.log('📝 結果:');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log(`👤 著者名: ${data.data.authorName}`);
            console.log(`🏷️  ハンドル: ${data.data.authorHandle}`);
            console.log(`📏 文字数: ${data.data.text.length}文字`);
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('\n💬 本文:');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log(data.data.text);
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

            // 長文ツイート判定
            if (data.data.text.length > 280) {
                console.log('📏 長文ツイート（280文字以上）が正常に取得されました！');
            }
        } else {
            console.log('❌ 取得失敗\n');
            console.log(`エラー: ${data.error?.message || '不明なエラー'}`);
        }

    } catch (error) {
        console.error('❌ テスト失敗:', error.message);
        console.error('\n💡 ヒント:');
        console.error('- 開発サーバーが起動しているか確認してください (npm run dev)');
        console.error('- ポートが3001で起動しているか確認してください');
        process.exit(1);
    }
}

// テスト実行
testFetchTweet(testUrl);
