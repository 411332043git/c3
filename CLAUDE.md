# 匿名聊天室

一個不用登入的匿名聊天室,前端放在 GitHub Pages,即時傳訊最後用 Supabase 接上。

## 規則

- 開始任何工作前,先讀 `docs/architecture.md`。
- 目前在「階段一」:只做前端,用假資料(`mockChatService`),還不接 Supabase。
- 不可以把金鑰檔案 commit 進 git(`.env`、`.env.*`,只有 `.env.example` 可以 commit)。管理金鑰(service_role key)不可以出現在專案的任何地方。
