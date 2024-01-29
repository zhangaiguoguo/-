window.components.push({
    name: "closeDialog",
    render(props, slots = {}, emits = {}) {
        const html = $(`<div class="el-dialog-close-hij">
        <div class="el-dialog-close-content">
        </div>
        <div class="el-dialog-close-btns">
            <button class="btn" cancel>取消</button>
            <button class="btn btn-primary" confirm>确认</button>
        </div>
    </div>
    `)
        html.find(".el-dialog-close-content").append(slots.default())
        html.find('.el-dialog-close-btns').click(({ target }) => {
            const flag = [$(target).attr("cancel") !== void 0, $(target).attr("confirm") !== void 0]
            if (flag[0]) {
                emits.cancel()
            }
            if (flag[1]) {
                emits.confirm()
            }
            if (flag.filter(Boolean).length) {
                props.destroy()
            }
        })
        return html
    }
})