const { alreadyPushedData, pushStatusLoading, pushStatusErrorTip, buttonsRef, obsTreeStr, obsDOMTrMps, obsDOMTrMps2, trCurrentDataMps, trMps, currentId, currentCYDNumber, currentFuncStatus, currentTaskMainRootEl, currentVerificationCode, currentLoginStatus, currentLoginStatusErrorTip, currentLoginStatusFlag, currentDataIsPushGC, prevCurrentId, currentUuid, currentSampleFlag } = window.globalState;

let loginComponentDestroy;

const loginAlterHandler = createComponent($(document.body), function (props) {
    currentLoginStatus.value = props.destroy
    loginComponentDestroy = props.destroy
    return findComponentTemplate('login')({
        ...getLoginInfo(),
    }, {
        destroy: props.destroy,
        loginAlterHandler
    })
})

// loginAlterHandler()

async function parseReadAsDataURL(list) {
    let l = []
    for await (let file of list) {
        const reader = new FileReader()
        reader.readAsDataURL(file)
        const result = await new Promise((resolve, reject) => {
            reader.onload = ({ target: { result } }) => {
                resolve(result)
            }
        })
        l.push([file.name, result])
    }
    return l
}

const createUpLoadFileNode = createComponent($(document.body), function (props) {
    return findComponentTemplate('elUpdateFile')({
    }, props, {
        destroy: props.destroy,
        async submit(options) {
            pushStatusLoading.value = true
            try {
                var fileUrls = await parseReadAsDataURL(options.files || [])
                var fileUrls2 = await parseReadAsDataURL(options.limittimeFile)
            } catch (er) {

            }
            pushCurrentData(1, {
                files: fileUrls,
                limittimeFile: fileUrls2,
                enterpriseStandardName: options.enterpriseStandardName,
                id:props.id
            })
            pushStatusLoading.value = false
            props.destroy()
            props.refresh()
        }
    })
})

// createUpLoadFileNode()

const tastConclusionMaskLayer = createComponent($(document.body), function (props) {
    return findComponentTemplate('maskLayer')(props, {
        default: () => {
            return findComponentTemplate("closeDialog")({}, {
                default: () => {
                    return `<h4 style="font-weight:600;">是否要12小时限时报？</h4>`
                }
            }, {
                cancel() {
                    currentSampleFlag.value[0] = false
                    if (toValue(currentSampleFlag)[1]) {
                        createUpLoadFileNode(props)
                    } else {
                        pushCurrentData()
                    }
                },
                confirm() {
                    createUpLoadFileNode(props)
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
    await delay(100)
    if (!$('div.main>div.taskMain').hidden()) {
        return
    }
    const currentSampleId = $(v).attr('id')
    if (currentId.value && currentId.value !== currentSampleId) {
        await new Promise((resolve) => {
            closeDislogHandle2(resolve)
        })
    }
    if (!$(v).find("td[aria-describedby=list_SamplingNO]").text().trim()) {
        destroyTSGCElements(toValue(currentTaskMainRootEl))
        resize()
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
        obsDOMTrMps2.value = observerNode(`div.taskMain div#LIMSTestReportApproveDetail div.childDiv>table#${'tb4a034014-5582-8b59-bc71-4e74cf4ae623'}>tbody`, function (v) {
            const tds = v.find('td>span')
            currentCYDNumber.value = findtdsValue2(tds, "抽样单号：")
            {
                const wtddwName = findtdsValue2(tds, "检测类型：")
                const validateVal = "食品安全监督抽"
                if (wtddwName.length && wtddwName.indexOf(validateVal) > -1) {
                    obsDOMTrMps.value = observerNode('div.taskMain ul#_sys_TabMain div.reportListPages', (root) => {
                        releaseEffect()
                        currentTaskMainRootEl.value = root
                        getCurrentPushData()
                    })
                } else {
                    if (wtddwName.length)
                        currentId.value = null
                }
            }
        })
    } else {
        destroyTSGCElements()
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
                    if (!trCurrentDataMps.has(currentId.value)) {
                        sendCurrentMessage()
                    } else {
                        nationalPumpPush(toValue(currentId));
                    }
                    pushStatusErrorTip.value = null
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
    removeCloseTaskBotBtnEffect()
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

let closeTaskBotBtn = null

function removeCloseTaskBotBtnEffect() {
    if (closeTaskBotBtn) {
        closeTaskBotBtn[0].removeEventListener('click', closeDislogHandle2, false)
    }
}

function closeDislogHandle(root) {
    if (currentId.value)
        observerNode('.taskMain .closeTaskBot span', function (v) {
            closeTaskBotBtn = v
            removeCloseTaskBotBtnEffect()
            v[0].addEventListener('click', closeDislogHandle2, false)
        })
}

const createCloseDialog = createComponent($(document.body), function (props) {
    const closeDialog = $(findComponentTemplate('closeDialog')(props, {
        default: () => $(`<h4 style="font-weight:600;">当前数据可推送国抽，是否继续 ？</h4>`)
    }, {
        cancel() {
            if (toValue(currentLoginStatusFlag)) {
                // pushCurrentData(0)
            }
            commontjs()
        },
        confirm() {
            const id = toValue(currentId)
            const stop = watch(() => trCurrentDataMps.get(id), (v) => {
                if (v && v.allItems) {
                    nationalPumpPush(id)
                    setTimeout(() => {
                        stop()
                    })
                }
            }, {
                immediate: true
            })
            commontjs()
        },
        destroy: props.destroy
    }))
    function commontjs() {
        currentId.value = null
        if (props.props.callback) {
            props.props.callback()
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

function closeDislogHandle2(arg, id = currentId.value) {
    const reslove = typeof arg === "function" ? arg : null
    if (!alreadyPushedData.has(id)) {
        createCloseDialog({
            callback: reslove
        })
    } else {
        reslove?.()
    }
}

let isInitFlag = false

const ResponseStatus = {
    RESPONSECOMPLETE(message) {
        trCurrentDataMps.set(message.info.ID, message)
        pushStatusLoading.value = false
        if (!isInitFlag) {
            getLoginStatus(true)
            isInitFlag = true
        }
    },
    RESPONSECOMPLETEERROR(message) {
        pushStatusErrorTip.value = message
        trCurrentDataMps.delete(currentId.value)
        addNotification({
            type: 3,
            message: message
        })
    },
    LOGINSTATUSRESPONSE(message) {
        pushStatusLoading.value = false
        const FLAGKEY = "status"
        if (message.code === 200) {
            currentLoginStatusFlag.value = message.data[FLAGKEY]
            if (!message.data[FLAGKEY]) {
                currentVerificationCode.value = createBlobUrl(message.data.value)
                loginAlterHandler()
            } else {
                if (toValue(currentDataIsPushGC)) {
                    currentUuid.value = message.data.processId
                    nationalPumpPush(toValue(message.id || currentId))
                }
            }
        } else {
            pushStatusErrorTip.value = "请求异常，重新操作一下"
            addNotification({
                type: 3,
                message: "请求异常，重新操作一下"
            })
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
            addNotification({
                type: 3,
                message: "请求异常，重新操作一下"
            })
        }
    },
    LOGINRESPONSE(message) {
        currentLoginStatus.value?.()
        if (message.code === 200) {
            currentLoginStatusFlag.value = message.data.status
            if (message.data.status) {
                currentUuid.value = message.data.processId
                if (toValue(currentDataIsPushGC)) {
                    nationalPumpPush(toValue(currentId.value))
                }
                loginComponentDestroy && loginComponentDestroy()
            } else {
                currentVerificationCode.value = createBlobUrl(message.data.data || message.data.value)
                loginStatusError()
            }
        } else {
            loginStatusError()
            currentLoginStatusFlag.value = false
        }
        pushStatusLoading.value = false
    },
    GETTAGSRESPONSE(message) {
        if (message.status) {
        } else {
        }
    },
    SOCKERRESPONSE(message) {
        const data = JSON.parse(message)
        if (typeof data === "object" && data) {
            if (data.fill_report_statu || data.exactly_item.length || data.item_exactly_standard.length) {
                addNotification({
                    message: () => `<div>
                        <p>
                            抽样单编号为${data.samplingNO}的错误提示:
                        </p>
                        <div>
                            ${transformArrays(data.fill_report_statu, data.exactly_item.length ? ['国抽缺少项目:', ...data.exactly_item] : [], data.item_exactly_standard).filter(Boolean).join("<br/>")}
                        </div>
                    </div>`,
                    type: 3,
                    closeTime: 0
                })
            } else if (data.item_inconsistent_messages.length) {
                addNotification({
                    message: () => `<div>
                    <p>
                        抽样单编号为${data.samplingNO}的警告提示:
                    </p>
                    <div>
                        ${data.item_inconsistent_messages.filter(Boolean).join("<br/>")}
                    </div>
                </div>`,
                    type: 2
                })
            } else {
                const type = data.fillstate === 1 ? 1 : 3
                const options = {
                    message: `抽样单编号为${data.samplingNO}${data.message}`,
                    type: type,
                }
                if (type === 3) {
                    options.closeTime = 0
                }
                addNotification(options)
            }
        } else {
            addNotification({
                message: message,
                type: 3
            })
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
        case "GETTAGSRESPONSE":
            ResponseStatus.GETTAGSRESPONSE(message)
            break
        case "SOCKERRESPONSE":
            ResponseStatus.SOCKERRESPONSE(message)
            break

    }
});

function loginStatusError() {
    currentLoginStatusErrorTip.value = "登录异常，重新操作一下"
    removeLoginInfo()
    loginAlterHandler()
}