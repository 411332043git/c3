import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages 的網址是 https://<帳號>.github.io/<repo 名稱>/,
// 所以正式打包時所有檔案路徑都要加上 /<repo 名稱>/ 前綴。
// 本機開發(npm run dev)則維持在根目錄。
const REPO_NAME = 'c3'

export default defineConfig(({ command }) => ({
  base: command === 'build' ? `/${REPO_NAME}/` : '/',
  plugins: [react()],
}))
