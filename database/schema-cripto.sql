-- =====================================================================
-- totem-cantina — schema de TESTE para MySQL 9.6
-- Equivalente ao db.json do repositório pedroholiveira154/totem-cantina
-- Uso: aprendizado/local, NÃO é para substituir o db.json original.
-- =====================================================================
DROP DATABASE totem_cantina;

CREATE DATABASE IF NOT EXISTS totem_cantina
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE totem_cantina;

-- ---------------------------------------------------------------------
-- categorias  (equivalente a db.json -> "categorias")
-- ---------------------------------------------------------------------
CREATE TABLE categorias (
    id    INT AUTO_INCREMENT PRIMARY KEY,
    nome  VARCHAR(50) NOT NULL
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- produtos  (equivalente a db.json -> "produtos")
-- categoriaId no JSON -> categoria_id (FK) aqui
-- ---------------------------------------------------------------------
CREATE TABLE produtos (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    nome          VARCHAR(100) NOT NULL,
    descricao     VARCHAR(255),
    preco         DECIMAL(10,2) NOT NULL,
    quantidade    INT NOT NULL DEFAULT 0,
    imagem        VARCHAR(255),
    disponivel    BOOLEAN NOT NULL DEFAULT TRUE
) ENGINE=InnoDB;


-- ---------------------------------------------------------------------
-- produto_categorias
-- Um produto pode pertencer a várias categorias
-- e uma categoria pode possuir vários produtos.
-- ---------------------------------------------------------------------
CREATE TABLE produto_categorias (
    produto_id   INT NOT NULL,
    categoria_id INT NOT NULL,

    PRIMARY KEY (produto_id, categoria_id),

    CONSTRAINT fk_produto_categoria_produto
        FOREIGN KEY (produto_id) REFERENCES produtos(id)
        ON UPDATE CASCADE ON DELETE CASCADE,

    CONSTRAINT fk_produto_categoria_categoria
        FOREIGN KEY (categoria_id) REFERENCES categorias(id)
        ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- pedidos  (equivalente a db.json -> "pedidos", sem o array "itens")
-- numeroPedido no JSON -> numero_pedido aqui
-- ---------------------------------------------------------------------
CREATE TABLE pedidos (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    numero_pedido    VARCHAR(20) NOT NULL UNIQUE,
    data_pedido      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    forma_pagamento  VARCHAR(30),
    status           VARCHAR(30) NOT NULL DEFAULT 'Pendente',
    total            DECIMAL(10,2) NOT NULL DEFAULT 0
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- pedido_itens  (equivalente ao array "itens" dentro de cada pedido no JSON)
-- Isso é a principal diferença estrutural: no JSON os itens ficam
-- aninhados dentro do pedido; no relacional viram uma tabela filha.
-- ---------------------------------------------------------------------
CREATE TABLE pedido_itens (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    pedido_id        INT NOT NULL,
    produto_id       INT NOT NULL,
    quantidade       INT NOT NULL,
    preco_unitario   DECIMAL(10,2) NOT NULL,
    CONSTRAINT fk_itens_pedido
        FOREIGN KEY (pedido_id) REFERENCES pedidos(id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_itens_produto
        FOREIGN KEY (produto_id) REFERENCES produtos(id)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- admins  (equivalente a db.json -> "admins")
-- No JSON a senha fica em texto puro; aqui mantive igual só para
-- reproduzir o teste. Isso NÃO deve ir para produção dessa forma —
-- ver observação de segurança no GUIA.md, seção 14.
-- ---------------------------------------------------------------------
CREATE TABLE usuarios (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    usuario VARCHAR(100) NOT NULL UNIQUE,
    senha_hash VARCHAR(255) NOT NULL,
    perfil ENUM('admin', 'funcionario')
        NOT NULL DEFAULT 'funcionario',
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE movimentacoes_estoque (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT UNSIGNED NOT NULL,
    produto_id INT UNSIGNED NOT NULL,
    tipo ENUM('entrada', 'saida') NOT NULL,
    quantidade INT UNSIGNED NOT NULL,
    data_hora TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_movimentacao_quantidade
        CHECK (quantidade > 0),

    CONSTRAINT fk_mov_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id),

    CONSTRAINT fk_mov_produto
        FOREIGN KEY (produto_id) REFERENCES produtos(id),

    INDEX idx_mov_data (data_hora),
    INDEX idx_mov_usuario (usuario_id)
);
-- =====================================================================
-- DADOS DE TESTE
-- =====================================================================

-- categorias: as 3 que existem no db.json 
INSERT INTO categorias (id, nome) VALUES
    (1, 'Salgados'),
    (2, 'Bebidas'),
    (3, 'Sobremesas'),
    (4, 'Lançamentos'),
    (5, 'Mais Vendidos');

INSERT INTO produtos (nome, descricao, preco, quantidade, imagem, disponivel) VALUES
    ('Coxinha',
     'Massa de batata recheada com frango',
     8.00, 5,
     'img/imgCardapio/coxinha.png', 1),

    ('Suco de Laranja',
     'Suco natural 300ml',
     6.00, 10,
     'img/imgCardapio/suco-laranja.png', 1),

    ('Brigadeiro',
     'Doce de chocolate tradicional',
     3.50, 15,
     'img/imgCardapio/brigadeiro.png', 1),

    ('Pão de Queijo',
     'Pão de queijo tradicional',
     5.00, 20,
     'img/imgCardapio/pao-de-queijo.png', 1),

    ('Coca-Cola',
     'Refrigerante lata 350ml',
     6.00, 15,
     'img/imgCardapio/coca.png', 1),

    ('Croissant de Chocolate',
     'Croissant recheado com chocolate',
     7.00, 10,
     'img/imgCardapio/croissant-chocolate.png', 1);

INSERT INTO produto_categorias (produto_id, categoria_id) VALUES
    -- Coxinha
    (1, 1), -- Salgados

    -- Suco de Laranja
    (2, 2), -- Bebidas

    -- Brigadeiro
    (3, 3), -- Sobremesas

    -- Pão de Queijo
    (4, 1), -- Salgados
    (4, 4), -- Lançamentos

    -- Coca-Cola
    (5, 2), -- Bebidas
    (5, 4), -- Lançamentos
    (5, 5), -- Mais Vendidos

    -- Croissant
    (6, 3), -- Sobremesas
    (6, 4); -- Lançamentos


-- pedidos: os 2 pedidos existentes no db.json
INSERT INTO pedidos (id, numero_pedido, data_pedido, forma_pagamento, status, total) VALUES
    (1, 'A001', '2026-06-08 15:30:00', 'PIX', 'Pago', 22.00),
    (2, 'A002', '2026-06-08 15:30:00', 'PIX', 'Cancelado', 22.00);

-- itens de cada pedido (equivalente ao array "itens" do JSON)
INSERT INTO pedido_itens (pedido_id, produto_id, quantidade, preco_unitario) VALUES
    (1, 1, 2, 8.00),
    (1, 2, 1, 6.00);
