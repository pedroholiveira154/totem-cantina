
async function iniciarEstoque() {
    const resposta = await fetch('/api/me', {
        cache: 'no-store'
    });

    if (resposta.status === 401) {
        window.location.replace('/login.html');
        return;
    }

    if (!resposta.ok) {
        throw new Error('Não foi possível verificar a sessão.');
    }

    const { usuario } = await resposta.json();

    document.getElementById('usuario-logado').textContent =
        `Usuário ID: ${usuario.id} | Perfil: ${usuario.perfil}`;

    await carregarEstoque();
}

async function carregarEstoque() {
    const resposta = await fetch('/api/estoque');

    if (resposta.status === 401) {
        window.location.replace('/login.html');
        return;
    }

    if (!resposta.ok) {
        throw new Error('Não foi possível carregar o estoque.');
    }

    const dados = await resposta.json();

    console.log(dados.produtos);

    // Atualize a tabela de produtos existente
    // com os dados de dados.produtos.
}

iniciarEstoque().catch(erro => {
    console.error(erro);
});