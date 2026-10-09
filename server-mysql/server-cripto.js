
require('dotenv').config();

const express = require('express');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const bcrypt = require('bcrypt');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');
const path = require('path');
const pool = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;
const production = process.env.NODE_ENV === 'production';

if (!process.env.SESSION_SECRET ||
    process.env.SESSION_SECRET.length < 32) {
    throw new Error('Configure um SESSION_SECRET forte no .env.');
}

// A sessão utiliza o mesmo servidor MySQL.
// O store cria uma tabela própria para as sessões.
const sessionStore = new MySQLStore({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    clearExpired: true,
    checkExpirationInterval: 15 * 60 * 1000,
    expiration: 30 * 60 * 1000,
    createDatabaseTable: true
});

if (production) {
    // Use apenas se estiver atrás de um proxy confiável
    // corretamente configurado.
    app.set('trust proxy', 1);
}

app.disable('x-powered-by');
app.use(express.json({ limit: '20kb' }));

app.use(session({
    name: 'sid',
    secret: process.env.SESSION_SECRET,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: production,
        sameSite: 'lax',
        maxAge: 30 * 60 * 1000,
        path: '/'
    }
}));

// --------------------------------------------------
// AUTENTICACAO E PERMISSOES
// --------------------------------------------------

function exigirLogin(req, res, next) {
    if (!req.session?.usuario) {
        return res.status(401).json({
            erro: 'Faça login para continuar.'
        });
    }

    next();
}

function exigirPerfil(...perfis) {
    return (req, res, next) => {
        if (!req.session?.usuario) {
            return res.status(401).json({
                erro: 'Faça login para continuar.'
            });
        }

        if (!perfis.includes(req.session.usuario.perfil)) {
            return res.status(403).json({
                erro: 'Você não tem permissão para esta operação.'
            });
        }

        next();
    };
}

// --------------------------------------------------
// CSRF: PROTEGE OPERACOES COM COOKIE DE SESSAO
// --------------------------------------------------

function criarTokenCsrf(req) {
    if (!req.session.csrfToken) {
        req.session.csrfToken =
            crypto.randomBytes(32).toString('hex');
    }

    return req.session.csrfToken;
}

app.get('/api/csrf', (req, res, next) => {
    const token = criarTokenCsrf(req);

    req.session.save(erro => {
        if (erro) return next(erro);

        res.set('Cache-Control', 'no-store');
        res.json({ csrfToken: token });
    });
});

function exigirCsrf(req, res, next) {
    const recebido = req.get('X-CSRF-Token');
    const esperado = req.session?.csrfToken;

    if (
        typeof recebido !== 'string' ||
        typeof esperado !== 'string'
    ) {
        return res.status(403).json({
            erro: 'Token de segurança ausente ou inválido.'
        });
    }

    const a = Buffer.from(recebido);
    const b = Buffer.from(esperado);

    if (
        a.length !== b.length ||
        !crypto.timingSafeEqual(a, b)
    ) {
        return res.status(403).json({
            erro: 'Token de segurança inválido.'
        });
    }

    next();
}

const limitarLogin = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false
});

// --------------------------------------------------
// LOGIN
// --------------------------------------------------

app.post(
    '/api/login',
    limitarLogin,
    exigirCsrf,
    async (req, res, next) => {
        try {
            const { usuario, senha } = req.body || {};

            if (
                typeof usuario !== 'string' ||
                typeof senha !== 'string' ||
                !usuario.trim() ||
                !senha ||
                usuario.length > 100 ||
                senha.length > 1024
            ) {
                return res.status(400).json({
                    erro: 'Informe usuário e senha válidos.'
                });
            }

            const [usuarios] = await pool.execute(
                `SELECT id, usuario, senha_hash, perfil, ativo
                 FROM usuarios
                 WHERE usuario = ?
                 LIMIT 1`,
                [usuario.trim()]
            );

            const conta = usuarios[0];

            if (!conta) {
                return res.status(401).json({
                    erro: 'Usuário ou senha inválidos.'
                });
            }

            const senhaCorreta = await bcrypt.compare(
                senha,
                conta.senha_hash
            );

            if (!senhaCorreta) {
                return res.status(401).json({
                    erro: 'Usuário ou senha inválidos.'
                });
            }

            if (!conta.ativo) {
                return res.status(403).json({
                    erro: 'Conta desativada.'
                });
            }

            await new Promise((resolve, reject) => {
                req.session.regenerate(erro => {
                    if (erro) reject(erro);
                    else resolve();
                });
            });

            req.session.usuario = {
                id: conta.id,
                perfil: conta.perfil
            };

            criarTokenCsrf(req);

            await new Promise((resolve, reject) => {
                req.session.save(erro => {
                    if (erro) reject(erro);
                    else resolve();
                });
            });

            res.set('Cache-Control', 'no-store');

            res.json({
                mensagem: 'Login realizado com sucesso.',
                usuario: {
                    id: conta.id,
                    nome: conta.usuario,
                    perfil: conta.perfil
                }
            });
        } catch (erro) {
            next(erro);
        }
    }
);

// --------------------------------------------------
// IDENTIDADE E LOGOUT
// --------------------------------------------------

app.get('/api/me', exigirLogin, (req, res) => {
    res.set('Cache-Control', 'no-store');
    res.json({ usuario: req.session.usuario });
});

app.post(
    '/api/logout',
    exigirLogin,
    exigirCsrf,
    (req, res, next) => {
        req.session.destroy(erro => {
            if (erro) return next(erro);

            res.clearCookie('sid', {
                httpOnly: true,
                secure: production,
                sameSite: 'lax',
                path: '/'
            });

            res.sendStatus(204);
        });
    }
);

// --------------------------------------------------
// PRODUTOS: CONSULTA PUBLICA
// --------------------------------------------------

app.get('/api/produtos', async (req, res, next) => {
    try {
        const [linhas] = await pool.query(`
            SELECT
                p.id,
                p.nome,
                p.descricao,
                p.preco,
                p.quantidade,
                p.imagem,
                p.disponivel,
                pc.categoria_id
            FROM produtos p
            LEFT JOIN produto_categorias pc
                ON pc.produto_id = p.id
            ORDER BY p.id
        `);

        const mapa = new Map();

        for (const linha of linhas) {
            if (!mapa.has(linha.id)) {
                mapa.set(linha.id, {
                    id: linha.id,
                    nome: linha.nome,
                    descricao: linha.descricao,
                    preco: linha.preco,
                    quantidade: linha.quantidade,
                    imagem: linha.imagem,
                    disponivel: linha.disponivel,
                    categorias: []
                });
            }

            if (linha.categoria_id !== null) {
                mapa.get(linha.id).categorias.push(
                    linha.categoria_id
                );
            }
        }

        res.json([...mapa.values()]);
    } catch (erro) {
        next(erro);
    }
});

app.get('/api/produtos/:id', async (req, res, next) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isSafeInteger(id) || id <= 0) {
            return res.status(400).json({
                erro: 'ID de produto inválido.'
            });
        }

        const [produtos] = await pool.execute(
            `SELECT id, nome, descricao, preco, quantidade,
                    imagem, disponivel
             FROM produtos
             WHERE id = ?`,
            [id]
        );

        if (!produtos.length) {
            return res.status(404).json({
                erro: 'Produto não encontrado.'
            });
        }

        const [categorias] = await pool.execute(
            `SELECT categoria_id
             FROM produto_categorias
             WHERE produto_id = ?`,
            [id]
        );

        res.json({
            ...produtos[0],
            categorias: categorias.map(c => c.categoria_id)
        });
    } catch (erro) {
        next(erro);
    }
});

// --------------------------------------------------
// CADASTRAR PRODUTO: SOMENTE ADMIN
// --------------------------------------------------

app.post(
    '/api/produtos',
    exigirPerfil('admin'),
    exigirCsrf,
    async (req, res, next) => {
        const {
            nome, descricao, preco, quantidade,
            categoriaId, categorias, imagem, disponivel
        } = req.body || {};

        const ids = categorias ?? (
            categoriaId === undefined ? [] : [categoriaId]
        );

        if (
            typeof nome !== 'string' ||
            !nome.trim() ||
            nome.length > 100 ||
            (descricao != null &&
                (typeof descricao !== 'string' || descricao.length > 255)) ||
            !Number.isFinite(Number(preco)) ||
            Number(preco) < 0 ||
            !Number.isSafeInteger(Number(quantidade)) ||
            Number(quantidade) < 0 ||
            !Array.isArray(ids) ||
            !ids.every(id => Number.isSafeInteger(Number(id)) && Number(id) > 0) ||
            (imagem != null &&
                (typeof imagem !== 'string' || imagem.length > 255)) ||
            (disponivel !== undefined && typeof disponivel !== 'boolean')
        ) {
            return res.status(400).json({
                erro: 'Dados do produto inválidos.'
            });
        }

        const conexao = await pool.getConnection();

        try {
            await conexao.beginTransaction();

            for (const categoriaId of new Set(ids.map(Number))) {
                const [cat] = await conexao.execute(
                    'SELECT id FROM categorias WHERE id = ?',
                    [categoriaId]
                );

                if (!cat.length) {
                    await conexao.rollback();
                    return res.status(400).json({
                        erro: 'Uma categoria informada não existe.'
                    });
                }
            }

            const [resultado] = await conexao.execute(
                `INSERT INTO produtos
                    (nome, descricao, preco, quantidade, imagem, disponivel)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    nome.trim(),
                    descricao || null,
                    Number(preco),
                    Number(quantidade),
                    imagem || null,
                    disponivel ?? true
                ]
            );

            for (const categoriaId of new Set(ids.map(Number))) {
                await conexao.execute(
                    `INSERT INTO produto_categorias
                        (produto_id, categoria_id)
                     VALUES (?, ?)`,
                    [resultado.insertId, categoriaId]
                );
            }

            await conexao.commit();

            res.status(201).json({
                id: resultado.insertId,
                mensagem: 'Produto cadastrado.'
            });
        } catch (erro) {
            await conexao.rollback().catch(() => {});
            next(erro);
        } finally {
            conexao.release();
        }
    }
);

// --------------------------------------------------
// ATUALIZAR PRODUTO: SOMENTE ADMIN
// --------------------------------------------------

app.put(
    '/api/produtos/:id',
    exigirPerfil('admin'),
    exigirCsrf,
    async (req, res, next) => {
        const id = Number(req.params.id);
        const {
            nome, descricao, preco, quantidade,
            categoriaId, categorias, imagem, disponivel
        } = req.body || {};

        const ids = categorias ?? (
            categoriaId === undefined ? [] : [categoriaId]
        );

        if (
            !Number.isSafeInteger(id) || id <= 0 ||
            typeof nome !== 'string' || !nome.trim() ||
            nome.length > 100 ||
            (descricao != null &&
                (typeof descricao !== 'string' || descricao.length > 255)) ||
            !Number.isFinite(Number(preco)) || Number(preco) < 0 ||
            !Number.isSafeInteger(Number(quantidade)) || Number(quantidade) < 0 ||
            !Array.isArray(ids) ||
            !ids.every(c => Number.isSafeInteger(Number(c)) && Number(c) > 0) ||
            (imagem != null &&
                (typeof imagem !== 'string' || imagem.length > 255)) ||
            typeof disponivel !== 'boolean'
        ) {
            return res.status(400).json({
                erro: 'Dados do produto inválidos.'
            });
        }

        const conexao = await pool.getConnection();

        try {
            await conexao.beginTransaction();

            const [existente] = await conexao.execute(
                'SELECT id FROM produtos WHERE id = ? FOR UPDATE',
                [id]
            );

            if (!existente.length) {
                await conexao.rollback();
                return res.status(404).json({
                    erro: 'Produto não encontrado.'
                });
            }

            for (const categoriaId of new Set(ids.map(Number))) {
                const [cat] = await conexao.execute(
                    'SELECT id FROM categorias WHERE id = ?',
                    [categoriaId]
                );

                if (!cat.length) {
                    await conexao.rollback();
                    return res.status(400).json({
                        erro: 'Uma categoria informada não existe.'
                    });
                }
            }

            await conexao.execute(
                `UPDATE produtos
                 SET nome = ?, descricao = ?, preco = ?,
                     quantidade = ?, imagem = ?, disponivel = ?
                 WHERE id = ?`,
                [
                    nome.trim(),
                    descricao || null,
                    Number(preco),
                    Number(quantidade),
                    imagem || null,
                    disponivel,
                    id
                ]
            );

            await conexao.execute(
                'DELETE FROM produto_categorias WHERE produto_id = ?',
                [id]
            );

            for (const categoriaId of new Set(ids.map(Number))) {
                await conexao.execute(
                    `INSERT INTO produto_categorias
                        (produto_id, categoria_id)
                     VALUES (?, ?)`,
                    [id, categoriaId]
                );
            }

            await conexao.commit();

            res.json({
                id,
                mensagem: 'Produto atualizado.'
            });
        } catch (erro) {
            await conexao.rollback().catch(() => {});
            next(erro);
        } finally {
            conexao.release();
        }
    }
);

// --------------------------------------------------
// EXCLUIR PRODUTO: SOMENTE ADMIN
// --------------------------------------------------

app.delete(
    '/api/produtos/:id',
    exigirPerfil('admin'),
    exigirCsrf,
    async (req, res, next) => {
        const id = Number(req.params.id);

        if (!Number.isSafeInteger(id) || id <= 0) {
            return res.status(400).json({
                erro: 'ID inválido.'
            });
        }

        try {
            const [resultado] = await pool.execute(
                'DELETE FROM produtos WHERE id = ?',
                [id]
            );

            if (!resultado.affectedRows) {
                return res.status(404).json({
                    erro: 'Produto não encontrado.'
                });
            }

            res.sendStatus(204);
        } catch (erro) {
            // Produtos com itens em pedidos ou movimentações
            // não devem ser apagados se houver FK RESTRICT.
            next(erro);
        }
    }
);

// --------------------------------------------------
// CATEGORIAS: CONSULTA PUBLICA
// --------------------------------------------------

app.get('/api/tipos', async (req, res, next) => {
    try {
        const [categorias] = await pool.query(
            'SELECT id, nome FROM categorias ORDER BY id'
        );

        res.json(categorias);
    } catch (erro) {
        next(erro);
    }
});

// --------------------------------------------------
// PEDIDOS: CONSULTA PRIVADA
// --------------------------------------------------

app.get(
    '/api/pedidos',
    exigirPerfil('admin'),
    async (req, res, next) => {
        try {
            const [pedidos] = await pool.query(
                'SELECT * FROM pedidos ORDER BY id'
            );

            const [itens] = await pool.query(
                'SELECT * FROM pedido_itens ORDER BY id'
            );

            const resultado = pedidos.map(pedido => ({
                ...pedido,
                itens: itens
                    .filter(item => item.pedido_id === pedido.id)
                    .map(item => ({
                        ...item,
                        produtoId: item.produto_id,
                        precoUnitario: item.preco_unitario
                    }))
            }));

            res.json(resultado);
        } catch (erro) {
            next(erro);
        }
    }
);

// --------------------------------------------------
// CRIAR PEDIDO: PUBLICO, COM VALIDACAO DO SERVIDOR
// --------------------------------------------------

app.post('/api/pedidos', async (req, res, next) => {
    const { numeroPedido, formaPagamento, itens } = req.body || {};

    if (
        typeof numeroPedido !== 'string' ||
        !/^[A-Za-z0-9-]{1,20}$/.test(numeroPedido) ||
        !Array.isArray(itens) ||
        itens.length === 0 ||
        itens.length > 50
    ) {
        return res.status(400).json({
            erro: 'Dados do pedido inválidos.'
        });
    }

    const conexao = await pool.getConnection();

    try {
        await conexao.beginTransaction();

        let totalCentavos = 0;
        const itensValidados = [];

        for (const item of itens) {
            const produtoId = Number(item.produtoId);
            const quantidade = Number(item.quantidade);

            if (
                !Number.isSafeInteger(produtoId) || produtoId <= 0 ||
                !Number.isSafeInteger(quantidade) ||
                quantidade <= 0 || quantidade > 1000
            ) {
                throw Object.assign(
                    new Error('Item de pedido inválido.'),
                    { status: 400 }
                );
            }

            const [produtos] = await conexao.execute(
                `SELECT id, preco, disponivel, quantidade
                 FROM produtos
                 WHERE id = ?
                 FOR UPDATE`,
                [produtoId]
            );

            if (!produtos.length || !produtos[0].disponivel) {
                throw Object.assign(
                    new Error('Produto indisponível.'),
                    { status: 400 }
                );
            }

            if (produtos[0].quantidade < quantidade) {
                throw Object.assign(
                    new Error('Estoque insuficiente.'),
                    { status: 409 }
                );
            }

            const precoCentavos = Math.round(
                Number(produtos[0].preco) * 100
            );

            totalCentavos += precoCentavos * quantidade;

            itensValidados.push({
                produtoId,
                quantidade,
                precoCentavos
            });
        }

        const total = (totalCentavos / 100).toFixed(2);

        const [pedido] = await conexao.execute(
            `INSERT INTO pedidos
                (numero_pedido, forma_pagamento, status, total)
             VALUES (?, ?, 'Pendente', ?)`,
            [
                numeroPedido,
                typeof formaPagamento === 'string'
                    ? formaPagamento.slice(0, 30)
                    : null,
                total
            ]
        );

        for (const item of itensValidados) {
            await conexao.execute(
                `INSERT INTO pedido_itens
                    (pedido_id, produto_id, quantidade, preco_unitario)
                 VALUES (?, ?, ?, ?)`,
                [
                    pedido.insertId,
                    item.produtoId,
                    item.quantidade,
                    (item.precoCentavos / 100).toFixed(2)
                ]
            );

            await conexao.execute(
                `UPDATE produtos
                 SET quantidade = quantidade - ?
                 WHERE id = ?`,
                [item.quantidade, item.produtoId]
            );
        }

        await conexao.commit();

        res.status(201).json({
            id: pedido.insertId,
            numeroPedido,
            total,
            status: 'Pendente'
        });
    } catch (erro) {
        await conexao.rollback().catch(() => {});

        if (erro.status) {
            return res.status(erro.status).json({
                erro: erro.message
            });
        }

        if (erro.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                erro: 'Esse número de pedido já existe.'
            });
        }

        next(erro);
    } finally {
        conexao.release();
    }
});

// --------------------------------------------------
// ESTOQUE E AUDITORIA
// --------------------------------------------------

app.get('/api/estoque', exigirLogin, async (req, res, next) => {
    try {
        const [produtos] = await pool.query(`
            SELECT id, nome, quantidade, disponivel
            FROM produtos
            ORDER BY nome
        `);

        res.set('Cache-Control', 'no-store');
        res.json({ produtos });
    } catch (erro) {
        next(erro);
    }
});

app.post(
    '/api/estoque/:id/movimentacoes',
    exigirPerfil('admin', 'funcionario'),
    exigirCsrf,
    async (req, res, next) => {
        const produtoId = Number(req.params.id);
        const { tipo, quantidade } = req.body || {};

        if (
            !Number.isSafeInteger(produtoId) || produtoId <= 0 ||
            !['entrada', 'saida'].includes(tipo) ||
            !Number.isSafeInteger(quantidade) ||
            quantidade <= 0 || quantidade > 1000000
        ) {
            return res.status(400).json({
                erro: 'Dados de movimentação inválidos.'
            });
        }

        const conexao = await pool.getConnection();

        try {
            await conexao.beginTransaction();

            const [produtos] = await conexao.execute(
                `SELECT id, quantidade
                 FROM produtos
                 WHERE id = ?
                 FOR UPDATE`,
                [produtoId]
            );

            if (!produtos.length) {
                await conexao.rollback();

                return res.status(404).json({
                    erro: 'Produto não encontrado.'
                });
            }

            const saldo = produtos[0].quantidade;

            if (tipo === 'saida' && saldo < quantidade) {
                await conexao.rollback();

                return res.status(409).json({
                    erro: 'Estoque insuficiente.'
                });
            }

            const novoSaldo = tipo === 'entrada'
                ? saldo + quantidade
                : saldo - quantidade;

            await conexao.execute(
                'UPDATE produtos SET quantidade = ? WHERE id = ?',
                [novoSaldo, produtoId]
            );

            await conexao.execute(
                `INSERT INTO movimentacoes_estoque
                    (usuario_id, produto_id, tipo, quantidade)
                 VALUES (?, ?, ?, ?)`,
                [
                    req.session.usuario.id,
                    produtoId,
                    tipo,
                    quantidade
                ]
            );

            await conexao.commit();

            res.status(201).json({
                mensagem: 'Movimentação registrada.',
                saldo: novoSaldo
            });
        } catch (erro) {
            await conexao.rollback().catch(() => {});
            next(erro);
        } finally {
            conexao.release();
        }
    }
);

app.get(
    '/api/estoque/movimentacoes',
    exigirPerfil('admin'),
    async (req, res, next) => {
        try {
            const [movimentacoes] = await pool.query(`
                SELECT
                    m.id,
                    m.usuario_id,
                    u.usuario,
                    m.produto_id,
                    p.nome AS produto,
                    m.tipo,
                    m.quantidade,
                    m.data_hora
                FROM movimentacoes_estoque m
                JOIN usuarios u ON u.id = m.usuario_id
                JOIN produtos p ON p.id = m.produto_id
                ORDER BY m.data_hora DESC
                LIMIT 500
            `);

            res.json(movimentacoes);
        } catch (erro) {
            next(erro);
        }
    }
);

// --------------------------------------------------
// PAGINA PRIVADA
// --------------------------------------------------

app.get('/estoque.html', exigirLogin, (req, res) => {
    res.set('Cache-Control', 'no-store');

    res.sendFile(
        path.join(__dirname, '../private/estoque.html')
    );
});

// Arquivos públicos: não coloque estoque.html aqui.
app.use(express.static(
    path.join(__dirname, '../public'),
    { index: false, dotfiles: 'deny' }
));

app.use((req, res) => {
    res.status(404).json({
        erro: 'Recurso não encontrado.'
    });
});

app.use((erro, req, res, next) => {
    console.error('Erro na API:', erro);

    if (res.headersSent) return next(erro);

    res.status(500).json({
        erro: 'Erro interno do servidor.'
    });
});

async function iniciar() {
    await pool.query('SELECT 1');

    app.listen(PORT, () => {
        console.log(`API disponível em http://localhost:${PORT}`);
    });
}

iniciar().catch(erro => {
    console.error('Falha ao iniciar a API:', erro);
    process.exit(1);
});