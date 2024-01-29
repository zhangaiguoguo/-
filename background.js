import { baseUrl, prems, url1, url1Key, url2, url2Query, onBeforeSendHeadersOptions, createCurrentDataTask, runCurrentDataTask, sendMessage, addSendHeaders, sendHeadersHas, createDataMp } from "./utils/index.js"

let isAutoGenerateXmlHeader = true

console.log(chrome,Date.now());

function onBeforeSendHeadersListener(res) {
    if (res.type === "xmlhttprequest") {
        for (let w of [url1, url2]) {
            if (res.url.startsWith(w)) {
                const requestHeaders = res.requestHeaders
                const headers = {}
                for (let w of requestHeaders) {
                    headers[w.name] = w.value
                }
                addSendHeaders(w, {
                    headers,
                    method: "post" || res.method,
                })
            }
        }
    }
}

function autoGenerateXmlHeader(flag) {
    if (isAutoGenerateXmlHeader) {
        flag && onBeforeSendHeadersListener({
            url: url1,
            requestHeaders: [{ value: "123", name: 'isToken' }],
            type: 'xmlhttprequest'
        })
        !flag && setTimeout(() => {
            onBeforeSendHeadersListener({
                url: url2,
                requestHeaders: [{ value: "123", name: 'isToken' }],
                type: 'xmlhttprequest'
            })
        }, 1000)
    }
}
autoGenerateXmlHeader(1)

// 添加请求完成的监听器
chrome.webRequest.onBeforeSendHeaders.addListener(
    onBeforeSendHeadersListener,
    ...onBeforeSendHeadersOptions
);


let currentDataId = null

function setCurrentDataId(id) {
    const { addOverXMLNum } = createDataMp(id)
    currentDataId = id

    for (let w of [url1, url2]) {
        createCurrentDataTask(() => {
            if (sendHeadersHas(w)) {
                addOverXMLNum(w === url1 ? 1 : 2)
                return true
            }
        })
    }
    runCurrentDataTask()
    autoGenerateXmlHeader(0)
}


chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    console.log(request, 'background');
    switch (request.type) {
        case 'TABLECLICK':
            setCurrentDataId(request.id)
            break
    }
});
