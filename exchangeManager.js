import { exec } from 'child_process';
import readline from 'readline';
import { apiRequest } from "./src/apiRequest.js"
import { Console } from 'console';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const input = (askText, clearConsole = true) => {
    return new Promise((resolve) => {
        if (clearConsole) { console.clear(); }
        rl.question(askText, (answer) => {
            resolve(String(answer).trim());
        });
    });
};

const mainMenu = async (clearConsole = true) => 
{
    let response = await input("Виберіть, будь ласка, що ви хочете зробити\n\nСтворити Invoice - create\nВидалити Invoice - remove\n\n\nВаша дія: ", clearConsole);
    return response
}

const commandHandler = async (cmd) => 
{
    switch(cmd) 
    {
        case 'create':
            console.clear();
            createInvoice()
            break;
        case 'remove':
            console.clear();
            removeInvoice()
            break;
        default:
            console.clear();
            console.log(`Неправильна команда ${cmd}, спробуйте ще раз\n\n`);
            let response = await mainMenu(false)
            await commandHandler(response);
            break;
    }
};

const createInvoice = async () =>
{
    let token = await input("Уведіть ваш токен: ")
    let title = await input("Уведіть назву заявки: ")
    let price = await input("Уведіть сумму заявки: ")
    let response = await apiRequest("https://api.nltrade.in/method/RemoteInvoiceApi", {"type": "create", "title": title, "price": price}, token)
    console.log(`Invoice створенно, ось ваш UID ${response.response.data.yourLink}`);
    let menu = await mainMenu(false)
    await commandHandler(menu);
}

const removeInvoice = async () =>
{
    let token = await input("Уведіть ваш токен: ")
    let uid = await input("Уведіть UID Invoice: ")
    let response = await apiRequest("https://api.nltrade.in/method/RemoteInvoiceApi", {"type": "remove", "uid_link": uid}, token)
    if(response.status)
    {
        console.log("Заявку видаленно")
    }
    else
    {
        console.log("Заявки не існує")
    }
    process.exit()
}

const init = async () => 
{
    let response = await mainMenu()
    await commandHandler(response);
};

init();
