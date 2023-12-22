import fs from 'fs';
import fetch from 'node-fetch';
import crypto from 'crypto';

const caesarEncrypt = (str, amount) => 
{
    if (amount < 0) 
    {
        amount += 26;
    }

    let output = '';
    for (let i = 0; i < str.length; i++) 
    {
        let c = str.charAt(i);
        if (/[a-z]/i.test(c)) 
        {
            let code = str.charCodeAt(i);
            if (code >= 65 && code <= 90) 
            {
                c = String.fromCharCode(((code - 65 + amount) % 26) + 65);
            } 
            else if (code >= 97 && code <= 122) 
            {
                c = String.fromCharCode(((code - 97 + amount) % 26) + 97);
            }
        }
        output += c;
    }
    return output;
};

const getKey = async () => 
{
    const rawData = await fs.promises.readFile("./src/data/key.pem", 'utf8');

    return String(rawData);
};

const getLatestRsaPublicKey = async (access_token) =>
{
    const request = await fetch("https://api.nltrade.in/helpers/getLatestPublicRemoteRsaKey.php", { method: "POST", headers: {'Content-Type': 'application/x-www-form-urlencoded'}, body: `access_token=${access_token}`});
    const jsonResponse = await request.json()

    if(jsonResponse.response?.data?.result)
    {
        const rsaKey = caesarEncrypt(atob(jsonResponse.response.data.result), -13)
        return String(rsaKey);
    }
}

export const apiRequest = async (url, options, access_token) =>
{
    ///Not long fix
    const publicKey = await getLatestRsaPublicKey(access_token);
    const verificationWord = "bandasosamba"

    const formDataWithVerification = 
    {
        ...options,
        verificationWord,
    };

    const encrypted = crypto.publicEncrypt
    (
        {
            key: publicKey,
            padding: crypto.constants.RSA_PKCS1_PADDING
        }, 
        Buffer.from(JSON.stringify(formDataWithVerification), 'utf-8')
    ).toString('base64');

    const request = await fetch(url, 
    {
        method: 'POST',
        body: JSON.stringify({ data: encrypted, access_token }),
        headers: 
        {
            'Content-Type': 'application/json',
        }
    });

    const text = await request.text()
    let json = ''

    try 
    {
        json = JSON.parse(text)
    }
    catch(e)
    {
        throw new Error(text);
    }

    if (!request.ok) 
    {
        if (json.message) 
        {
            if (json.message === 'Your key is too old') 
            {
                await getLatestRsaPublicKey(access_token);
                return apiRequest(url, ...options, access_token);
            }
            else throw new Error(json.message);
        }
    }

    return json;
};
