-- =====================================================================
-- totem-cantina — schema de TESTE para MySQL 9.6
-- Equivalente ao db.json do repositório pedroholiveira154/totem-cantina
-- Uso: aprendizado/local, NÃO é para substituir o db.json original.
-- =====================================================================

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
    quantidade    INT NOT NULL DEFAULT 0,       -- estoque
    categoria_id  INT,
    imagem        VARCHAR(255),
    disponivel    BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT fk_produtos_categoria
        FOREIGN KEY (categoria_id) REFERENCES categorias(id)
        ON UPDATE CASCADE ON DELETE SET NULL
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
CREATE TABLE admins (
    id       INT AUTO_INCREMENT PRIMARY KEY,
    usuario  VARCHAR(50) NOT NULL UNIQUE,
    senha    VARCHAR(255) NOT NULL
) ENGINE=InnoDB;

-- =====================================================================
-- DADOS DE TESTE
-- =====================================================================

-- categorias: as 3 que existem no db.json 
INSERT INTO categorias (id, nome) VALUES
    (1, 'Salgados'),
    (2, 'Bebidas'),
    (3, 'Sobremesas');

INSERT INTO produtos (nome, descricao, preco, quantidade, categoria_id, imagem, disponivel) VALUES
    ('Coxinha', 'Massa de batata recheada com frango', 8.00, 5, 1, 'img/imgCardapio/hamburguer.jpg', TRUE),
    -- ↓ exemplos fictícios, apenas para popular Bebidas/Sobremesas no teste
    ('Suco de Laranja', 'Suco natural 300ml', 6.00, 10, 2, 'img/imgCardapio/suco.jpg', TRUE),
    ('Brigadeiro', 'Doce de chocolate tradicional', 3.50, 15, 3, 'img/imgCardapio/brigadeiro.jpg', TRUE);

-- pedidos: os 2 pedidos existentes no db.json
INSERT INTO pedidos (id, numero_pedido, data_pedido, forma_pagamento, status, total) VALUES
    (1, 'A001', '2026-06-08 15:30:00', 'PIX', 'Pago', 22.00),
    (2, 'A002', '2026-06-08 15:30:00', 'PIX', 'Cancelado', 22.00);

-- itens de cada pedido (equivalente ao array "itens" do JSON)
INSERT INTO pedido_itens (pedido_id, produto_id, quantidade, preco_unitario) VALUES
    (1, 1, 2, 8.00),
    (2, 1, 2, 8.00);

-- admins: os 2 usuários do db.json (senha em texto puro, só para teste)
INSERT INTO admins (usuario, senha) VALUES
    ('root', 'senai'),
    ('admin', '123456');
