import { io } from "socket.io-client";
import { apiRequest } from "./src/apiRequest.js"
import { status } from "./src/const.js"
import readline from 'readline'

var invoiceUid = ""
var token = ""

const rl = readline.createInterface 
({
    input: process.stdin,
    output: process.stdout
});

const init = async() => 
{
    token = await input("Ваш токен: ", true)
    invoiceUid = await input("Ваш UID: ", false)
    const socket = io('https://invoice.wellpay.me');

    socket.on('connect', () => 
    {
        socket.emit('invoice:join', invoiceUid);
        Response("Успішно під'єданно до кімнати WebSocket", false, false)
        Response("Отримання данних щодо заявки", false, false)
        selectEvent("get")
    });

    socket.on('disconnect', () => 
    {
        console.log('Disconnected from server');
    });

    socket.on('invoce:refetch', () => 
    {
        selectEvent("get")
    });

    // socket.on('ip:send', async (ip) => 
    // {
    //     Response(ip)
    //     // let request = await apiRequest("https://api.nltrade.in/method/RemoteInvoiceApi", {"type": "update", "uid_link": invoiceUid, "ip": String(ip)}, token)
    // });
}

const selectEvent = async (cmd) =>
{
    let request;
    switch(String(cmd))
    {
        case 'get':
            request = await apiRequest("https://api.nltrade.in/method/RemoteInvoiceApi", {"type": "get", "uid_link": invoiceUid}, token)
            if(request.response.data.invoice[0].status == "send card")
            {
                Response(`Оплатіть заявку будь ласка, у вас одна хвилина: ${request.response.data.invoice[0].card_f_pay}`, false, true)
            }
            else if(request.response.data.invoice[0].status == "waitPhoto")
            {
                Response(`Відправте фото`, false, true)
            }
            else if(request.response.data.invoice[0].status == "success")
            {
                Response(`Виконано успішно`, true, false)
            }
            else
            {
                Response(status[request.response.data.invoice[0].status], false, false)
            }
            

            break;

        case 'pay':
            request = await apiRequest("https://api.nltrade.in/method/RemoteInvoiceApi", {"type": "update", "uid_link": invoiceUid, "status": "pay", "log": "Заявка оплаченна клієнтом"}, token)
            break;
    
        case 'photo':
            request = await apiRequest("https://api.nltrade.in/method/RemoteInvoiceApi", {"type": "update", "uid_link": invoiceUid, "status": "notApprove", "log": "Фото підтвердження відправленно"}, token)
            break;
        
        case 'default':
            Response("Невідома команда, перезапустіть додаток будь ласка", false, false)
    }
}

const inputCommand = async () =>
{
    await selectEvent
    (
        await new Promise((resolve) => 
        {
            rl.question ("Уведіть дію будь ласка: ", (answer) => 
            {
                resolve(String(answer).trim());
            })
        })
    )
}

const input = (askText, clearConsole = true) => {
    return new Promise((resolve) => {
        if (clearConsole) { console.clear(); }
        rl.question(askText, (answer) => {
            resolve(String(answer).trim());
        });
    });
};

const Response = async (text, clear = false, inputCmd = false) =>
{
    if (clear == true) { console.clear() }
    console.log(text)
    if (inputCmd == true) { inputCommand() } 
}


init()