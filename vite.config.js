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
            },
            '/api/aisstream': {
                target: 'wss://stream.aisstream.io',
                changeOrigin: true,
                ws: true,
                secure: false,
                rewrite: function (path) { return path.replace(/^\/api\/aisstream/, '/v0/stream'); }
            },
            '/api/adsb': {
                target: 'https://api.adsb.lol',
                changeOrigin: true,
                rewrite: function (path) { return path.replace(/^\/api\/adsb/, ''); }
            },
            '/api/flightaware': {
                target: 'https://aeroapi.flightaware.com',
                changeOrigin: true,
                secure: true,
                rewrite: function (path) { return path.replace(/^\/api\/flightaware/, '/aeroapi'); }
            },
            '/api/macro': {
                target: 'https://ultimate-economic-calendar.p.rapidapi.com',
                changeOrigin: true,
                rewrite: function (path) { return path.replace(/^\/api\/macro/, ''); }
            },
            '/api/worldbank': {
                target: 'https://data360api.worldbank.org/data360',
                changeOrigin: true,
                rewrite: function (path) { return path.replace(/^\/api\/worldbank/, ''); }
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
