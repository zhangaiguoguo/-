
import eval5 from "./eval5.js"
export const baseUrl = `http://192.168.0.28`
// 对两个不同的viewID发起POST请求
export const prems = ['c4c08163-5e9e-4e96-913f-787ef0da6616', '6b30daab-8cc1-4908-84d6-284d96353b7f']
export const url1 = baseUrl + `/Data/CustomizeData`;
export const url1Key = "viewID"
// 发起GET请求
export const url2 = baseUrl + `/Data/CustomizeDataSingle`;

export const url2Query = `?viewID=a29ede6c-3481-4f86-8f3f-1b736c331632&keyValue=`


const sendHeaders = new Map()

const sendHeadersSet = sendHeaders.set.bind(sendHeaders)

sendHeaders.set = function set(...args) {
    const result = sendHeadersSet(...args)
    runCurrentDataTask()
    return result
}

export function clearSendHeaders() {
    return sendHeaders.clear()
}

export function addSendHeaders(...args) {
    return sendHeaders.set(...args)
}

export function sendHeadersHas(...args) {
    return sendHeaders.has(...args)
}

export function getSendHeaders(...args) {
    return sendHeaders.get(...args)
}


export const onBeforeSendHeadersOptions = [
    {
        urls: ["<all_urls>"]
    }, // 监听两种类型的请求
    ["requestHeaders"]
]


const currentDataTasks = []

export function runCurrentDataTask() {
    const _currentDataTasks = [...currentDataTasks]
    for (let w of _currentDataTasks) {
        if (!w.status) {
            w.status = !!w.run(w)
        }
    }
}

export function createCurrentDataTask(fn) {
    const run = () => fn()
    const info = { status: 0, run: run }
    let status = info.status
    Object.defineProperty(info, 'status', {
        get: () => status,
        set: v => {
            if (v) {
                const sub = currentDataTasks.findIndex(i => i.run === run);
                if (sub > -1) {
                    currentDataTasks.splice(sub, 1)
                }
            }
        }
    })
    currentDataTasks.push(info)
}

export function sendMessage(message, callback, errorCallback) {
    chrome.tabs.query({
        active: true,
        currentWindow: true
    }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, message).then((...args) => {
            callback && callback(...args)
        }).catch(err => {
            errorCallback && errorCallback(err)
        })
    })
}

const dataMps = new Map()

export function createDataMp(id) {
    const info = dataMps.set(id, {

        info: null,/*数据详情 {}*/

        items: null,/*数据项目 [{},{},...]*/

        allItems: null,/*数据项目2 [{},{},...]*/

        overXMLNum: 0,

        id: id
    }).get(id)
    return {
        async addOverXMLNum(v) {
            const cs = (info.overXMLNum++) + 1
            let flag = true
            switch (v) {
                case 1:
                    {
                        try {
                            const requestOptions = getSendHeaders(url1)
                            const formData = new URLSearchParams();
                            formData.append('_search', 'true');
                            formData.append('rows', '2147483647');
                            formData.append('page', '1');
                            formData.append('_blChild', 'true');
                            formData.append('fixRows', 'true');
                            formData.append('treeGrid', 'false');
                            formData.append('settingRowNum', '99999');
                            formData.append('pars', encodeURIComponent(JSON.stringify({
                                "sys_view_id": "",
                                "p_TaskID": id,
                                "_sys_ModelHasChanged": true
                            })));
                            const fetchOptions = {
                                ...requestOptions,
                                body: formData
                            }
                            const response = await Promise.all([fetch(`${url1}?${url1Key}=${prems[0]}`, fetchOptions).then(res => res.json()), fetch(`${url1}?${url1Key}=${prems[1]}`, fetchOptions).then(res => res.json())])
                            info.items = response[0]
                            info.allItems = response[1]
                        } catch (err) {
                            flag = false
                        }
                    }
                    break
                case 2:
                    {
                        try {
                            info.info = eval5.evaluate((await fetch(`${url2}${url2Query}` + id).then(res => res.text())))
                        } catch (err) {
                            flag = false
                        }
                    }
                    break
            }
            if (cs >= 2) {
                if (flag) {
                    sendMessage({ type: "RESPONSECOMPLETE", message: info })
                } else {
                    sendMessage({ type: "RESPONSECOMPLETEERROR", message: "获取数据异常，请重新操作" })
                }
            }
        }, info
    }
}

// dataURL转换为Blob
export const dataURLtoBlob = (dataUrl) => {
    let arr = dataUrl.split(','),
        mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[1]),
        n = bstr.length,
        u8arr = new Uint8Array(n)
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n)
    }
    return new Blob([u8arr], {
        type: mime,
    })
}