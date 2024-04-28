{

    const { pushStatusLoading, pushStatusErrorTip, buttonsRef, currentLoginStatusFlag } = window.globalState;
    window.components.push({
        name: "pushButton",
        render(props, slots = {}, emits = {}) {
            const loading = useStateRef(true)
            const tipLoadingValue = useStateRef("请稍等...")
            const pushStatusErrorStatus = useStateRef(false)
            useEffectRef(() => {
                emits.setScoped(effectScope()).run(() => {
                    watch(pushStatusLoading, (v) => {
                        loading.value = v
                    }, {
                        immediate: true
                    })
                    watch(pushStatusErrorTip, (v) => {
                        pushStatusErrorStatus.value = !!v
                    }, {
                        immediate: true
                    })
                })
            }, [])
            const html = $(`<div class="btn-group btn-group-box-hij">${toValue(pushStatusErrorTip) ? `<span class="el-tip-error">${toValue(pushStatusErrorTip)}</span><a ${buttonsRef[1]} class="el-a-link-refresh">刷新</a>` : ""}<button ${buttonsRef[0]} class="el-button btn btn-primary el-button-t${toValue(pushStatusErrorTip) ? ' el-button-none-plj' : ''}" id="push-btn-gg-pl" title='推送国抽'>${toValue(loading) ? toValue(tipLoadingValue) : '推送国抽'}</button</div>`)
            if (loading.value) {
                html.find('#push-btn-gg-pl').append(findComponentTemplate('loading')({
                    isInset: true
                }))
            }
            html.find('button').attr('disabled', loading.value)
            $(html).click(({ target }) => {
                if ($(target).attr(buttonsRef[0]) !== void 0) {
                    currentLoginStatusFlag.value = false
                    nationalPumpPush(toValue(currentId));
                } else if ($(target).attr(buttonsRef[1]) !== void 0) {
                    emits.update()
                } else if ($(target).attr(buttonsRef[2]) !== void 0) {
                    emits.login()
                }
            })
            return html
        }
    })
}