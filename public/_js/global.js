//Função para voltar a pagina anterior
function retornar() {
    if (pg_cardapio) {
        window.location.href = 'index.html'
    }
    if (pg_pedido) {
        window.location.href = 'cardapio.html'
    }
    if (pg_pagamento) {
        window.location.href = 'pedido.html'
    }
}


//Funcao que faz a tela nao sair pra fora
function overflow() {
    if (pg_index || pg_pagar || pg_pagamento) {
        pg_index.style.overflow = 'hidden'
        pg_pagar.style.overflow = 'hidden'
        pg_pagamento.style.overflow = 'hidden'
    }
}