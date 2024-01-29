window.components.push({
    name: "login",
    render(props) {
        return `
        <div class="login-box-hij">
        <div class="login-title">
            <a href="javascript:;" class="btn btn-link login-close-btn">
                <i class="el-icon-pij"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024"><path fill="currentColor" d="M764.288 214.592 512 466.88 259.712 214.592a31.936 31.936 0 0 0-45.12 45.12L466.752 512 214.528 764.224a31.936 31.936 0 1 0 45.12 45.184L512 557.184l252.288 252.288a31.936 31.936 0 0 0 45.12-45.12L557.12 512.064l252.288-252.352a31.936 31.936 0 1 0-45.12-45.184z"></path></svg></i>
            </a>
        </div>
        <form id="login-form-options" class="el-form login-box-form form-inline box_content" action="/">
            <div class="el-form-item-g"></div>
            <div class="form-group el-form-item">
                <div class="el-form-item_content">
                    <input required type="text" class="form-control el-input w-100" id="account"
                        name="account" placeholder="请输入账号"  value=${props.account || ""}>
                </div>
            </div>
            <div class="form-group el-form-item">
                <div class="el-form-item_content">
                    <input required type="password" class="form-control el-input w-100" id="password"
                        name="password" placeholder="请输入密码" value=${props.password || ""}>
                </div>
            </div>
            <div class="form-group el-form-item">
                <div class="el-form-item_content">
                    <input required type="type" class="form-control el-input form-validate-yzm-inp box_content"
                        name="verificationCode" id="verificationCode" placeholder="请输入验证码">
                    <img src="./img/1.png" alt="失败" class="form-validate-yzm" />
                </div>
            </div>
            <div class="form-group el-form-item">
                <div class="el-form-item_content">
                    <button class="btn btn-primary w-100" id="login-btn" type="submit">登录</button>
                </div>
            </div>
        </form>
        </div>
        `
    }
})