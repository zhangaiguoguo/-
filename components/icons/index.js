{
    window.icons = []
    window.icons.push({
        name: "close",
        template() {
            return `
        <i class="el-icon-pij"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024"><path fill="currentColor" d="M764.288 214.592 512 466.88 259.712 214.592a31.936 31.936 0 0 0-45.12 45.12L466.752 512 214.528 764.224a31.936 31.936 0 1 0 45.12 45.184L512 557.184l252.288 252.288a31.936 31.936 0 0 0 45.12-45.12L557.12 512.064l252.288-252.352a31.936 31.936 0 1 0-45.12-45.184z"></path></svg></i>`
        }
    })
    window.icons.push({
        name: "document",
        template() {
            return `
            <i class="el-icon-pij"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024"><path fill="currentColor" d="M832 384H576V128H192v768h640zm-26.496-64L640 154.496V320zM160 64h480l256 256v608a32 32 0 0 1-32 32H160a32 32 0 0 1-32-32V96a32 32 0 0 1 32-32m160 448h384v64H320zm0-192h160v64H320zm0 384h384v64H320z"></path></svg></i>`
        }
    })
}

function findIconHandler(name) {
    return window.icons.find((icon) => icon.name === name)
}

function findIconHandlerTemplate(name) {
    return findIconHandler(name)?.template
}