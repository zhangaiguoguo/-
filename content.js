const { alreadyPushedData, pushStatusLoading, pushStatusErrorTip, buttonsRef, obsTreeStr, obsDOMTrMps, obsDOMTrMps2, trCurrentDataMps, trMps, currentId, currentCYDNumber, currentFuncStatus, currentTaskMainRootEl, currentVerificationCode, currentLoginStatus, currentLoginStatusErrorTip, currentLoginStatusFlag, currentDataIsPushGC, prevCurrentId, currentUuid } = window.globalState;

const loginAlterHandler = createComponent($(document.body), function (props) {
    currentLoginStatus.value = props.destroy
    return findComponentTemplate('login')({
        ...getLoginInfo(),
    }, {
        destroy: props.destroy
    })
})

const createUpLoadFileNode = createComponent($(document.body), function (props) {
    return findComponentTemplate('elUpdateFile')({
    }, {}, {
        destroy: props.destroy,
        async submit(fileList) {
            const fileUrls = []
            pushStatusLoading.value = true
            try {
                for await (let file of fileList) {
                    const reader = new FileReader()
                    reader.readAsDataURL(file)
                    const result = await new Promise((resolve, reject) => {
                        reader.onload = ({ target: { result } }) => {
                            resolve(result)
                        }
                    })
                    fileUrls.push(result)
                }
            } catch (er) {

            }
            pushStatusLoading.value = false
            pushCurrentData(1, {
                files: fileUrls
            })
            props.destroy()
            props.refresh()
        }
    })
})

const tastConclusionMaskLayer = createComponent($(document.body), function (props) {
    return findComponentTemplate('maskLayer')({}, {
        default: () => {
            return findComponentTemplate("closeDialog")({}, {
                default: () => {
                    return `<h4 style="font-weight:600;">是否要12小时现时报？</h4>`
                }
            }, {
                cancel() {
                    pushCurrentData()
                },
                confirm() {
                    createUpLoadFileNode()
                },
                destroy: props.destroy
            })
        }
    })
})

// loginAlterHandler()

observerNode(obsTreeStr, (v) => {
    v.children().each((i, v) => {
        if (trMps.has(v)) return
        trMps.set(v, true)
        $(v).click(() => {
            queueJob(triggerSampleData, v)
        })
    })
});

async function triggerSampleData(v) {
    await delay()
    if (!$('div.main>div.taskMain').hidden()) {
        return
    }
    const currentSampleId = $(v).attr('id')
    console.log(currentSampleId, $(v).find("td[aria-describedby=list_SamplingNO]").text());
    if (currentId.value === currentSampleId) return
    if (currentId.value && currentId.value !== currentSampleId) {
        await new Promise((resolve) => {
            closeDislogHandle2(resolve)
        })
    }
    if (!$(v).find("td[aria-describedby=list_SamplingNO]").text()) {
        destroyTSGCElements(toValue(currentTaskMainRootEl))
        return
    }
    resize()
    currentId.value = currentSampleId
}

function releaseEffect() {
    obsDOMTrMps.value?.();
    obsDOMTrMps2.value?.()
}

let isTriggerCount = 0

function setTriggerCount() {
    isTriggerCount++
}

watch(currentId, v => {
    releaseEffect()
    if (v) {
        obsDOMTrMps2.value = observerNode(`div.taskMain div#LIMSTestReportApproveDetail>table tbody .childDiv table.resizabletable tbody`, function (v) {
            if (isTriggerCount) return
            const tds = v.find('td>span')
            currentCYDNumber.value = findtdsValue2(tds, "抽样单号：")
            {
                const wtddwName = findtdsValue2(tds, "检测类型：")
                const validateVal = "食品安全监督抽检"
                if (wtddwName.length && wtddwName.indexOf(validateVal) > -1) {
                    obsDOMTrMps.value = observerNode('div.taskMain ul#_sys_TabMain div.reportListPages', (root) => {
                        releaseEffect()
                        currentTaskMainRootEl.value = root
                        getCurrentPushData()
                    })
                }
            }
        })
    }
}, {
})

function createButtonHook2() {
    let scoped = null
    return (rootEl) => {
        if (scoped) {
            scoped.stop()
        }
        createComponent(rootEl || $(document.body), function ({ props, destroy }) {
            return findComponentTemplate('pushButton')({}, {}, {
                update: () => {
                    pushStatusErrorTip.value = null
                    sendCurrentMessage()
                },
                login: () => {
                    loginAlterHandler()
                },
                setScoped(v) {
                    scoped = v
                    return v
                }
            })
        })({})
    }
}

const createButtonState = createButtonHook2()

function createButtonHook(rootEl) {
    return createButtonState(rootEl)
}

function destroyTSGCElements(root = toValue(currentTaskMainRootEl)) {
    root && root.find("div.btn-group-box-hij").remove()
}

function getCurrentPushData() {
    if (toValue(currentTaskMainRootEl) && toValue(currentId)) {
        currentFuncStatus.value = true
        createButtonTSGC()
    } else {
        pushStatusErrorTip.value = "操作异常"
    }
}

function destroyButtonTSGC(root) {
    const btns = root.find('button#push-btn-gg-pl')
    btns.each((i, s) => {
        s.remove()
    })
}

function createButtonTSGC(root = toValue(currentTaskMainRootEl)) {
    destroyTSGCElements()
    if (!root.find('button#push-btn-gg-pl').length && !pushStatusErrorTip.value) {
        createButtonHook(root)
        closeDislogHandle(root)
        sendCurrentMessage()
    }
}

function sendCurrentMessage() {
    pushStatusLoading.value = true
    chrome.runtime.sendMessage({ type: "TABLECLICK", id: currentId.value });
}

function closeDislogHandle(root) {
    observerNode('.taskMain .closeTaskBot span', function (v) {
        v[0].removeEventListener('click', closeDislogHandle2, false)
        v[0].addEventListener('click', closeDislogHandle2, false)
    })
}

const createCloseDialog = createComponent($(document.body), function (props) {
    const closeDialog = $(findComponentTemplate('closeDialog')(props, {
        default: () => $(`<h4 style="font-weight:600;">当前数据可推送国抽，是否继续 ？</h4>`)
    }, {
        cancel() {
            if (toValue(currentLoginStatusFlag)) {
                pushCurrentData(0)
            }
            commontjs()
        },
        confirm() {
            nationalPumpPush()
            commontjs()
        },
        destroy: props.destroy
    }))
    function commontjs() {
        if (props.props.callback) {
            props.props.callback()
        } else {
            destroyTSGCElements()
        }
    }
    const html = $(findComponentTemplate('maskLayer')({}, {
        default: () => closeDialog
    }))
    return html
})

function resize() {
    pushStatusLoading.value = false
    pushStatusErrorTip.value = null
    prevCurrentId.value = null
    currentId.value = null
}

function closeDislogHandle2(arg) {
    if (!alreadyPushedData.has(currentId.value) && toValue(currentFuncStatus))
        createCloseDialog({
            callback: typeof arg === "function" ? arg : null
        })
}

const ResponseStatus = {
    RESPONSECOMPLETE(message) {
        trCurrentDataMps.set(currentId.value, message)
        getLoginStatus()
    },
    RESPONSECOMPLETEERROR(message) {
        pushStatusErrorTip.value = message
        trCurrentDataMps.delete(currentId.value)
    },
    LOGINSTATUSRESPONSE(message) {
        pushStatusLoading.value = false
        const FLAGKEY = "status"
        if (message.code === 200) {
            currentLoginStatusFlag.value = message.data[FLAGKEY]
            if (!message.data[FLAGKEY]) {
                currentVerificationCode.value = message.data.value
                loginAlterHandler()
            } else {
                if (toValue(currentDataIsPushGC)) {
                    currentUuid.value = message.data.processId
                    nationalPumpPush()
                }
            }
        } else {
            pushStatusErrorTip.value = "请求异常，重新操作一下"
        }
    },
    PUSHSTATUSRESPONSE(message) {
        pushStatusLoading.value = false
        if (message.code === 200) {
            if (message.data.status) {
                return
            }
        } else {
            pushStatusErrorTip.value = "请求异常，重新操作一下"
            alreadyPushedData.delete(message.id)
        }
    },
    LOGINRESPONSE(message) {
        pushStatusLoading.value = false
        currentLoginStatus.value?.()
        if (message.code === 200) {
            currentLoginStatusFlag.value = message.data.status
            if (message.data.status) {
                currentUuid.value = message.data.processId
                if (toValue(currentDataIsPushGC)) {
                    nationalPumpPush()
                }
            } else {
                currentVerificationCode.value = message.data.data || message.data.value
                loginStatusError()
            }
        } else {
            loginStatusError()
            currentLoginStatusFlag.value = false
        }
    }
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    console.log(request, "content");
    const message = request.message
    switch (request.type) {
        case 'RESPONSECOMPLETE':
            ResponseStatus.RESPONSECOMPLETE(message)
            break
        case 'RESPONSECOMPLETEERROR':
            ResponseStatus.RESPONSECOMPLETEERROR(message)
            break
        case 'LOGINSTATUSRESPONSE':
            ResponseStatus.LOGINSTATUSRESPONSE(message)
            break
        case "PUSHSTATUSRESPONSE":
            ResponseStatus.PUSHSTATUSRESPONSE(message)
            break
        case "LOGINRESPONSE":
            ResponseStatus.LOGINRESPONSE(message)
            break

    }
});

function loginStatusError() {
    currentLoginStatusErrorTip.value = "请求异常，重新操作一下"
    removeLoginInfo()
    loginAlterHandler()
}