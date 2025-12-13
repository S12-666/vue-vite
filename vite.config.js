import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  // 添加的别名
  resolve:{
    alias:[
      {
        find: "@",
        replacement: "/src",
      }
    ]
  },
  server: {
    port: 8080,
    proxy: {
      '/pidasApi': {
        target: 'http://172.29.175.6:5500',
        changeOrigin: true
      },
      'nodeApi': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/nodeApi/, '/api')
      },
      '/newbaogangapi': {
        target: 'http://172.29.175.6:5500',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/newbaogangapi/, '/api')
      }
    }
  }
})
