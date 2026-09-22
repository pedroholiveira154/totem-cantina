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
const pg_finalizar = document.getElementById('pagina-finalizar')

// =============================================
// FUNCOES - INDEX
// =============================================
if (pg_index) {
    function iniciarPedido() {

        let nome = input_nome.value.toUpperCase();

        if (nome.trim() !== "") {

            localStorage.setItem('nomeCliente', nome);

            window.location.href = "cardapio.html";

        } else {

            Swal.fire({
                text: "Por favor, preencha o campo 'Seu Nome'",
                icon: "error"
            });

        }
    }

    // Se apertar enter no input, o botão é acionado
    input_nome.addEventListener("keydown", (event) => {

        if (event.key === "Enter") {
            iniciarPedido();
        }

    });
}

// =============================================
// FUNÇÕES GERAIS - CARRINHO
// =============================================

function obterCarrinho() {
    return JSON.parse(localStorage.getItem("carrinho")) || [];
}

function calcularTotal(carrinho) {
    return carrinho.reduce((total, produto) => {
        return total + Number(produto.preco);
    }, 0);
}

function formatarPreco(preco) {
    return Number(preco).toFixed(2).replace('.', ',');
}

function mostrarTotal(total) {
    document.getElementById("preco-total").innerHTML = `
    <div class="caixa-precoTotal">
        <p>Total a pagar:</p>
        <h1>R$ ${formatarPreco(total)}</h1>
    </div>
    `;
}


// =============================================
// FUNCOES - CARDAPIO
// =============================================

if (pg_cardapio) {

    let nomeCliente = document.getElementById('nome-cliente');

    // querySelectorAll permite usar o forEach
    let itens = document.querySelectorAll('.cardapio-sidebar li');

    itens.forEach(li => {

        li.addEventListener('click', () => {

            // Remove a classe de todos os li da sidebar
            itens.forEach(i => i.classList.remove('ativo'));

            // Adiciona a classe ativo apenas no li que foi clicado
            li.classList.add('ativo');
        });

    });

    nomeCliente.textContent = localStorage.getItem('nomeCliente');

    fetch("http://localhost:3000/produtos")
        .then(res => res.json())
        .then(produtos => {

            const cardapio = document.getElementById("cardapio");

            produtos.forEach(produto => {

                const item = document.createElement("div");

                item.innerHTML = `
                    <div id="produtoCard">

                        <div class="produto-cima">
                            <img src="${produto.imagem}">
                            <p id="nome-produto">${produto.nome}</p>
                        </div>

                        <div class="produto-baixo">
                            <p>
                                a partir de <br>
                                <span id="produto-preco">
                                    R$ ${produto.preco}
                                </span>
                            </p>
                        </div>

                    </div>
                `;

                // QUANDO CLICAR NO PRODUTO
                item.addEventListener("click", () => {

                    Swal.fire({
                        icon: "success",
                        title: "Produto adicionado",
                    });

                    adicionarAoCarrinho(produto);
                });

                console.log(item);
                console.log(produtos);
                console.log(produto);

                cardapio.appendChild(item);
            });

        });


    // FUNÇÃO DO CARRINHO
    function adicionarAoCarrinho(produto) {

        // pega carrinho atual ou cria vazio
        let carrinho = obterCarrinho();

        // adiciona produto
        carrinho.push(produto);

        // salva novamente
        localStorage.setItem("carrinho", JSON.stringify(carrinho));
    }


    function direcionarPedido() {
        window.location.href = 'pedido.html';
    }

}


// =============================================
// FUNCOES - PEDIDO
// =============================================

if (pg_pedido) {

    const lista = document.getElementById("lista-produtos");

    // pega carrinho
    const carrinho = obterCarrinho();

    carrinho.forEach((produto, index) => {

        const item = document.createElement("div");
        item.classList.add("pedido");

        item.innerHTML = `
            <div class="apagar-pedido">
                <button onclick="remover(${index})">🗑️</button>
            </div>

            <div class="descricao-pedido">

                <h2>${produto.nome}</h2>

                <h2>
                    <span class="preco-pedido">
                        R$ ${formatarPreco(produto.preco)}
                    </span>
                </h2>

            </div>
        `;

        lista.appendChild(item);
    });


    // MOSTRAR TOTAL
    mostrarTotal(calcularTotal(carrinho));


    // remover item
    function remover(index) {

        carrinho.splice(index, 1);

        localStorage.setItem(
            "carrinho",
            JSON.stringify(carrinho)
        );

        location.reload();
    }


    // botão pagar
    function pagar() {

        alert("Compra realizada!");

        localStorage.removeItem("carrinho");

        window.location.href = "index.html";
    }


    function redirecionarPagamento() {
        window.location.href = 'pagamento.html';
    }

}


// =============================================
// FUNCOES - PAGAMENTO
// =============================================

if (pg_pagamento) {

    // pega carrinho
    const carrinho = obterCarrinho();

    // calcula o total
    const total = calcularTotal(carrinho);


    // MOSTRAR TOTAL
    mostrarTotal(total);


    function pagar() {

        alert("Compra realizada!");

        localStorage.removeItem("carrinho");

        window.location.href = "index.html";
    }


    function redirecionarFinalizar() {
        window.location.href = 'finalizar.html';
    }

}

// =============================================
// FUNCOES - PAGAR
// // =============================================

if (pg_finalizar) {



}