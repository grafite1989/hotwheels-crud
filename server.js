import express from 'express';
import mysql from 'mysql2';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());
app.use(express.json());

// Servir a pasta "uploads" publicamente para o navegador acessar as fotos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configuração do armazenamento de imagens com Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    // Gera um nome único para o arquivo usando timestamp + extensão original
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// Conexão MySQL
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '127789awC*',
  database: 'hotwheels_db'
});

// Rota exclusiva para Upload de Imagem
app.post('/api/upload', upload.single('imagem'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Nenhum arquivo enviado.' });
  }
  // Retorna a URL relativa da imagem enviada
  const imagemUrl = `http://localhost:3000/uploads/${req.file.filename}`;
  res.json({ url: imagemUrl });
});

// 💾 CREATE - Salvar carrinho
app.post('/api/carrinhos', (req, res) => {
  const { nome, cor, ano, tipo, imagem_url } = req.body;
  const sql = 'INSERT INTO carrinhos (nome, cor, ano, tipo, imagem_url) VALUES (?, ?, ?, ?, ?)';
  
  db.query(sql, [nome, cor, ano, tipo, imagem_url], (err, result) => {
    if (err) return res.status(500).json(err);
    res.json({ message: 'Carrinho salvo com sucesso!', codigo: result.insertId });
  });
});

// 🔍 READ - Buscar por código
app.get('/api/carrinhos/:codigo', (req, res) => {
  const { codigo } = req.params;
  const sql = 'SELECT * FROM carrinhos WHERE codigo = ?';
  
  db.query(sql, [codigo], (err, results) => {
    if (err) return res.status(500).json(err);
    if (results.length === 0) return res.status(404).json({ message: 'Não encontrado' });
    res.json(results[0]);
  });
});

// 🗑️ DELETE - Deletar carrinho por código
app.delete('/api/carrinhos/:codigo', (req, res) => {
  const { codigo } = req.params;
  const sql = 'DELETE FROM carrinhos WHERE codigo = ?';

  db.query(sql, [codigo], (err, result) => {
    if (err) {
      console.error('Erro MySQL ao deletar:', err);
      return res.status(500).json({ message: 'Erro no banco de dados ao excluir.', error: err });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Nenhum carrinho encontrado com esse código.' });
    }

    res.json({ message: 'Carrinho excluído com sucesso!' });
  });
});

// ✏️ PUT - Atualizar carrinho por código
app.put('/api/carrinhos/:codigo', (req, res) => {
  const { codigo } = req.params;
  const { nome, cor, ano, tipo, imagem_url } = req.body;

  const sql = `
    UPDATE carrinhos 
    SET nome = ?, cor = ?, ano = ?, tipo = ?, imagem_url = ? 
    WHERE codigo = ?
  `;

  db.query(sql, [nome, cor, ano, tipo, imagem_url, codigo], (err, result) => {
    if (err) {
      console.error('Erro ao atualizar no MySQL:', err);
      return res.status(500).json({ message: 'Erro ao atualizar no banco de dados.', error: err });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Carrinho não encontrado para atualização.' });
    }

    res.json({ message: 'Carrinho atualizado com sucesso!' });
  });
});

app.listen(3000, () => console.log('Servidor rodando em http://localhost:3000'));