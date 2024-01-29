window.components.push({
    name: "maskLayer",
    render(props, slots = {}) {
        const html = $(`
        <div class="el-mask-layer-hij">
            <div class="el-mask-layer-content"></div>
        </div>
    `)
        html.find('.el-mask-layer-content').append(slots.default())
        return html
    }
})