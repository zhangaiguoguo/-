{
    let htmlProxy = null
    window.components.push({
        name: "elUpdateFile",
        render(props, slots = {}, emist = {}) {
            const [fileList, setFileList] = useState([])
            const html = (htmlProxy = findComponentTemplate('maskLayer')({}, {
                default: () => $(template({
                    fileList: fileList,
                }))
            }))
            useEffect(() => {
                watch(pushStatusLoading, v => {
                    const btn = htmlProxy.find("#el-update-btn-save").attr('disabled', v)
                    btn.find(".el-loading-mask-hij").remove()
                    if (v) {
                        btn.append(findComponentTemplate('loading')({ isInset: true }))
                    }
                }, {
                    immediate: true
                })
            }, [])
            const _ = (el, attr) => $(el).attr(attr) !== void 0
            html.find(".el-update-gij").click(({ target }) => {
                if (_(target, 'close')) {
                    emist.destroy()
                } else if (_(target, 'submit')) {
                    emist.submit(fileList)
                } else if (_(target, 'uploadFile')) {
                    html.find("#el-update-content-input-gij").click()
                }
            })
            html.find("#el-update-content-input-gij").change(({ target }) => {
                const files = target.files
                const _files = [...fileList]
                let index = 1
                for (let w of files) {
                    w.uid = Date.now() + index
                    _files.push(w)
                    index += 1
                }
                setFileList(_files)
            })
            toValue(fileList).forEach((file, index) => {
                html.find('.el-update-content-list-gij').append(templateFileItem(file, index, fileList, setFileList))
            })
            return html
        }
    })

    function template(props, slots) {
        return `
        <div class="el-update-gij">
          <div class="el-update-header-gij">
            <span>上传附件</span>
            <button class="btn btn-link btn-primary el-update-close-gij" close>关闭弹窗</button>
          </div>
          <div class="el-update-content-gij">
            <input type="file" id="el-update-content-input-gij" multiple draggable>
            <div class="el-update-content-btn-gij">
                <button class="btn btn-primary" id="el-update-btn" uploadFile>上传附件</button>
                ${props.fileList.length ? '' : `
                <span class="tip">必须选择一个文件</span>`}
            </div>
            <ul class="el-update-content-list-gij">
            </ul>
          </div>
          ${props.fileList.length ? `<div class="el-update-footer-gij">
          <button class="btn btn-primary" id="el-update-btn-save" submit>提交</button>
        </div>`: ""}
        </div>`
    }
    function templateFileItem(file, index, list, setList) {
        const html = $(`<li title="${file.name}" class="el-update-content-item-gij">
        <div class="el-update-content-item-content-gij">
            ${findIconHandlerTemplate('document')()}
          <span class="name">${file.name}</span>
          <a href="javascript:;" class="btn-close">
            ${findIconHandlerTemplate('close')()}
          </a>
        </div>
      </li>`)
        html.find("a.btn-close").click(function () {
            list.splice(index, 1)
            setList([...list])
        })
        return html
    }
}