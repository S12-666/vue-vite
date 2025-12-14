import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { viteMockServe } from 'vite-plugin-mock';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    viteMockServe({
      mockPath: 'src/api/mockData',
      localEnabled: true,
    }),
  ],
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
