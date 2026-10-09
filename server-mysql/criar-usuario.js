
require('dotenv').config();

const readline = require('readline/promises');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

async function main() {
    const terminal = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    let conexao;

    try {
        const usuario = (
            await terminal.question('Nome do usuário: ')
        ).trim();

        const senha = await terminal.question('Senha (entrada visível): ');

        if (
            !usuario ||
            usuario.length > 100 ||
            Buffer.byteLength(senha, 'utf8') < 12 ||
            Buffer.byteLength(senha, 'utf8') > 72
        ) {
            throw new Error(
                'Use um usuário válido e uma senha entre 12 e 72 bytes.'
            );
        }

        conexao = await mysql.createConnection({
            host: process.env.DB_HOST,
            port: Number(process.env.DB_PORT) || 3306,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        const [existentes] = await conexao.execute(
            'SELECT id FROM usuarios WHERE usuario = ?',
            [usuario]
        );

        if (existentes.length) {
            throw new Error('Esse usuário já existe.');
        }

        const hash = await bcrypt.hash(senha, 12);

        await conexao.execute(
            `INSERT INTO usuarios
                (usuario, senha_hash, perfil, ativo)
             VALUES (?, ?, 'admin', TRUE)`,
            [usuario, hash]
        );

        console.log('Administrador cadastrado com sucesso.');
    } finally {
        terminal.close();

        if (conexao) {
            await conexao.end();
        }
    }
}

main().catch(erro => {
    console.error(erro.message);
    process.exitCode = 1;
});