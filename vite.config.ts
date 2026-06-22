import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';
import fs from 'fs';
import path from 'path';

const excelManifestGenerator = () => {
  const virtualModuleId = 'virtual:excel-manifest';
  const resolvedVirtualModuleId = '\0' + virtualModuleId;

  return {
    name: 'excel-manifest-generator',
    resolveId(id) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId;
      }
    },
    load(id) {
      if (id === resolvedVirtualModuleId) {
        const excelDir = resolve(__dirname, 'public/data/excel');
        const files = fs.readdirSync(excelDir);
        const participantNames = files
          .filter(file => file.startsWith('Excel-Mundial-2026_') && file.endsWith('.xlsx'))
          .map(file => {
            const match = file.match(/Excel-Mundial-2026_(.*)\.xlsx/);
            return match ? match[1] : null;
          })
          .filter(name => name !== null);

        return `export default ${JSON.stringify(participantNames)}`;
      }
    },
  };
};

export default defineConfig({
  plugins: [vue(), excelManifestGenerator()],
  resolve: { alias: { '@': resolve(__dirname, 'src') } },
  server: {
    proxy: {
      '/.netlify/functions': {
        target: 'http://localhost:8888',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/\.netlify\/functions/, ''),
      },
    },
  },
});
