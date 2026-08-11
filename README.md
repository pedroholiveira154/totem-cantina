### Iniciar o servidor:
- npx json-server --watch db.json --port 3000

## Passo 1: Copie a URL do repositório

### No GitHub:

- Abra o repositório.
- Clique em Code.
- Copie a URL HTTPS, por exemplo:
- https://github.com/pedroholiveira154/totem-cantina.git

## Passo 2: Crie uma pasta

- Em qualquer área do PC, crie uma pasta e a nomeie como quiser
- Em seguida, abra a pasta no VSCODE

## Passo 3: Clone o repositório

- Abra o terminal do VSCODE e insira o seguinte código:
  git clone https://github.com/pedroholiveira154/totem-cantina.git

- Isso criará uma pasta chamada totem-cantina.

## Passo 4: Entre na pasta do projeto

- cd totem-cantina

## Passo 5: Verifique se está tudo certo

- git status

Você deverá ver algo parecido com:

- On branch main
- Your branch is up to date with 'origin/main'.

- nothing to commit, working tree clean

## Passo 6: Faça suas alterações

- Antes de enviar, atualize sua cópia. Isso evita conflitos com alterações feitas por outros colaboradores.

- git pull origin main

Se não houver conflitos, siga para o próximo passo.

## Passo 7: Se identifique

- Identifique-se para o GIT com os comando:
- git config user.name 'Seu nome'
- git config user.email 'email@.....com

## Passo final: Envie suas alterações

- git add . (adiciona todas alterações)

- git commit -m "Explique a alteração aqui de forma simples"

- git push origin main

# Sempre que for trabalhar (Fluxo):

- git pull origin main
- git add .
- git commit -m "Minha alteração"
- git push origin main
