// server.js
// Camada de API: HTML/CSS/JS  →  aqui (Express)  →  MySQL
// O front-end NUNCA fala direto com o MySQL — sempre passa por essas rotas.

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./db');

const app = express();

app.use(cors());          // libera o front-end (rodando em outra porta/arquivo) chamar essa API
app.use(express.json());  // permite ler JSON no corpo (body) de POST/PUT
app.use(express.static('../public')); 

const PORT = process.env.PORT || 3001;

// =====================================================================
// PRODUTOS
// =====================================================================

// GET /api/produtos  -> lista todos (equivalente ao fetch atual do cardapio.html)
app.get('/api/produtos', async (req, res) => {
    try {
        const [linhas] = await pool.query(
            'SELECT * FROM produtos ORDER BY id'
        );
        res.json(linhas);
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao buscar produtos' });
    }
});

// GET /api/produtos/:id -> busca um produto específico
app.get('/api/produtos/:id', async (req, res) => {
    try {
        const [linhas] = await pool.query(
            'SELECT * FROM produtos WHERE id = ?',
            [req.params.id]
        );
        if (linhas.length === 0) {
            return res.status(404).json({ erro: 'Produto não encontrado' });
        }
        res.json(linhas[0]);
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao buscar produto' });
    }
});

// POST /api/produtos -> cadastra um novo produto
app.post('/api/produtos', async (req, res) => {
    const { nome, descricao, preco, quantidade, categoriaId, imagem, disponivel } = req.body;
    try {
        const [resultado] = await pool.query(
            `INSERT INTO produtos (nome, descricao, preco, quantidade, categoria_id, imagem, disponivel)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [nome, descricao, preco, quantidade, categoriaId, imagem, disponivel ?? true]
        );
        res.status(201).json({ id: resultado.insertId, ...req.body });
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao cadastrar produto' });
    }
});

// PUT /api/produtos/:id -> atualiza um produto existente
app.put('/api/produtos/:id', async (req, res) => {
    const { nome, descricao, preco, quantidade, categoriaId, imagem, disponivel } = req.body;
    try {
        await pool.query(
            `UPDATE produtos
             SET nome = ?, descricao = ?, preco = ?, quantidade = ?,
                 categoria_id = ?, imagem = ?, disponivel = ?
             WHERE id = ?`,
            [nome, descricao, preco, quantidade, categoriaId, imagem, disponivel, req.params.id]
        );
        res.json({ id: Number(req.params.id), ...req.body });
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao atualizar produto' });
    }
});

// DELETE /api/produtos/:id -> exclui um produto
app.delete('/api/produtos/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM produtos WHERE id = ?', [req.params.id]);
        res.status(204).send(); // 204 = sucesso, sem conteúdo de volta
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao excluir produto' });
    }
});

// =====================================================================
// CATEGORIAS (equivalente ao array "categorias" do db.json)
// =====================================================================

app.get('/api/tipos', async (req, res) => {
    try {
        const [linhas] = await pool.query('SELECT * FROM categorias ORDER BY id');
        res.json(linhas);
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao buscar categorias' });
    }
});

// =====================================================================
// PEDIDOS
// =====================================================================

// GET /api/pedidos -> lista pedidos já com os itens de cada um
app.get('/api/pedidos', async (req, res) => {
    try {
        const [pedidos] = await pool.query('SELECT * FROM pedidos ORDER BY id');
        const [itens] = await pool.query('SELECT * FROM pedido_itens');

        // junta cada pedido com os itens dele, reconstruindo o formato do JSON original
        const pedidosComItens = pedidos.map(pedido => ({
            ...pedido,
            itens: itens.filter(item => item.pedido_id === pedido.id)
        }));

        res.json(pedidosComItens);
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao buscar pedidos' });
    }
});

// POST /api/pedidos -> cria um pedido novo com seus itens
// Usa uma TRANSAÇÃO: ou o pedido inteiro (cabeçalho + itens) é salvo,
// ou nada é salvo — evita pedido "pela metade" se algo falhar no meio.
app.post('/api/pedidos', async (req, res) => {
    const { numeroPedido, formaPagamento, status, total, itens } = req.body;

    const conexao = await pool.getConnection();
    try {
        await conexao.beginTransaction();

        const [resultadoPedido] = await conexao.query(
            `INSERT INTO pedidos (numero_pedido, forma_pagamento, status, total)
             VALUES (?, ?, ?, ?)`,
            [numeroPedido, formaPagamento, status ?? 'Pendente', total]
        );

        const pedidoId = resultadoPedido.insertId;

        for (const item of itens ?? []) {
            await conexao.query(
                `INSERT INTO pedido_itens (pedido_id, produto_id, quantidade, preco_unitario)
                 VALUES (?, ?, ?, ?)`,
                [pedidoId, item.produtoId, item.quantidade, item.precoUnitario]
            );
        }

        await conexao.commit();
        res.status(201).json({ id: pedidoId, numeroPedido, itens });

    } catch (erro) {
        await conexao.rollback(); // desfaz tudo se der erro
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao registrar pedido' });
    } finally {
        conexao.release(); // devolve a conexão para o pool
    }
});

// =====================================================================
app.listen(PORT, () => {
    console.log(`API de teste (MySQL) rodando em http://localhost:${PORT}`);
});
