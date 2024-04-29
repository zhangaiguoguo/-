import { baseUrl, prems, url1, url1Key, url2, url2Query, onBeforeSendHeadersOptions, createCurrentDataTask, runCurrentDataTask, sendMessage, addSendHeaders, sendHeadersHas, createDataMp, dataURLtoBlob } from "./utils/index.js"

let isAutoGenerateXmlHeader = true

console.log(chrome, Date.now());

let preSocket = null

function createSocker(name) {
    if (preSocket) {
        preSocket.close()
    }
    const socker = new WebSocket("ws" + loginstatusUrl.slice(4) + "/ws/" + name)
    preSocket = socker
    socker.onopen = function () {

        console.log('socker open');
    }

    socker.onclose = function () {

        console.log('socker close');
    }

    socker.onerror = function () {

        console.log('socker error');
    }

    socker.onmessage = function ({ data }) {
        sendMessage({
            type: "SOCKERRESPONSE", message: {
                code: 200, data: data
            }
        })
    }
}

class NationalPushAPI {
    constructor(args) {
        this.baseUrl = args.baseUrl
    }

    login(message) {
        fetch(this.baseUrl + "/login", {
            method: "POST",
            body: JSON.stringify({
                info: message.info,
                items: message.items,
                allItems: message.allItems,
                username: message.nickname,
                password: message.password,
                captcha: message.captcha,
                uid: message.uuid
            }),
            headers: { 'Content-Type': 'application/json' }
        }).then(res => res.json()).then(res => {
            if (res.status) {
                createSocker(message.account)
            }
            sendMessage({
                type: "LOGINRESPONSE", message: {
                    code: 200, data: res
                }
            })
        }).catch(err => {
            sendMessage({
                type: "LOGINRESPONSE", message: {
                    code: 500
                }
            })
        })
    }

    loginStatus(message) {
        fetch(this.baseUrl + "/loginstatus", {
            method: "post",
            body: JSON.stringify({
                info: message.info,
                items: message.items,
                allItems: message.allItems,
                nickname: message.account,
                password: message.password,
                uid: message.uuid,
            }),
            headers: { 'Content-Type': 'application/json' }
        }).then(res => res.json()).then(res => {
            if (res.status) {
                createSocker(message.account)
            }
            sendMessage({
                type: "LOGINSTATUSRESPONSE", message: {
                    code: 200, data: message.isInitFlag ? { status: true } : res
                }
            })
        }).catch(err => {
            sendMessage({
                type: "LOGINSTATUSRESPONSE", message: {
                    code: 500
                }
            })
        })
    }

    //推送
    pushStatus(message) {
        const files = message.files
        const files2 = message.files
        const formData = new FormData()
        if (files) {
            for (let w = 0; w < files.length; w++) {
                formData.append('standardFile', dataURLtoBlob(files[w]))
            }
        }
        if (files2) {
            for (let w = 0; w < files2.length; w++) {
                formData.append('limittimeFile', dataURLtoBlob(files2[w]))
            }
        }
        formData.append("pushinfo", JSON.stringify({
            info: message.info,
            items: message.items,
            allItems: message.allItems,
            account: message.nickname,
        }))
        if (message.enterpriseStandardName) {
            formData.append("enterpriseStandardName", message.enterpriseStandardName || "")
        }
        fetch(loginstatusUrl + "/pushdata", {
            method: "POST",
            body: formData,
        }).then(res => res.json()).then(res => {
            sendMessage({
                type: "PUSHSTATUSRESPONSE", message: {
                    code: 200, data: res, id: message.id
                }
            })
        }).catch(err => {
            sendMessage({
                type: "PUSHSTATUSRESPONSE", message: {
                    code: 500
                }
            })
        })
    }

    //切换数据时，取消推送
    cancelPush(message) {

        fetch(this.baseUrl + `/destroy/${message.uid}`, {
            method: "GET",
        }).then((res) => {
            console.log(res);
        })
    }
}

export default NationalPushAPI

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

const currentWindowUrls = ["http://127.0.0.1:5500", "http://192.168.0.28"]

const currentWindowUrl = currentWindowUrls[0] + "/test.html"

const loginstatusUrl = ("http://labhub-fsp.cpolar.cn")

const nationalPushAPI = new NationalPushAPI({
    baseUrl: loginstatusUrl
})

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    console.log(request, 'background');
    const message = request.message;
    switch (request.type) {
        case 'TABLECLICK':
            setCurrentDataId(request.id)
            break
        case "LOGIN":
            nationalPushAPI.login(message)
            break
        case "LOGINSTATUS":
            nationalPushAPI.loginStatus(message)
            break
        case "PUSHSTATUS":
            nationalPushAPI.pushStatus(message)
            break
        case "CANCELPUSH":
            nationalPushAPI.cancelPush(message)
            break
        case "GETTAGS":
            {
                chrome.tabs.query({
                }, (tabs) => {
                    let currentTab = null
                    for (let tab of tabs) {
                        if (tab.url.startsWith(currentWindowUrls[0]) || tab.url.startsWith(currentWindowUrls[1])) {
                            currentTab = tab
                            break
                        }
                    }
                    if (currentTab) {
                        chrome.tabs.update(currentTab.id, { active: true }).then(() => {

                        })
                    } else {
                    }
                })
            }
            break
    }
});
