// Exemplo de uso no JavaScript do frontend servido pela mesma origem.
// Obtenha um token CSRF antes de cada operação que modifica dados.
async function obterTokenCsrf() {
    const resposta = await fetch('/api/csrf', {
        method: 'GET',
        credentials: 'same-origin',
        cache: 'no-store'
    });

    if (!resposta.ok) throw new Error('Não foi possível obter o token de segurança.');
    const dados = await resposta.json();
    return dados.csrfToken;
}

async function enviarPostSeguro(url, dados) {
    const csrfToken = await obterTokenCsrf();

    return fetch(url, {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': csrfToken
        },
        body: JSON.stringify(dados)
    });
}

// Exemplo: enviarPostSeguro('/api/pedidos', {
//   numeroPedido: 'A003',
//   formaPagamento: 'PIX',
//   itens: [{ produtoId: 1, quantidade: 2 }]
// });
//
// Para logout/movimentações/alterações de produto, use o mesmo padrão.
// Após login, busque um token novo chamando obterTokenCsrf() novamente.
