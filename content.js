
const loginAlterHandler = createDOM($(document.body), function (props) {
    const loginHtml = findComponentTemplate('login')({
        ...getLoginInfo(),
    })
    const html = $(findComponentTemplate('maskLayer')({}, {
        default: () => loginHtml
    }))
    html.find("button#login-btn").click(function (evt) {
        let flag = true
        const formData = new FormData(html.find("form#login-form-options")[0])
        for (let w of formData) {
            if (!w[1]) {
                flag = false;
                break
            }
        }
        flag && evt.preventDefault()
        if (flag) {
            console.log("发送");
            props.destroy()
            nationalPumpPush();
        }
        setLoginInfo(formData.get('account'), formData.get('password'))
    })
    html.find("a.login-close-btn").click(() => {
        props.destroy()
    })
    return html
})

const { alreadyPushedData, pushStatusLoading, pushStatusErrorTip, buttonsRef, obsTreeStr, obsDOMTrMps, obsDOMTrMps2, trCurrentDataMps, trMps, currentId, currentCYDNumber, currentFuncStatus, currentTaskMainRootEl } = window.globalState;

obsDOM(obsTreeStr, (v) => {
    v.children().each((i, v) => {
        if (trMps.has(v)) return
        trMps.set(v, true)
        $(v).click(() => {
            currentId.value = null
            pushStatusErrorTip.value = null
            if (toValue(obsDOMTrMps)) toValue(obsDOMTrMps)();
            currentId.value = $(v).attr('id')
        })
    })
});

watch(currentId, v => {
    if (v) {
        obsDOMTrMps2.value = obsDOM(`div.taskMain div#LIMSTestReportApproveDetail>table tbody .childDiv table.resizabletable tbody`, function (v) {
            const tds = v.find('td>span')
            currentCYDNumber.value = findtdsValue2(tds, "抽样单号：")
            {
                const wtddwName = findtdsValue2(tds, "检测类型：")
                const validateVal = "食品安全监督抽检"
                if (wtddwName.length && wtddwName.indexOf(validateVal) > -1) {
                    obsDOMTrMps.value = obsDOM('div.taskMain ul#_sys_TabMain div.reportListPages', (root) => {
                        currentTaskMainRootEl.value = root
                        getCurrentPushData()
                    })
                }
            }
        })
    }
}, {
    flush: 'sync'
})

function createButtonHook2() {
    let scoped = null
    return (rootEl) => {
        if (scoped) {
            scoped.stop()
        }
        createDOM(rootEl || $(document.body), function ({ props, destroy }) {
            return findComponentTemplate('pushButton')({}, {}, {
                update: () => {
                    pushStatusErrorTip.value = null
                    sendCurrentMessage()
                },
                setScoped(v) {
                    scoped = v
                    return v
                }
            })
        })({ a: 123 })
    }
}

const createButtonState = createButtonHook2()

function createButtonHook(rootEl) {
    return createButtonState(rootEl)
}

function getCurrentPushData() {
    if (toValue(currentTaskMainRootEl) && toValue(currentId)) {
        currentFuncStatus.value = true
        createButtonTSGC(toValue(currentTaskMainRootEl))
    } else {
        pushStatusErrorTip.value = "操作异常"
    }
}

function createButtonTSGC(root) {
    const btns = root.find('button#push-btn-gg-pl')
    btns.each((i, s) => {
        if (i === btns.length - 1) return
        s.remove()
    })
    if (!root.find('button#push-btn-gg-pl').length && !pushStatusErrorTip.value) {
        createButtonHook(root)
        closeDislogHandle(root)
        sendCurrentMessage()
    }
}

function sendCurrentMessage(){
    pushStatusLoading.value = true
    chrome.runtime.sendMessage({ type: "TABLECLICK", id: currentId.value });
}

function closeDislogHandle(root) {
    obsDOM('.taskMain .closeTaskBot span', function (v) {
        v[0].removeEventListener('click', closeDislogHandle2, false)
        v[0].addEventListener('click', closeDislogHandle2, false)
    })
}

const createCloseDialog = createDOM($(document.body), function (props) {
    const closeDialog = $(findComponentTemplate('closeDialog')({ destroy: props.destroy }, {
        default: () => $(`<h4 style="font-weight:600;">前数据可推送国抽，是否继续 ？</h4>`)
    }, {
        cancel() {
            commontjs()
        },
        confirm() {
            nationalPumpPush()
            commontjs()
        }
    }))
    function commontjs() {
        currentId.value = null
    }
    const html = $(findComponentTemplate('maskLayer')({}, {
        default: () => closeDialog
    }))
    return html
})

function closeDislogHandle2(evt) {
    if (!alreadyPushedData.has(currentId.value) && toValue(currentFuncStatus))
        createCloseDialog()
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    console.log(request, "content");
    switch (request.type) {
        case 'RESPONSECOMPLETE':
            trCurrentDataMps.set(currentId.value, request.message)
        case 'RESPONSECOMPLETEERROR':
            pushStatusLoading.value = false
            if (request.type === "RESPONSECOMPLETEERROR") {
                pushStatusErrorTip.value = request.message
                trCurrentDataMps.delete(currentId.value)
            }
            break
    }
});
