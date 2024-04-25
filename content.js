const { alreadyPushedData, pushStatusLoading, pushStatusErrorTip, buttonsRef, obsTreeStr, obsDOMTrMps, obsDOMTrMps2, trCurrentDataMps, trMps, currentId, currentCYDNumber, currentFuncStatus, currentTaskMainRootEl, currentVerificationCode, currentLoginStatus, currentLoginStatusErrorTip, currentLoginStatusFlag, currentDataIsPushGC } = window.globalState;

const loginAlterHandler = createDOM($(document.body), function (props) {
    currentLoginStatus.value = props.destroy
    return findComponentTemplate('login')({
        ...getLoginInfo(),
    }, {
        destroy: props.destroy
    })
})

const createUpLoadFileNode = createDOM($(document.body), function (props) {
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

const tastConclusionMaskLayer = createDOM($(document.body), function (props) {
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

obsDOM(obsTreeStr, (v) => {
    v.children().filter((index, v) => {
        return !!$(v).find("td[aria-describedby=list_TestType]").text()
    }).each((i, v) => {
        if (trMps.has(v)) return
        trMps.set(v, true)
        $(v).click(() => {
            const currentSampleId = $(v).attr('id')
            if (currentId.value === currentSampleId) return
            if (currentId.value && currentId.value !== currentSampleId) {
                closeDislogHandle2()
                return
            }
            pushStatusErrorTip.value = null
            currentId.value = currentSampleId
        })
    })
});

function releaseEffect() {
    obsDOMTrMps.value?.();
    obsDOMTrMps2.value?.()
}

watch(currentId, v => {
    releaseEffect()
    if (v) {
        obsDOMTrMps2.value = obsDOM(`div.taskMain div#LIMSTestReportApproveDetail>table tbody .childDiv table.resizabletable tbody`, function (v) {
            obsDOMTrMps2.value()
            const tds = v.find('td>span')
            currentCYDNumber.value = findtdsValue2(tds, "抽样单号：")
            {
                const wtddwName = findtdsValue2(tds, "检测类型：")
                const validateVal = "食品安全监督抽检"
                if (wtddwName.length && wtddwName.indexOf(validateVal) > -1) {
                    obsDOMTrMps.value = obsDOM('div.taskMain ul#_sys_TabMain div.reportListPages', (root) => {
                        obsDOMTrMps.value?.();
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
        createDOM(rootEl || $(document.body), function ({ props, destroy }) {
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
        s.remove()
    })
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
    obsDOM('.taskMain .closeTaskBot span', function (v) {
        v[0].removeEventListener('click', closeDislogHandle2, false)
        v[0].addEventListener('click', closeDislogHandle2, false)
    })
}

const createCloseDialog = createDOM($(document.body), function (props) {
    const closeDialog = $(findComponentTemplate('closeDialog')({}, {
        default: () => $(`<h4 style="font-weight:600;">当前数据可推送国抽，是否继续 ？</h4>`)
    }, {
        cancel() {
            commontjs()
            if (toValue(currentLoginStatusFlag)) {
                pushCurrentData(0)
            }
            currentId.value = null
        },
        confirm() {
            nationalPumpPush()
            commontjs()
        },
        destroy: props.destroy
    }))
    function commontjs() {
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
    const message = request.message
    switch (request.type) {
        case 'RESPONSECOMPLETE':
            trCurrentDataMps.set(currentId.value, request.message)
            getLoginStatus()
            break
        case 'RESPONSECOMPLETEERROR':
            if (request.type === "RESPONSECOMPLETEERROR") {
                pushStatusErrorTip.value = request.message
                trCurrentDataMps.delete(currentId.value)
            }
            break
        case 'LOGINSTATUSRESPONSE':
            pushStatusLoading.value = false
            const FLAGKEY = "status"
            if (message.code === 200) {
                currentLoginStatusFlag.value = message.data[FLAGKEY]
                if (!message.data[FLAGKEY]) {
                    currentVerificationCode.value = message.data.value
                    loginAlterHandler()
                } else {
                    if (toValue(currentDataIsPushGC)) {
                        nationalPumpPush()
                    }
                }
            } else {
                pushStatusErrorTip.value = "请求异常，重新操作一下"
            }
            break
        case "PUSHSTATUSRESPONSE":
            pushStatusLoading.value = false
            if (message.code === 200) {
                if (message.data.flag) {
                    return
                }
            } else {
                pushStatusErrorTip.value = "请求异常，重新操作一下"
            }
            alreadyPushedData.delete(message.id)
            break
        case "LOGINRESPONSE":
            pushStatusLoading.value = false
            currentLoginStatus.value?.()
            if (message.code === 200) {
                currentLoginStatusFlag.value = message.data.status
                if (message.data.status) {
                    if (toValue(currentDataIsPushGC)) {
                        nationalPumpPush()
                    }
                } else {
                    currentVerificationCode.value = message.data.data
                    loginStatusError()
                }
            } else {
                loginStatusError()
                currentLoginStatusFlag.value = false
            }
            break

    }
});

function loginStatusError() {
    currentLoginStatusErrorTip.value = "请求异常，重新操作一下"
    removeLoginInfo()
    loginAlterHandler()
}