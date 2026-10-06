//Builder - BY - KEY
const { Builder, By, Key } = require('selenium-webdriver');

//Definir a função
async function run() {

    //Criar um novo objeto webdriver
    let driver = await new Builder().forBrowser('chrome').build();

    // await driver.manage().window().maximize();
    await driver.get('http://localhost:3001/'); //Abre a página

    //Escreve no input
    let input_nome = await driver.findElement(By.xpath('//*[@id="nomePedido"]'))
    await input_nome.click()
    await input_nome.sendKeys("Teste Auto")
    
    //Clica no botao de iniciar pedido
    const botao_inicia = await driver.findElement(By.xpath('//*[@id="iniciaPedido"]'))
    await botao_inicia.click()
    await driver.sleep(2000)

    let filtroSalgado = await driver.findElement(By.xpath('//*[@id="pagina-cardapio"]/main/div/div[2]/aside/ul/li[3]'))
    await filtroSalgado.click()
    await driver.sleep(1000)

    let produto = await driver.findElement(By.xpath('//*[@id="cardapio"]/div[1]'))
    await produto.click()
    await driver.sleep(2000)

    let btn_ok = await driver.findElement(By.xpath('//*[@id="pagina-cardapio"]/div/div/div[6]/button[1]'))
    await btn_ok.click()
    await driver.sleep(1000)

    await driver.quit()
}

run() //Chama a função

