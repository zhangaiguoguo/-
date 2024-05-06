(function () {
    const { notificationPermissionFlag } = window.globalState;
    const { toRaw, effectScope, toValue, watchEffect } = window.hooks

    const tipList = ref([])

    const tipZindexCount = ref(1000)

    function notification(message) {
        message = typeof message === "object" && message !== null ? message : { message: message }
        if (typeof Notification && toValue(globalState.notificationPermissionFlag)) {
            if (Notification.permission === "granted") {
                var notification = new Notification("推送提醒", { body: message.message });
                notification.onclick = function () {
                    chrome.runtime.sendMessage({ type: "GETTAGS" });
                }
                return
            }
        }
        addNotificationTip(message)
    }

    function findCurrentIndex(target) {
        return (toValue(tipList)).findIndex((ii) => ii === target)
    }

    function reduceCurrentHieght(index) {
        return toValue(tipList).slice(0, index).reduce((pre, cur) => pre + (cur.height || 0), 0)
    }

    function transformNotificationBg(type) {
        return `bg-${type === 1 ? "success" : type === 2 ? "warning" : type === 4 ? "info" : "danger"}`
    }

    function generateNotificationElBindEvent(target, callback) {
        const el = target.el
        let status = true
        const closeHandle = () => {
            if (!status) return
            status = false
            callback && callback()
            el.addClass('ts-msg-tip-notification-gp-hide')
            clearTimeout(target.closeTimer)
            clearTimeout(target.closeTimer2)
            target.closeTimer = setTimeout(() => {
                el.remove()
                const index = findCurrentIndex(target)
                toRaw(toValue(tipList)).splice(index, 1)
            }, target.duration / 2)
        }
        el.find('.ts-msg-tip-notification-gp-close').click(closeHandle)

        if (target.closeTime) {

            el.mouseover(() => {
                clearTimeout(target.closeTimer2)
            })

            el.mouseout(() => {
                target.closeTimer2 = setTimeout(() => {
                    closeHandle()
                }, target.closeTime)
            })

            el.trigger("mouseout")
        }

    }

    function generateNotificationEl(n) {
        if (!n.el) {
            const el = $(`
            <div class="ts-msg-tip-notification-gp ts-msg-tip-notification-gp-hide">
                <div class="ts-msg-tip-notification-gp-content">
                    <h4 class="ts-msg-tip-notification-gp-content-title"></h4>
                    <div class="ts-msg-tip-notification-gp-content-content"></div>
                </div>
                ${n.showClose ? `<button type="button" class="ts-msg-tip-notification-gp-close close" aria-label="Close"><span
                        aria-hidden="true">&times;</span></button>` : ''}
            </div>
        `)
            toRaw(n).el = el

            generateNotificationElBindEvent(n, () => {
                scope && scope.stop()
            })

            let init = false

            resizeObserver(el[0], (v) => {
                (!init ? toRaw(n) : (n)).height = v;
                init = true
            })

            const scope = effectScope()

            scope.run(() => {
                watchEffect(() => {
                    n.el.find(".ts-msg-tip-notification-gp-content-content").html(n.message)
                })
                watchEffect(() => {
                    n.el.find(".ts-msg-tip-notification-gp-content-title").html(n.title)
                })
                watchEffect(() => {
                    const vel = n.el[0]
                    n.el.removeClass([1, 2, 3,4].map((v) => transformNotificationBg(v)).join(" "))
                    n.el.addClass(transformNotificationBg(n.type))
                })
                watchEffect(() => {
                    const vel = n.el[0]
                    const index = findCurrentIndex(n)
                    vel.style.setProperty("--ts-msg-tip-notification-gp-transition", `${n.duration}ms`)
                    if (index > -1) {
                        n.el.css({
                            'z-index': n.zIndex,
                            'transform': `translate(-${n.offset[0]}px,-${n.offset[1] + 10 * (index + 1)}px)`,
                            'top': `calc(100vh - (var(--el-obs-auto-height) + ${reduceCurrentHieght(index)}px))`,
                        })
                    }
                })
            })
        }
        return n.el
    }

    function generateNotificationDto(list) {

        for (let i = 0; i < list.length; i++) {
            const target = list[i]
            const status = !!target.el
            const el = generateNotificationEl(target)
            if (!status) {
                $(document.body).append(el)
                toRaw(target).height = el.height()
                setTimeout(() => {
                    el.removeClass("ts-msg-tip-notification-gp-hide")
                })
            }
        }
    }

    watch(() => tipList.value && tipList.value.length, (v) => {
        generateNotificationDto(toValue(tipList))
    }, {
        immediate: true
    })

    function defaultAddOptionsValue(options, key, defaultValue) {
        if (!(key in options)) {
            options[key] = defaultValue
        }
    }

    function addNotificationTip(options) {
        if (typeof options !== "object" || options === null) {
            options = {
                message: options,
            }
        }

        defaultAddOptionsValue(options, 'title', '消息提示');

        defaultAddOptionsValue(options, 'type', 1);

        defaultAddOptionsValue(options, 'offset', [10, 14]);

        defaultAddOptionsValue(options, 'duration', 240);

        defaultAddOptionsValue(options, 'closeTime', 4000);

        defaultAddOptionsValue(options, 'showClose', true);

        tipZindexCount.value++

        defaultAddOptionsValue(options, 'zIndex', options.zIndex = toValue(tipZindexCount))

        tipList.value.unshift(options)
    }

    window.addNotification = notification

}())