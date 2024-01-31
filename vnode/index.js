(function (global, factory) {
    "use strict";
    if (typeof module === "object" && typeof module.exports === "object") {
        module.exports = global.document ?
            factory(global, true) :
            function (w) {
                if (!w.document) {
                    throw new Error("error");
                }
                return factory(w);
            };
    } else {
        window.vnodeHooks = factory(global);
    }
}(typeof window !== "undefined" ? window : this, function (window, noGlobal) {
    const extend = Object.assign

    const toStringCall = Object.prototype.toString

    function toRawType(target) {
        return toStringCall.call(target).slice(8, -1)
    }

    function hasExist(target, flag = false) {
        return target != null && !!(flag ? target !== "" : ~~1 << 1)
    }

    function has(target, key) {
        return hasExist(target) && (key in target)
    }

    function has2(target, key) {
        return hasExist(target) && target.hasOwnProperty(key);
    }

    function has3(target, key) {
        return hasExist(target) && Reflect.hasOwnProperty(target, key)
    }

    function createSymbol(name, value, flag = false) {
        return [flag ? Symbol.for(name) : Symbol(name), value]
    }

    function createObjArray(obj, key) {
        if (!isArray(obj[key])) {
            obj[key] = []
        }
        return obj[key]
    }

    const def = (obj, key, value) => {
        Object.defineProperty(obj, key, {
            configurable: true,
            enumerable: false,
            value
        });
    };

    function synthesisArray(target) {
        return isArray(target) ? target : [target]
    }
    const TEXT_NODE = Node.TEXT_NODE
    const ELEMENT_NODE = Node.ELEMENT_NODE
    const COMMENT_NODE = Node.COMMENT_NODE
    const TEXTREF = createSymbol('text', TEXT_NODE)
    const ELEMENTREF = createSymbol('element', ELEMENT_NODE)
    const COMMENTREF = createSymbol('comment', COMMENT_NODE)
    const ELEMENTTYPE = createSymbol('elementType', null)

    function nodeTypeSymbolFind(target, done = false) {
        let flag = 1
        const result = [TEXTREF, ELEMENTREF, COMMENTREF].find((node) => (node[0].description === target && (flag = done ? 1 : 2)) || (node[1] === target && (flag = done ? 2 : 1)))
        return result ? result[flag - 1] : null
    }

    function createvNodeBloak(callback) {
        const _callback = callback || (v => v)
        return _callback({
            type: null,
            el: null,
            content: null,
            [ELEMENTTYPE[0]]: null,
            key: null,
            tag: null,
            attrs: null,
            children: null,
            parentNode: null
        })
    }

    function nodeType(node) {

    }

    function createVnodeArg2(target) {
        return toRawType(target) === "Object"
    }

    function createVnode(tag, props, children) {
        if (!tag) return null
        const nodeBloak = [...arguments]
        if (arguments.length === 2) {
            const _args = [{}, props]
            if (createVnodeArg2(props)) {
                _args.splice(0, 2, ...[props, null])
                if (has(props, 'children')) {
                    _args[1] = props.children
                    delete props.children
                }
            }
            nodeBloak.splice(1, 1, ..._args)
        }
        return createvNodeBloak((bloak) => {
            bloak.tag = nodeBloak[0]
            bloak.attrs = nodeBloak[1]
            bloak.type = ELEMENT_NODE
            bloak[ELEMENTTYPE[0]] = nodeTypeSymbolFind(bloak.type)
            bloak.children = nodeBloak[2]
            return bloak
        })
    }

    function createVnodeText(text) {
        return createvNodeBloak((bloak) => {
            bloak.tag = "#text"
            bloak.type = TEXT_NODE
            bloak[ELEMENTTYPE[0]] = nodeTypeSymbolFind(bloak.type)
            bloak.content = text
            return bloak
        })
    }

    function createVnodeComment(text) {
        return createvNodeBloak((bloak) => {
            bloak.tag = "#comment"
            bloak.type = COMMENT_NODE
            bloak[ELEMENTTYPE[0]] = nodeTypeSymbolFind(bloak.type)
            bloak.content = text
            return bloak
        })
    }

    function parseNodeTree(el) {
        return parseNodeTree2(el, null)
    }

    function isArray(target) {
        return Array.isArray(target)
    }

    function nodeTypeHandler(node, hooks, args = []) {
        switch (node.nodeType) {
            case TEXT_NODE:
                hooks.textHook(node, ...args)
                break
            case ELEMENT_NODE:
                hooks.elementHook(node, ...args)
                break
            case COMMENT_NODE:
                hooks.commentHook(node, ...args)
                break
        }
    }

    function parseNodeAttrs(node) {
        let attrs = null
        const _attrs = node.attributes;
        if (_attrs) {
            attrs = {}
            for (let atr of _attrs) {
                attrs[atr.nodeName] = atr.nodeValue
            }
        }
        return attrs
    }

    function parseNodeTree2(node) {
        let currentNode = null
        nodeTypeHandler(node, {
            elementHook() {
                currentNode = createVnode(node.nodeName.toLocaleLowerCase(), parseNodeAttrs(node), [...node.childNodes].map((cNode) => parseNodeTree2(cNode)))
            },
            textHook() {
                currentNode = createVnodeText(node.nodeValue)
            },
            commentHook() {
                currentNode = createVnodeComment(node.nodeValue)
            },
        })
        return currentNode
    }

    function nodeAttrKeySpecialHandler(name) {
        switch (name) {
            case 'className':
                return 'class'
            default:
                return name
        }
    }

    function setNodeAttrs(node, attrs) {
        if (node) {
            for (let atr in attrs) {
                node.setAttribute(nodeAttrKeySpecialHandler(atr), attrs[atr])
            }
        }
    }

    function createRNode(node) {
        let rNode = null
        if (node) {
            switch (node[ELEMENTTYPE[0]]) {
                case ELEMENTREF[0]:
                    rNode = document.createElement(node.tag)
                    setNodeAttrs(rNode, node.attrs)
                    break
                case TEXTREF[0]:
                    rNode = document.createTextNode(node.content)
                    break
                case COMMENTREF[0]:
                    rNode = document.createComment(node.content)
                    break
            }
        }
        def(rNode, '__node__', node)
        return rNode
    }

    class VNode {
        constructor(vnode) {
            this._vnode = vnode
            this.run()
        }
        run() {
            extend(this, createvNodeBloak((vbloak) => {
                return Object.assign(vbloak, this._vnode, { children: null })
            }))
            this.el = createRNode(this)
            setNodeAttrs(this.el, this.attrs)
        }
        apped(parentNode) {
            parentNode && parentNode.appendChild(this.el)
        }
    }

    function vNodeCompareDiff(vnode, rnode) {

        if (!rnode) {
            rnode = new VNode(vnode)
        }

        const run = vNodeCompareDiffRun(vnode, rnode)

        run()

        return rnode
    }

    function getNodeRefType(node) {
        return node[ELEMENTTYPE[0]]
    }

    function setNodeValue(node, value) {
        if (node.nodeValue) {
            node.nodeValue = value
        }
    }

    function nodeTypeTEXTCOMMENTValidate(vnode, rnode) {
        if (vnode.content != rnode.content) {
            setNodeValue(rnode.el, vnode.content)
        }
    }

    function judgeNodeAttrSame(vnode, rnode) {
        const nAttrs = (vnode.attrs || {}), rAttrs = (rnode.attrs || {}), nAttrLen = keys(nAttrs), rAttrLen = keys(rAttrs)
        if ((nAttrLen.length !== rAttrLen.length) || nAttrLen.some((atr) => nAttrs[atr] !== rAttrs[atr])) {
            return true
        }
        return false
    }

    const _keys = Object.keys
    function keys(target) {
        return _keys(target)
    }

    // const nodeTypes = [getNodeRefType(vnode), getNodeRefType(rnode)]
    // if (nodeTypes[0] === nodeTypes[1]) {
    //     switch (nodeTypes[0]) {
    //         case TEXTREF[0]:
    //             nodeTypeTEXTCOMMENTValidate(vnode, rnode)
    //             break
    //         case COMMENTREF[0]:
    //             nodeTypeTEXTCOMMENTValidate(vnode, rnode)
    //             break
    //     }
    // }

    function vNodeCompareDiffRun(vnode, rnode) {
        const vnodeChildren = vnode.children
        const rnodeChildren = rnode.children
        return () => {
            {
                if ((!vnodeChildren || !vnodeChildren.length) && rnodeChildren) {
                    for (let n = 0; n < rnodeChildren.length; n++) {
                        removeChild(rnodeChildren, n)
                        n--
                    }
                } else if ((!rnodeChildren || !rnodeChildren.length) && vnodeChildren) {
                    for (let n = 0; n < vnodeChildren.length; n++) {
                        const rcNode = new VNode(vnodeChildren[n])
                        rcNode.apped(rnode.el)
                        createObjArray(rnode, 'children').push(rcNode)
                        vNodeCompareDiffRun(vnodeChildren[n], rcNode)()
                    }
                } else if (getNodeRefType(vnode) !== getNodeRefType(rnode)) {
                    console.log('----');
                } else if (vnodeChildren && rnodeChildren) {
                    const addMps = []
                    const useMps = []
                    for (let n = 0; n < vnodeChildren.length; n++) {
                        const _vnode = vnodeChildren[n]
                        const _rnode = rnodeChildren[n]
                        let vflag = [], rflag = false;
                        if (!_rnode) {
                            vflag.push(0)
                        } else {
                            if (getNodeRefType(_vnode) !== getNodeRefType(_rnode)) {
                                vflag = 1
                            } else if (_vnode.tag !== _rnode.tag) {
                                vflag = 2
                            }
                            if (judgeNodeAttrSame(_vnode, _rnode)) {
                                vflag = 3
                            }
                        }
                        if (vflag.length) {
                            addMps.push({
                                vnode: _vnode,
                                perms: vflag,
                                rnode: _rnode
                            })
                        }
                    }
                    console.log(addMps, useMps);
                }
            }
        }
    }

    function removeChild(rnodeChildren, index) {
        const rnode = synthesisArray(rnodeChildren).slice(index, 1)[0]
        if (rnode && rnode.el) {
            rnode.el.remove()
        }
    }

    return {
        h: createVnode,
        parseNodeTree,
        vNodeCompareDiff
    }

}))