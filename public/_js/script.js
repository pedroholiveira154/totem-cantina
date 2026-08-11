// =============================================
// REFERÊNCIAS - INDEX
// =============================================
const pg_index = document.getElementById('pg-index')
const input_nome = document.getElementById('nomePedido')

// =============================================
// REFERÊNCIAS - CARDAPIO
// =============================================
const pg_cardapio = document.getElementById('pagina-cardapio')

// =============================================
// REFERÊNCIAS - PEDIDO
// =============================================
const pg_pedido = document.getElementById('pagina-pedido')

// =============================================
// REFERÊNCIAS - PAGAMENTO
// =============================================
const pg_pagamento = document.getElementById('pagina-pagamento')

// =============================================
// REFERÊNCIAS - PAGAR
// =============================================
const pg_pagar = document.getElementById('pagina-pagar')

// =============================================
// FUNCOES - INDEX
// =============================================

function iniciarPedido() {
    let nome = input_nome.value

    if (input_nome.value.trim() !== "") {
        localStorage.setItem('nomeCliente', nome)
        window.location.href = "cardapio.html"
    } else {
            Swal.fire({
            text: "Por favor, preencha o campo 'Seu Nome'",
            icon: "Error"
        });
    }
}

// =============================================
// FUNCOES - CARDAPIO
// =============================================
if (pg_cardapio) {
    let nomeCliente = document.getElementById('nome-cliente')

    nomeCliente.textContent = localStorage.getItem('nomeCliente')
    fetch("http://localhost:3000/produtos")
        .then(res => res.json())
        .then(produtos => {

            const cardapio = document.getElementById("cardapio");
            produtos.forEach(produto => {

                const item = document.createElement("div");

                item.innerHTML = `
            <div id="produtoCard">
            <div class="produtoCima">
            <img src="${produto.imagem}">
            <p id="nomeProdutoCard">${produto.nome}</p>
            </div>
            <div class="produtoBaixo">
            <p>a partir de <br><span id="produtoPrecoEnfase">R$ ${produto.preco}</span></p>
            </div>
            </div>
            `;

                // QUANDO CLICAR NO PRODUTO
                item.addEventListener("click", () => {
                    adicionarAoCarrinho(produto);
                });

                console.log(item)
                console.log(produtos)
                console.log(produto)
                cardapio.appendChild(item);
            });

        });


    // FUNÇÃO DO CARRINHO
    function adicionarAoCarrinho(produto) {

        // pega carrinho atual ou cria vazio
        let carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];

        // adiciona produto
        carrinho.push(produto);

        // salva novamente
        localStorage.setItem("carrinho", JSON.stringify(carrinho));

        alert("Produto adicionado!");


    }

    function direcionarPedido() {
        window.location.href = 'pedido.html'
    }


}
// =============================================
// FUNCOES - PEDIDO
// // =============================================
if (pg_pedido) {
    const lista = document.getElementById("lista-produtos");
    console.log(lista)

    // pega carrinho
    let carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];

    let total = 0;

    carrinho.forEach((produto, index) => {

        total += produto.preco;

        const item = document.createElement("div");
        item.classList.add("produto1");

        item.innerHTML = `
        <div class="numero">
            <h1>1</h1>
        </div>

        <div class="descricao-produto">
            <h1>${produto.nome}</h1>
            <h2>Preço: R$ ${produto.preco}</h2>
        </div>

        <div class="apagar-produto">
            <button onclick="remover(${index})">🗑️</button>
        </div>
    `;

        lista.appendChild(item);
    });

    // mostrar total
    document.getElementById("preco-total").innerHTML = `
    <img id="carrinho" src="img/imgCompra/carrinho-de-compras.png">
    <h1>R$ ${total}</h1>
`;

    // remover item
    function remover(index) {
        carrinho.splice(index, 1);
        localStorage.setItem("carrinho", JSON.stringify(carrinho));
        location.reload();
    }

    // botão pagar
    function pagar() {
        alert("Compra realizada!");
        localStorage.removeItem("carrinho");
        window.location.href = "index.html";
    }

    function redirecionarPagamento(){
        window.location.href = 'pagamento.html'
    }

}

// =============================================
// FUNCOES - PAGAMENTO
// // =============================================

if (pg_pagamento) {

    document.getElementById("preco-total").innerHTML = `R$${total}`;  

}

// =============================================
// FUNCOES - PAGAR
// // =============================================

if (pg_pagar) {



}