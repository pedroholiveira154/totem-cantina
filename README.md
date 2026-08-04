//Inicia o servidor
//npx json-server --watch db.json --port 3000

<h1>Passo 1: Copie a URL do repositório<\h1>

No GitHub:

Abra o repositório.
Clique em Code.
Copie a URL HTTPS, por exemplo:
https://github.com/pedroholiveira154/totem-cantina.git

<h1>Passo 2: Crie uma pasta<\h1>

Em qualquer área do PC, crie uma pasta e a nomeie como quiser
Em seguida, abra a pasta no VSCODE

<h1>Passo 3: Clone o repositório<\h1>

Abra o terminal do VSCODE e insira o seguinte código:
git clone https://github.com/pedroholiveira154/totem-cantina.git

Isso criará uma pasta chamada totem-cantina.

<h1>Passo 4: Entre na pasta do projeto<\h1>

cd totem-cantina

<h1>Passo 5: Verifique se está tudo certo<\h1>

git status

Você deverá ver algo parecido com:

On branch main
Your branch is up to date with 'origin/main'.

nothing to commit, working tree clean

Passo final: Faça suas alterações

Antes de enviar, atualize sua cópia
Isso evita conflitos com alterações feitas por outros colaboradores.

git pull origin main

Se não houver conflitos, siga para o próximo passo.

<h1>Passo final-2: Envie suas alterações<\h1>

git add . (adiciona todas alterações)

git commit -m "Explique a alteração aqui de forma simples"

git push origin main

Sempre que for trabalhar:

git pull origin main
# editar arquivos
git add .
git commit -m "Minha alteração"
git push origin main
Se aparecer erro de autenticação
