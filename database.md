# Utilizando BANCO DE DADOS

  ## Passo 0: Criando a tabela (No CMD)
  
  - Acesse a pasta "database" do totem-cantina

  - Use o código abaixo:
  - "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p < schema.sql
  ### OBS: O caminho do programa do MYSQL muda de PC para PC
  - dir /s /b C:\mysql.exe (Ele procura onde está a pasta do MYSQL)

  ## Passo 1: Configurar o .env

  - Copie o arquivo .env.example (deixe somente .env) e modifique a senha para a do root

  ## Passo 2: Instalando o necessário

  - Volte a pasta raiz do projeto: cd C:\Users\Aluno\Desktop\totem-cantina> 
  - Escreva npm install para instalar todas dependencias do projeto
  - Inicie o servidor:
  - npm start

  ## Abra o site e aproveite!
__________________________________________________________________________

# Analisando o Banco de Dados

 - No CMD digite:
 - "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p 
 ### Insira a senha do root (do Senai é "admin")

 USE nome_do_banco;
 SHOW TABLES;

 SELECT * FROM tabelaDesejada;

 DESCRIBE tabelaDesejada;



