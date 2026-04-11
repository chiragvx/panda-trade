import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
export default defineConfig({
    plugins: [react()],
    server: {
        proxy: {
            '/api/proxy/nasa-firms': {
                target: 'https://firms.modaps.eosdis.nasa.gov',
                changeOrigin: true,
                rewrite: function (path) { return path.replace(/^\/api\/proxy\/nasa-firms/, '/data/active_fire/viirs-snpp-nrt/csv/VNP14IMGTDL_NRT_Global_24h.csv'); }
            }
        }
    },
    css: {
        postcss: {
            plugins: [
                tailwindcss(),
                autoprefixer(),
            ],
        },
    },
});
