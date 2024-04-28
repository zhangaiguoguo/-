{
    let htmlProxy = null
    const { currentVerificationCode, pushStatusLoading, trCurrentDataMps, currentId, pushStatusErrorTip, currentUuid } = window.globalState;
    window.components.push({
        name: "login",
        render(props, emits) {
            const html = (htmlProxy = $(findComponentTemplate('maskLayer')({}, {
                default: () => $(`
                <div class="login-box-hij">
                <div class="login-title">
                    <span class="login-title-content-hij"></span>
                    <a href="javascript:;" class="btn btn-link login-close-btn">
                        ${findIconHandlerTemplate('close')()}
                    </a>
                </div>
                <div class="gcxt-gpi-title-spl">
                    <h3>国抽系统登录</h3>
                </div>
                <form id="login-form-options" class="el-form login-box-form form-inline box_content" action="/">
                    <div class="form-group el-form-item">
                        <div class="el-form-item_content">
                            <input required type="text" class="form-control el-input w-100" id="account"
                                name="account" placeholder="请输入账号"  value=${props.account || ""}>
                        </div>
                    </div>
                    <div class="form-group el-form-item el-form-item-password-cj-r">
                        <div class="el-form-item_content">
                            <input required type="password" class="form-control el-input w-100" id="password"
                                name="password" placeholder="请输入密码" value=${props.password || ""}>
                                ${findIconHandlerTemplate('View')()}
                        </div>
                    </div>
                    <div class="form-group el-form-item">
                        <div class="el-form-item_content">
                            <input required type="type" class="form-control el-input form-validate-yzm-inp box_content"
                                name="verificationCode" id="verificationCode" placeholder="请输入验证码">
                            <img src="${toValue(currentVerificationCode)}" alt="失败" class="form-validate-yzm" />
                        </div>
                    </div>
                    <div class="form-group el-form-item">
                        <div class="el-form-item_content">
                            <button class="btn btn-primary w-100 el-button-t" id="login-btn" type="submit">登录</button>
                        </div>
                    </div>
                    ${toValue(currentLoginStatusErrorTip) ? `<p class="el-login-status-error">${toValue(currentLoginStatusErrorTip)}</p>` : ""}
                </form>
                </div>
                `)
            })))
            useEffect(() => {
                watch(pushStatusLoading, v => {
                    const btn = htmlProxy.find("button#login-btn").attr('disabled', v)
                    btn.find("#el-loading-mask-hig-id").remove()
                    if (v) {
                        btn.append(findComponentTemplate('loading')({ isInset: true }))
                    } else {
                    }
                }, {
                    immediate: true
                })
            }, [])
            html.find("button#login-btn").click(function (evt) {
                currentLoginStatusErrorTip.value = null
                loginHandler(html, evt, emits)
            })
            html.find("a.login-close-btn").click(() => {
                emits.destroy()
            })
            html.find(".el-form-item-password-cj-r .el-form-item_content .el-icon-pij").click(function () {
                const icon = $(this).attr('icon')
                let node = null
                if (icon === "View") {
                    node = $(findIconHandlerTemplate('Hide')())
                } else {
                    node = $(findIconHandlerTemplate('View')())
                }
                this.replaceChild(node.children()[0], $(this).children()[0])
                $(this).attr('icon', node.attr('icon'))
                $(this).prev().attr('type', icon === "View" ? 'type' : 'password')
            })
            return html
        }
    })

    function loginHandler(html, evt, emits) {
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
            const message = trCurrentDataMps.get(toValue(currentId))
            if (message) {
                pushStatusLoading.value = true
                chrome.runtime.sendMessage({
                    type: "LOGIN", message: {
                        allItems: message.allItems,
                        items: message.items,
                        info: message.info,
                        password: formData.get('password'),
                        nickname: formData.get('account'),
                        captcha: formData.get('verificationCode'),
                        uuid: currentUuid.value || null,
                    }
                })
                setLoginInfo(formData.get('account'), formData.get('password'))
            } else {
                emits.destroy()
                pushStatusErrorTip.value = "操作异常，未获取到当前数据的信息，请重新操作一下"
                removeLoginInfo()
            }
        }
    }
}
