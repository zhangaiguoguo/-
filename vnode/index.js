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

    const TEXTREF = createSymbol('text', 3)
    const ELEMENTREF = createSymbol('element', 1)
    const COMMENTREF = createSymbol('comment', 8)
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
            bloak.type = 1
            bloak[ELEMENTTYPE[0]] = nodeTypeSymbolFind(bloak.type)
            bloak.children = nodeBloak[2]
            return bloak
        })
    }

    function createVnodeText(text) {
        return createvNodeBloak((bloak) => {
            bloak.tag = "#text"
            bloak.type = 3
            bloak[ELEMENTTYPE[0]] = nodeTypeSymbolFind(bloak.type)
            bloak.content = text
            return bloak
        })
    }

    function createVnodeComment(text) {
        return createvNodeBloak((bloak) => {
            bloak.tag = "#comment"
            bloak.type = 8
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
            case 3:
                hooks.textHook(node, ...args)
                break
            case 1:
                hooks.elementHook(node, ...args)
                break
            case 8:
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

    function vNodeCompareDiffRun(vnode, rnode) {
        const mps = new Map()
        const vnodeChildren = vnode.children
        const rnodeChildren = rnode.children
        return () => {
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