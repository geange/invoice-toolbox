import { Body, getClient, ResponseType } from '@tauri-apps/api/http'
import { readBinaryFile } from '@tauri-apps/api/fs'
import { Base64 } from './base64'

export const getToken = async (ak, sk) => {
    const client = await getClient()
    return await client.get("https://aip.baidubce.com/oauth/2.0/token", {
        query: {
            grant_type: "client_credentials",
            client_id: ak,
            client_secret: sk,
        },
        timeout: 30,
        responseType: ResponseType.JSON
    })
}

export const getVatInvoice = async (token, filePath) => {
    const vatInvoiceApi = 'https://aip.baidubce.com/rest/2.0/ocr/v1/vat_invoice'

    const contents = await readBinaryFile(filePath)

    const body = Body.form({ image: Base64(contents) })

    const options = {
        responseType: ResponseType.JSON,
        query: {
            access_token: token,
        }
    }

    const client = await getClient()
    return client.post(vatInvoiceApi, body, options)
}