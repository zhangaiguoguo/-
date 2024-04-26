const { ref, watch, useStateRef, useEffectRef, effectScope, toValue, useUpdate, useEffect, useEffectPre, useState } = window.hooks

window.globalState = {
    alreadyPushedData: new Map(),
    pushStatusLoading: ref(false),
    pushStatusErrorTip: ref(null),
    currentCreateButton: null,
    buttonsRef: ['push-national-draw', 'again-refresh', 'btn-login'],
    obsTreeStr: "div.main div.content #gbox_list table#list tbody",
    trCurrentDataMps: new Map(),
    trMps: new Map(),
    obsDOMTrMps: ref(null),
    obsDOMTrMps2: ref(null),
    currentId: ref(null),
    prevCurrentId: ref(null),
    currentCYDNumber: ref(null),
    currentFuncStatus: ref(null),
    currentTaskMainRootEl: ref(null),
    createDOMATTRREFS: ['el-attr-ref', '-value-'],
    currentVerificationCode: ref(null),
    currentLoginStatus: ref(null),
    currentLoginStatusErrorTip: ref(null),
    currentLoginStatusFlag: ref(false),
    currentDataIsPushGC: ref(false),
    currentUuid: ref(null)
}

window.components = []

function findComponent(name) {
    return window.components.find(i => i.name === name)
}

function findComponentTemplate(name) {
    return findComponent(name).render
}
function modelValueInput(options) {
    const mps = new Map()
    const _options = options
    function input(evt) {
        mps.get(evt.target).trigger(evt, evt.target.value)
    }
    const root = _options.root || document.body
    return (el, track, trigger) => {
        const perms = [0, 0, 0]
        const _el = $(root).find(el)
        if (_el.length) {
            $(_el).val(track())
            if (_el[0].MODELVALUEINPUTHOOKS) {
                if (_el[0].MODELVALUEINPUTHOOKS.input === input) {
                    perms[0] = 1
                }
            }
            !perms[0] && $(_el).on('input', input)
            mps.set(_el[0], { track, trigger })
        }
    }
}


function findtdsValue2(tds, k) {
    return tds.filter((i, e) => $(e).html() === k).parent().next().find(".btn-group ._sCtFs").val() || ""
}

function createComponent(el, callback) {
    const createDOMATTRREFS = globalState.createDOMATTRREFS
    let $el = null
    let render = null
    function setRender() {
        render = hooks.renderScheduler((props) => {
            if ($el) {
                $el.remove()
            }
            $el = $(callback({
                props, destroy: () => $el.remove(), refresh: () => {
                    setRender()
                }
            })).attr(createDOMATTRREFS[0], createDOMATTRREFS[0] + createDOMATTRREFS[1] + Date.now())
            return $(el).append($el)
        })
    }
    setRender()
    const update = (props = {}) => {
        return render({
            ...props, updateScheduler: update,
        })
    }
    return update
}

function getLoginInfo() {
    try {
        return unzip(getCookie('loginInfo'))
    } catch (e) { }
    return {}
}

function setLoginInfo(account, password, token) {
    return setCookie('loginInfo', zip({ account, password, token, state: 1 }))
}
function removeLoginInfo() {
    return removeCookie('loginInfo')
}

// 压缩
window.zip = (data) => {
    if (!data) return data;
    // 判断数据是否需要转为JSON
    const dataJson = typeof data !== "string" && typeof data !== "number" ? JSON.stringify(data) : data;

    // 使用Base64.encode处理字符编码，兼容中文
    const str = Base64.encode(dataJson);
    let binaryString = pako.gzip(str);
    let arr = Array.from(binaryString);
    let s = "";
    arr.forEach((item, index) => {
        s += String.fromCharCode(item);
    });
    return btoa(s);
};

// 解压
window.unzip = (b64Data) => {
    let strData = atob(b64Data);
    let charData = strData.split("").map(function (x) {
        return x.charCodeAt(0);
    });
    let binData = new Uint8Array(charData);
    let data = pako.ungzip(binData);

    // ↓切片处理数据，防止内存溢出报错↓
    let str = "";
    const chunk = 8 * 1024;
    let i;
    for (i = 0; i < data.length / chunk; i++) {
        str += String.fromCharCode.apply(null, data.slice(i * chunk, (i + 1) * chunk));
    }
    str += String.fromCharCode.apply(null, data.slice(i * chunk));
    // ↑切片处理数据，防止内存溢出报错↑

    const unzipStr = Base64.decode(str);
    let result = "";

    // 对象或数组进行JSON转换
    try {
        result = JSON.parse(unzipStr);
    } catch (error) {
        if (/Unexpected token o in JSON at position 0/.test(error)) {
            // 如果没有转换成功，代表值为基本数据，直接赋值
            result = unzipStr;
        }
    }
    return result;
};

{
    $.fn.hidden = function () {
        if (this.length) {
            return getComputedStyle(this[0]).display !== "none"
        }
        return false
    }
}


function observerNode(obsTreeStr, callback) {
    let id = null;
    let flag = true
    let getNum = 0
    function run() {
        cancelAnimationFrame(id);
        if (!flag) return
        id = requestAnimationFrame(() => {
            const el = $(obsTreeStr)
            if (!el.length) {
                return run();
            } else if (!getNum) {
                callback(el)
                cancelAnimationFrame(id);
            }
            if (!flag) return
            const obss = new MutationObserver((v) => {
                if (!flag) return obss.disconnect();
                if ($(obsTreeStr)[0] !== el[0]) {
                    run();
                    return obss.disconnect();
                }
                getNum && callback(el);
            });
            obss.observe(el[0], {
                "childList": true,
            });
            getNum++
        });
    }

    run();
    return () => {
        flag = false
    }
}

const keys = ['TastConclusion', 'TestBasis']

function nationalPumpPush() {
    globalState.currentDataIsPushGC.value = false
    if (!trCurrentDataMps.has(currentId.value)) {
        return pushStatusErrorTip.value = "数据获取异常，无法推送"
    }
    if (!toValue(globalState.currentLoginStatusFlag)) {
        globalState.currentDataIsPushGC.value = true
        return getLoginStatus()
    }
    const row = trCurrentDataMps.get(currentId.value)
    if (row.info[keys[0]] === "不合格") {
        tastConclusionMaskLayer()
    } else if ((row.info[keys[1]] || "").indexOf("Q/") !== -1) {
        createUpLoadFileNode()
    } else {
        pushCurrentData()
    }
}


const queue = []
const JOB_KEY = Symbol("job_id")
let isFlushing;

function queueJob(job, ...args) {
    const i = queue.findIndex(i => i === job || i[JOB_KEY] === job[JOB_KEY])
    job.args = args
    if (i === -1) {
        job[JOB_KEY] = Date.now() + queue.length + 1
        queue.push(job);
    } else
        queue.splice(i, 1, job);

    queueFlush()
}

const resolvedPromise = Promise.resolve()

function queueFlush() {
    if (!isFlushing) {
        currentFlushPromise = resolvedPromise.then(flushJobs)
    }
}

function callWithErrorHandling(fn, args) {
    let res;
    try {
        res = args ? fn(...args) : fn();
    } catch (err) {
    }
    return res;
}

function flushJobs(seen) {
    isFlushing = true
    seen = seen || new Map()
    const check = (job) => checkRecursiveUpdates(seen, job);
    try {
        for (let w = 0; w < queue.length; w++) {
            const cb = queue[w]
            if (check(cb)) {
                continue;
            }
            queue.splice(w, 1)
            w--
            callWithErrorHandling(cb, cb.args)
        }
    } finally {
        queue.length = 0
        isFlushing = false
    }
}

const RECURSION_LIMIT = 100;

function checkRecursiveUpdates(seen, fn) {
    if (!seen.has(fn)) {
        seen.set(fn, 1);
    } else {
        const count = seen.get(fn);
        if (count > RECURSION_LIMIT) {
            return true;
        } else {
            seen.set(fn, count + 1);
        }
    }
}


function getLoginStatus() {
    chrome.runtime.sendMessage({
        type: "LOGINSTATUS", message: {
            ...globalState.trCurrentDataMps.get(toValue(globalState.currentId)),
            ...getLoginInfo(),
            uuid: globalState.currentUuid.value
        }
    })
}

function delay(time = 20) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve()
        }, time)
    })
}

function pushCurrentData(status = 1, options = {}) {
    if (status == 1) {
        alreadyPushedData.set(currentId.value,)
        console.log("当前推送数据：", trCurrentDataMps.get(currentId.value), toValue(currentCYDNumber));
    } else {
        alreadyPushedData.delete(currentId.value)
    }
    globalState.pushStatusLoading.value = true
    chrome.runtime.sendMessage({
        type: "PUSHSTATUS", message: {
            ...trCurrentDataMps.get(currentId.value),
            sampleNumber: toValue(globalState.currentCYDNumber), id: toValue(globalState.currentId),
            flag: status,
            files: options.files,
            processId: toValue(globalState.currentUuid)
        }
    })
    currentId.value = null
    return
    if (status) {
    } else {
        chrome.runtime.sendMessage({
            type: "CANCELPUSH", message: {
                uuid: toValue(globalState.currentUuid),
            }
        })
    }
}