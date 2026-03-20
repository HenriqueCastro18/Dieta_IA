const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Caminho para o seu JSON dentro de src/data
const DB_PATH = path.join(__dirname, '../src/data/foodDatabase.json');

app.post('/api/save-food', (req, res) => {
    const { key, data } = req.body;

    try {
        // Verifica se o arquivo existe antes de ler
        if (!fs.existsSync(DB_PATH)) {
            fs.writeFileSync(DB_PATH, '{}', 'utf8');
        }

        const fileContent = fs.readFileSync(DB_PATH, 'utf8');
        const db = JSON.parse(fileContent || '{}');
        
        // Adiciona o novo item (ex: açucar)
        db[key] = data;

        // Grava no arquivo físico
        fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
        
        console.log(`✅ Persistido com sucesso: ${key}`);
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('❌ Erro no servidor:', error);
        res.status(500).json({ error: 'Falha ao gravar no JSON' });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor de Automação ON em http://localhost:${PORT}`);
});