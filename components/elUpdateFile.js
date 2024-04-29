{
    const { currentSampleFlag } = window.globalState;
    let htmlProxy = null
    const _ = (el, attr) => $(el).attr(attr) !== void 0
    window.components.push({
        name: "elUpdateFile",
        render(props, slots = {}, emist = {}) {
            const [fileList, setFileList] = useState([])
            const [limittimeFile, setLimittimeFile] = useState([])
            const [enterpriseStandardName, setEnterpriseStandardName] = useState("")
            const html = (htmlProxy = findComponentTemplate('maskLayer')({}, {
                default: () => $(template({
                    fileList: fileList,
                    limittimeFile: limittimeFile,
                    enterpriseStandardName: enterpriseStandardName,
                    setLimittimeFile: setLimittimeFile,
                    setFileList: setFileList,
                    setEnterpriseStandardName: setEnterpriseStandardName
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
            html.find(".el-update-gij").click(({ target }) => {
                let shargFlag = null
                if (_(target, 'close')) {
                    emist.destroy()
                } else if (_(target, 'submit')) {
                    emist.submit({
                        files: fileList,
                        limittimeFile: limittimeFile,
                        enterpriseStandardName: enterpriseStandardName,
                    })
                } else if (_(target, 'uploadFile')) {
                    shargFlag = 1
                } else if (_(target, 'uploadFile2')) {
                    shargFlag = 2
                }
                if (shargFlag) {
                    html.find("#el-update-content-input-gij").trigger("click").attr("shargFlag", shargFlag)
                }
            })
            html.find("#el-update-content-input-gij").change(({ target }) => {
                const shargFlag = +$(target).attr('shargFlag')
                const files = target.files
                const currentFileList = shargFlag === 1 ? fileList : limittimeFile
                const _files = [...currentFileList]
                let index = 1
                for (let w of files) {
                    w.uid = Date.now() + index
                    _files.push(w)
                    index += 1
                }
                (shargFlag === 1 ? setFileList : setLimittimeFile)(_files)
            })
            return html
        }
    })

    const templateEnterorder = (props) => {
        const root = $(`
        <div class="el-update-gij-enterprise-stand-content">
            <div class="form-group">
                <label required for="exampleInputPassword1" required>企业标准名称：</label>
                <div class="el-update-content-btn-gij">
                    <input type="text" class="form-control" id="enterpriseStandardName" id="exampleInputPassword1">
                </div>
            </div>
            <div class="form-group">
                <label required for="exampleInputPassword1">企业标准附件：</label>
                <div class="el-update-content-btn-gij">
                    <button class="btn btn-primary" id="el-update-btn" uploadFile2>上传附件</button>
                    ${props.limittimeFile.length ? '' : `
                    <span class="tip">必须选择一个文件</span>`}
                </div>
            </div>
            <ul class="el-update-content-list-gij">
            </ul>
        </div>
    `)
        props.limittimeFile.forEach((file, index) => {
            root.find('.el-update-content-list-gij').append(templateFileItem(file, index, props.limittimeFile, props.setLimittimeFile))
        })

        root.find("input#enterpriseStandardName").blur(({ target }) => {
            props.setEnterpriseStandardName(target.value)
        }).val(props.enterpriseStandardName)
        return root
    }

    const templateUpdateFile = (props) => {
        const root = $(`
        <div class="el-update-gij-enterprise-stand-content">
            <div class="form-group">
                <label for="exampleInputPassword1" required>限时报：</label>
                <div class="el-update-content-btn-gij">
                    <button class="btn btn-primary" id="el-update-btn" uploadFile>上传附件</button>
                    ${props.fileList.length ? '' : `
                    <span class="tip">必须选择一个文件</span>`}
                </div>
            </div>
            <ul class="el-update-content-list-gij">
            </ul>
        </div>
        `)
        props.fileList.forEach((file, index) => {
            root.find('.el-update-content-list-gij').append(templateFileItem(file, index, props.fileList, props.setFileList))
        })

        return root
    }

    const template = (props, slots) => {
        const root = $(`
        <div class="el-update-gij">
          <div class="el-update-header-gij">
            <span>上传附件</span>
            <button class="btn btn-link btn-primary el-update-close-gij" close>关闭弹窗</button>
          </div>
          <div class="el-update-content-gij">
            <input type="file" id="el-update-content-input-gij" multiple draggable>
          </div>
          ${(toValue(currentSampleFlag)[0] ? props.fileList.length : true) && (toValue(currentSampleFlag)[1] ? props.limittimeFile.length && props.enterpriseStandardName : true) ? `<div class="el-update-footer-gij">
          <button class="btn btn-primary" id="el-update-btn-save" submit>提交</button>
        </div>`: ""}
        </div>`)
        const contentRoot = root.find('.el-update-content-gij')
        if (toValue(currentSampleFlag)[1]) {
            contentRoot.append(templateEnterorder(props))
        }
        if (toValue(currentSampleFlag)[0]) {
            contentRoot.append(templateUpdateFile(props))
        }
        return root
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