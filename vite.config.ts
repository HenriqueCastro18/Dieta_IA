import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'v8-json-writer',
      configureServer(server) {
        // Cria uma rota local secreta para o nosso App gravar no HD
        server.middlewares.use('/api/write-json', (req, res) => {
          if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', () => {
              try {
                const { fileName, key, data } = JSON.parse(body);
                
                // Mapeia o caminho exato até a sua pasta src/data
                const filePath = path.resolve(__dirname, `src/data/${fileName}`);
                
                // Abre o arquivo JSON atual
                const currentData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
                
                // Injeta a nova comida criada pela Groq
                currentData[key] = data;
                
                // Salva o arquivo fisicamente no seu VS Code
                fs.writeFileSync(filePath, JSON.stringify(currentData, null, 4));
                
                res.statusCode = 200;
                res.end('Salvo com sucesso no HD!');
              } catch (error) {
                console.error('Erro no Motor de Escrita V8:', error);
                res.statusCode = 500;
                res.end('Erro ao gravar o arquivo.');
              }
            });
          }
        });
      }
    }
  ]
});