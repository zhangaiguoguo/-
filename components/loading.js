window.components.push({
    name: "loading",
    render(props, slots = {}) {
        const html = $(`
        <div class="el-loading-mask-hij${!props.isInset ? '' : ' el-loading-mask-inset'}">
            <svg class="circular" viewBox="0 0 50 50"><circle class="path" cx="25" cy="25" r="20" fill="none"></circle></svg>
        </div>
    `)
        return html
    }
})