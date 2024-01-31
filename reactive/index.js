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
        window.hooks = factory(global);
    }
}(typeof window !== "undefined" ? window : this, function (window, noGlobal) {
    'use strict';
    const log = {
        warn: function (...args) {
            console.error(`[warn]`, ...args)
        },
        warn1: function (...args) {
            console.warn(`[warn]`, ...args)
        }
    }

    const extend = Object.assign

    const tasks = []

    let index = 0

    let globalCurrentScheduler = null

    let currentState = null

    let currentScheduler = null

    const ITERATE_KEY = Symbol("iterate");

    const isFrozen = Object.isFrozen

    const resolvedPromise = Promise.resolve();

    let currentFlushPromise = null

    const toStringCall = Object.prototype.toString

    function toRawType(target) {
        return toStringCall.call(target).slice(8, -1)
    }

    //全局配置
    const configTool = {
        /**
         *  be dependent on id
         */
        depsId: 0,
        /**
         * Complex Type (Response Data) - Proxy
         */
        proxy: new Map(),
        /**
         * Storage dependency catcher (used)
         */
        collectDeps: new Set(),
        /**
         * Read-only Data - proxy
         */
        readonlys: new WeakMap(),
        markRawProxy: new WeakMap(),

    }
    defineProperty(configTool, 'tasks', {
        get() {
            return tasks
        }
    })
    defineProperty(configTool, 'taskIndex', {
        get() {
            return index
        }
    })
    defineProperty(configTool, 'globalCurrentScheduler', {
        get() {
            return globalCurrentScheduler
        },
    })
    defineProperty(configTool, 'currentState', {
        get() {
            return currentState
        },
    })
    defineProperty(configTool, 'currentScheduler', {
        get() {
            return currentScheduler
        },
    })
    function generateArray(v) {
        return isArray(v) ? v : [v];
    }

    function _typeof(r) {
        return Object.prototype.toString.call(r).slice(8, -1)
    }

    function is(a, b) {
        return Object.is(a, b)
    }

    function sliceTypeOf(r, n) {
        return is(_typeof(r), n)
    }

    function isObject(r) {
        return sliceTypeOf(r, 'Object')
    }

    function _isReactive(target) {
        return __$isReactive(target)
    }

    function isMap(r) {
        return sliceTypeOf(r, 'Map')
    }

    function isSet(r) {
        return sliceTypeOf(r, 'Set')
    }

    function isSM(r) {
        return isSet(r) || isMap(r)
    }

    const isArray = Array.isArray

    function _isObject(target) {
        return typeof target === "object" && target !== null
    }

    function isFunction(t) {
        return typeof t === "function"
    }

    function ordinaryType(v) {
        return !isFunction(v) && !_isObject(v)
    }
    function __$isReactive(target) {
        if (configTool.proxy.has(target)) {
            return [target, configTool.proxy.get(target)]
        }
        for (let w of configTool.proxy) {
            if (w[0] === target || (w[1].selfProxy === target && w[1].selfProxy) || w[1].self === target) {
                return w
            }
        }
        return !~~1
    }
    function isReactive(target) {
        return !!__$isReactive(target)
    }

    /**
    * Obtain the corresponding dep data based on the dep ID
    */
    function ProxyIndexOf(_) {
        const proxy = _isReactive(_)
        return proxy ? [proxy, proxy.dep] : void 0
    }

    function createScopeWatch(target) {
        return Object.assign({
            dep: (target && target.dep) || generateDep(),
            watches: new Set(),
            rootDeps: new Set()
        }, target || {})
    }

    /**
     * create proxy config
     */
    function createConfig(dep, target, root, rootDeps, isShallow) {
        return {
            dep: dep,
            self: target,
            deps: new Map(),
            selfProxy: null,
            root: root,
            rootDeps: rootDeps || new Set(),
            isShallow: !!isShallow
        }
    }
    /**
     * Dependencies for collecting dep data
     */
    class CollectDeps {
        constructor(target) {
            /* Valves */
            this._target = target
            this.run()
        }
        get deps() {
            return this._target.deps || (this._target.deps = new Set())
        }
        run() {
            configTool.collectDeps.add(this);
        }
        stop() {
            configTool.collectDeps.delete(this);
        }
        addDeps(dep) {
            generateArray(dep).forEach(_ => {
                _addDep(_, this._target)
                triggerTrack.apply(this._target, [_])
                this.deps.add(_)
            })
        }
        delDeps(deps) {
            generateArray(deps).forEach(_ => {
                this.deps.delete(_)
            })
        }
        clear() {
            this.deps.clear()
        }
    }

    function _iteratorGeneration(iterators, callback) {
        if (isFunction(iterators)) {
            return function _iterator() {
                const _values = iterators()
                return {
                    next() {
                        return isFunction(callback) ? callback(_values.next()) : _values.next()
                    },
                    [Symbol.iterator]() {
                        return this;
                    }
                }
            }
        }
    }
    function _iteratorGenerationSM(value, self) {
        return _iteratorGeneration(() => {
            _$size(self)
            return value()
        }, function (v) {
            const _value = v;
            return { value: setProxy(_value.value, { root: self.selfProxy, dep: self.deps.get(_value.value)?.dep, }), done: _value.done }
        })
    }
    function _$iterator(self) {
        return _iteratorGeneration(() => {
            _$size(self)
            return self.self[Symbol.iterator].bind(self.self)()
        }, function (v) {
            const _value = v;
            return { value: _value.done ? void 0 : [_value.value[0], setProxy(_value.value[1], { root: self.selfProxy, dep: self.deps.get(_value.value[0]) })], done: _value.done }
        })
    }
    function _$get(p, config) {
        function _get(...args) {
            return getter({
                self: config, ref: args[0], getData() {
                    return config.self.get(args[0])
                }
            });
        }
        return p === "has" ?
            function _has(...args) {
                _get(...args)
                const _target = (_isReactive(args[0])[1] || [{ self: args[0], selfProxy: args[0] }])[0]
                return config.self.has(_target.self) || config.self.has(_target.selfProxy)
            } : _get
    }
    function _$set(p, config) {
        function _set(...args) {
            const oldValue = _$get("get", config)(args[0])
            const _type = _$get("has", config)(args[0]) ? "set" : "add"
            _$setSize(config)(config.self.size + 1)
            config.self[p](...args)
            return setter({ self: config, ref: args[0], newVal: args[1], oldVal: oldValue, type: _type });
        }
        return p === "add" ? function _add(...args) { _set(...args) } : _set
    }
    function _$delete(config) {
        return function _delete(...args) {
            const oldValue = _$get("get", config)(args[0])
            let isDelete = false
            if (config.selfProxy.has(args[0])) {
                isDelete = true;
                const _target = (_isReactive(args[0])[1] || [{ self: args[0], selfProxy: args[0] }])[0]
                _$setSize(config)(config.self.size - 1)
                config.self.delete(_target.self) || config.self.delete(_target.selfProxy)
            }
            setter({ self: config, ref: args[0], newVal: void 0, oldVal: oldValue, type: 'delete' })
            return isDelete;
        }
    }
    function _$clear(config) {
        return function _clear() {
            for (let w of config.self) {
                _$delete(config)(w[0])
            }
            return !0;
        }
    }
    function _$setSize(config) {
        return function _$setSize(v) {
            const oldValue = config.self.size
            try {
                config.self.size = v
            } catch (e) { }
            setter({ self: config, ref: "size", newVal: v, oldVal: oldValue })
        }
    }
    function _$size(config) {
        return getter({
            self: config, ref: "size", getData() {
                return config.self['size']
            }
        });
    }
    /**
     * Need to rewrite Map and Set (because responsive requires doing some things)
     */
    function setProxySM(target, root, dep) {
        const self = this;
        const proxyHandler = {
            setFields: ['set', 'add'],
            getFields: ['get', 'has'],
            set(target, p) {
                return _$set(p, self)
            },
            delete(p) {
                return _$delete(self)
            },
            get(target, p) {
                return _$get(p, self)
            },
            clear(target) {
                return _$clear(self)
            },
            size() {
                return _$size(self)
            },
            values(target) {
                return _iteratorGenerationSM(target.values.bind(target), self);
            },
            keys(target) {
                return _iteratorGenerationSM(target.keys.bind(target), self);
            },
            handler(target, p, reactive) {
                if (p === Symbol.iterator) {
                    return function iterator() {
                        return _$iterator(self)()
                    }
                }
                if (!Reflect.has(target, p)) {
                    return void 0
                }
                const _p = Object.keys(this).filter(key => isFunction(this[key])).find(key => key === p)
                if (_p) {
                    return this[p](target, p)
                }
                if (proxyHandler.setFields.indexOf(p) > -1) {
                    return this.set(target, p, reactive)
                }
                if (proxyHandler.getFields.indexOf(p) > -1) {
                    return this.get(target, p, reactive)
                }
                return (function () {
                    return target[p].bind(target)
                }())
            }
        };
        return new Proxy(target, {
            get(target, p, reactive) {
                return proxyHandler.handler(target, p, reactive)
            },
        })
    }
    function __toValue(target) {
        if (target && (isReactiveSensitive(target) || target.is_ref === true)) {
            return target.value
        }
        return target
    }

    function $triggerEffect(target, ref, type, newVal) {
        const raw = toRaw(target)
        if (type === "set") {
            raw[ref] = newVal
        }
        if (type === "delete") {
            delete raw[ref]
        }
        triggerEffects(...arguments)
    }
    function triggerEffects(target, ref, type, newVal, oldVal, onTriggerFlag = true) {
        try {
            const config = __$isReactive(target)[1];
            if (config) {
                const deps = config.deps.get(ref)
                if (config.deps.has(ITERATE_KEY) && type === "add") {
                    config.deps.get(ITERATE_KEY).forEach(_ => {
                        _.updateDeps(config.selfProxy, void 0, config.deps.get(ITERATE_KEY), onTriggerFlag)
                    })
                }
                if (deps) {
                    deps.forEach(_ => {
                        if (!_.active) {
                            deps.delete(_)
                        } else
                            _.updateDeps(newVal, oldVal, deps, onTriggerFlag)
                    })
                }
                if (type === "delete") {
                    config.deps.delete(ref)
                }
            }
        } catch (err) {
            log.warn1(err)
        }
        return true
    }
    /* Functions for modifying proxy object properties set === setter (Need to step in and do something else) */
    function setter(target) {
        const { self, ref, newVal, oldVal, type } = target;
        if (is(newVal, oldVal)) return;
        return triggerEffects(self.self, ref, type, newVal, oldVal)
    }

    function trackEffects(target, ref, type) {
        if (configTool.proxy.has(target)) {
            const deps = configTool.proxy.get(target).deps.get(ref) || new Set()
            def(deps, "$ref", ref)
            dependencyCollection(deps)
            configTool.proxy.get(target).deps.set(ref, deps)
            return deps
        }
    }

    function getter(target) {
        const { self, ref, getData } = target;
        trackEffects(self.self, ref, "type")
        try {
            return __toValue(self.isShallow ? getData() : setProxy(getData()));
        } catch (e) {
            log.warn1(e)
        }
    }

    function targetTypeMap(rawType) {
        switch (rawType) {
            case 'Object':
            case 'Array':
                return 1 /* TargetType.COMMON */;
            case 'Map':
            case 'Set':
            case 'WeakMap':
            case 'WeakSet':
                return 2 /* TargetType.COLLECTION */;
            default:
                return 0 /* TargetType.INVALID */;
        }
    }

    const proxyKEY1 = '__reactive'

    const proxyKEY2 = '__skip'

    function getTargetType(value) {
        return value[proxyKEY2] || !Object.isExtensible(value)
            ? 0 /* TargetType.INVALID */
            : targetTypeMap(toRawType(value));
    }
    /**
     * Add proxy responsive data (dep)
     */
    function setProxy(target, options) {
        if (isReadonly(target)) return target
        if (isFrozen(target)) {
            return target
        }
        if (configTool.markRawProxy.has(target)) {
            return configTool.markRawProxy.get(target).self
        }
        if (typeof target !== 'object' || target === null) {
            return target
        }
        if (getTargetType(target) === 0) {
            return target
        }
        let { root, dep, rootDeps, isShallow } = options || {}
        const configToolProxy = __$isReactive(target)
        if (configToolProxy) {
            return configToolProxy[1].selfProxy
        }
        dep = dep || generateDep()
        /* Configuration items for proxy dep */
        const config = createConfig(dep, target, root, rootDeps, isShallow)
        /* It needs to be determined whether it is' Set 'or' Map '. If it is of these two types, it will be transferred to another proxy data method */
        let selfProxy;
        if (isSM(target)) {
            selfProxy = setProxySM.apply(config, [target, root, dep, rootDeps]);
        } else {
            selfProxy = new Proxy(target, {
                get(target, p, reactive) {
                    return getter({
                        self: config,
                        ref: p,
                        getData() {
                            return Reflect.get(config.self, p, config.selfProxy);
                        }
                    });
                },
                set(target, p, value, reactive) {
                    const oldValue = Reflect.get(reactive, p);
                    if (Array.isArray(target)) {
                        if (!(p in target)) {
                            reactive.length = target.length + 1
                        }
                    }
                    const _type = Reflect.has(target, p) ? "set" : "add"
                    Reflect.set(target, p, value, reactive);
                    return setter({ self: config, ref: p, newVal: value, oldVal: oldValue, type: _type }) || true
                },
                deleteProperty(target, p) {
                    const oldValue = Reflect.get(target, p);
                    setter({ self: config, ref: p, newVal: void 0, oldVal: oldValue, type: "delete" });
                    return Reflect.deleteProperty(target, p)
                },
                has(target, p) {
                    this.get(target, p, config.selfProxy)
                    return Reflect.has(target, p)
                },
                ownKeys(target) {
                    this.get(target, isArray(target) ? "length" : ITERATE_KEY, selfProxy)
                    return Reflect.ownKeys(target)
                }
            })
        }
        config.selfProxy = selfProxy;
        def(selfProxy, proxyKEY1, true)
        /* Need to add proxy data to the global configuration */
        configTool.proxy.set(target, config)
        return config.selfProxy
    }

    function watchEffect(callback, options) {
        return doWatch(callback, () => { }, options || {})
    }
    function watchEffectSync(callback, options) {
        return doWatch(callback, () => { }, { ...options || {}, flush: "sync" })
    }

    function nextTick(fn) {
        const p = currentFlushPromise || resolvedPromise;
        return fn ? p.then(this ? fn.bind(this) : fn) : p;
    }


    function _addDeps(deps, _dep) {
        if (deps) {
            for (let dep of deps) {
                _addDep(dep, _dep)
            }
        }
    }
    function _addDep(dep, _dep) {
        dep && dep.add(_dep)
    }

    function triggerTrack(dep) {
        if (this !== void 0 && this !== window && this.constructor === EffectReactive) {
            if (isFunction(this.onTrack) && dep) {
                this.onTrack({ deps: dep, key: dep.$ref, type: "get" })
            }
        }
    }
    function triggerTrigger(dep, newValue, oldValue) {
        if (this !== void 0 && this !== window && this.constructor === EffectReactive) {
            if (isFunction(this.onTrigger) && dep) {
                this.onTrigger({ deps: dep, key: dep.$ref, type: "set", newValue, oldValue })
            }
        }
    }
    let currentWatcherScope = null
    function dependencyCollection(dep) {
        let _currentWatcherScope = currentWatcherScope
        while (_currentWatcherScope) {
            _currentWatcherScope.deps = (_currentWatcherScope.deps || new Set())
            triggerTrack.apply(_currentWatcherScope, [dep])
            _currentWatcherScope.deps.add(dep.add(_currentWatcherScope))
            _currentWatcherScope = null
        }
        configTool.collectDeps.forEach(_ => {
            _.addDeps(dep)
        })
    }
    /**
     * Proxy Dep Data Listener
     */
    class EffectReactive {
        constructor(
            fu /* Collect Dependency Functions */,
            scheduler /* Dependency change function */,
            options = {}) {
            !isObject(options) && (options = {})
            this.active = true
            this.parent = null
            this.deps = void 0
            this.onTrack = options.onTrack;
            this.onTrigger = options.onTrigger;
            this.fu = fu
            this.scheduler = scheduler
            this.isRecollect = !!options.isRecollect
            options.init && this.run()
            recordEffectScope(this)
        }
        run() {
            if (!this.active) return
            if (this.isRecollect && this.deps) {
                this.start()
            }
            this.parent = currentWatcherScope
            try {
                currentWatcherScope = this
                // const exa = new CollectDeps(this)
                // exa.stop()
                return this.fu(this)
            } finally {
                currentWatcherScope = this.parent || null
                this.parent = null
            }
        }
        updateDeps(newVal, oldVal, dep, flag) {
            if (!this.active) return
            flag && triggerTrigger.apply(this, [dep, newVal, oldVal])
            this.deps.has(dep) && this.scheduler(newVal, oldVal)
        }
        start() {
            !this.active && (this.active = true)
        }
        stop() {
            if (this.active) {
                this.active = false
                this.deps.forEach(dep => {
                    dep.delete(this)
                })
                this.deps.clear()
            }
        }
        opennessDeps() {
            this.deps && this.deps.forEach((v, _) => {
                dependencyCollection(_)
            })
        }
    }

    function effectReactive(...args) {
        const _watcher = new EffectReactive(args[0], args[1], {
            ...(args[2] || {}),
            init: false,
        })
        return {
            run() {
                return _watcher.run()
            },
            stop() {
                _watcher.stop()
            }
        }
    }

    function defineProperty(target, key, options) {
        try {
            Object.defineProperty(target, key, {
                ...(options || {}),
                get: () => options.get?.(),
                set: (v) => options.set?.(v),
                writable: false
            })
        } finally {
            return target
        }
    }

    function watch(source, cb, options) {
        return doWatch(source, cb, options || {})
    }

    function reactive(target) {
        if (typeof target !== 'object' || target === null) {
            log.warn(`[reactive The ${JSON.stringify(target)}] The target source can only be an object`)
            return null
        }
        return setProxy(target, null)
    }

    function readonly(state) {
        if (typeof state !== 'object' || state == null) return state
        const _errorHandler = (...a) => log.warn1(`${a} It is a read-only attribute and cannot be modified origin`, readonlyState)
        if (configTool.readonlys.has(state) || configTool.readonlys.get(state) == state) {
            return configTool.readonlys.get(state)
        }
        const readonlyState = _readonly(state)
        configTool.readonlys.set(state, readonlyState)
        return readonlyState

        function _readonly(_state) {
            /* Set|Map proxy */
            if (isSM(_state)) {
                return new Proxy(_state, {
                    /* Rewrite get */
                    get(target, p, reactive) {
                        if (/^get/.test(p)) {
                            return function (...a) {
                                const value = Reflect.get(target, p, reactive).call(_state, ...a)
                                return readonly(value)
                            }
                        }
                        /* Non modifiable method */
                        const no = ['delete', 'set',]
                        if (no.indexOf(p) !== -1) {
                            return (...a) => _errorHandler(...a)
                        }
                        return Reflect.get(target, p, reactive).bind(_state);
                    },
                    _readonly: true
                })
            } else {
                /* Object proxy */
                return new Proxy(_state, {
                    get(target, p, reactive) {
                        return Reflect.get(target, p, reactive)
                    },
                    set(target, p, value, reactive) {
                        _errorHandler(p)
                        return 1
                    },
                    deleteProperty(target, p) {
                        _errorHandler(p)
                        return 1
                    },
                    _readonly: true
                })
            }
        }
    }

    function findReadonly(target) {
        return configTool.readonlys.has(target)
    }

    function isReadonly(target) {
        return !!findReadonly(target)
    }

    function unReadonly(target) {
        if (_isObject(target)) {
            const sub = findReadonly(target)
            if (!!sub) {
                configTool.readonlys.delete(sub[0])
                return reactive(target)
            }
        }
        return target
    }

    function computed(handler) {
        return new Computed(handler)
    }

    function generateDep() {
        return ++configTool.depsId;
    }
    const def = (obj, key, value) => {
        Object.defineProperty(obj, key, {
            configurable: true,
            enumerable: false,
            value
        });
    };
    function trackRefEffect(target) {
        if (currentWatcherScope) {
            configTool.proxy.set(target, configTool.proxy.get(target) || {
                selfProxy: void 0, self: target,
                deps: new Map()
            })
            target.deps = trackEffects(target, "value", "get")
            if (target._objectRoot && target._key) {
                trackEffects(target._objectRoot, target._key, "get")
            }
        }
    }
    class RefClass {
        constructor(value, root, _ref, isShallow) {
            this.__f__isShallow = !!isShallow
            this._is_ref = true
            this._defalutValue = value;
            this._objectRoot = root;
            this.deps = void 0
            this._key = _ref;
            this._value = value
            def(this, proxyKEY1, true)
        }

        set value(v) {
            const oldVal = this._value
            if (!is(v, oldVal)) {
                this._value = v
                triggerEffects(this, 'value', 'set', v, oldVal)
                if (this._objectRoot && this._key) {
                    this._objectRoot[this._key] = this._value
                }
            }
        }
        get value() {
            trackRefEffect(this)
            return !_isObject(this._value) ? this._value : this.__f__isShallow ? toRaw(this._value) : reactive(this._value)
        }
    }

    class Computed {
        constructor(callback) {
            if (this.is(callback)) {
                this.deps = void 0
                this.effect = null;
                this._dirty = true
                this._ref = true
                this._is_ref = true
                def(this, proxyKEY1, true)
            } else log.warn(`The target source must be an object or function, ${callback} is not a valid value`)
        }
        is(callback) {
            let isHandler = true;
            if (!isObject(callback) && (isHandler = !isFunction(callback))) {
                return !1;
            }
            this.get = !isHandler ? callback : callback.get;
            this.set = callback.set || (() => log.warn1(""));
            return !0;
        }
        get value() {
            trackRefEffect(this)
            return this.track()
        }
        set value(v) {
            this.set(v)
        }
        track() {
            if (this._dirty) {
                if (this.effect) {
                    this.effect.stop()
                }
                const effect = new EffectReactive(() => {
                    return this.get()
                }, () => {
                    triggerEffects(this, "value", "set", this._value, this._value, false)
                    this._dirty = true
                })
                const oldVal = this._value
                this._value = effect.run()
                if (this.effect) {
                    for (let w of this.deps || []) {
                        triggerTrigger.apply(w, [this.deps, this._value, oldVal])
                    }
                }
                this.effect = effect
            }
            this._dirty = false
            return this._value
        }
    }

    class CustomRef {
        constructor(target) {
            this.deps = void 0
            this._value = void 0
            this._is_ref = true
            const _target = target(() => trackRefEffect(this), () => triggerEffects(this, 'value', 'set', this.value, this._value));
            if (!isFunction(_target && _target['get'])) {
                return log.warn1("Cannot destructure property 'get' of 'factory(...)' as it is not function") || {}
            }
            if (!isFunction(_target && _target['set'])) {
                return log.warn1("Cannot destructure property 'set' of 'factory(...)' as it is not function") || {}
            }
            this._get = _target.get;
            this._set = _target.set;
            def(this, proxyKEY1, true)
        }

        get value() {
            return this._get();
        }

        set value(v) {
            this._value = v
            return this._set(v)
        }
    }

    function customRef(target) {
        if (!isFunction(target)) {
            return log.warn1("The event source is a function")
        }
        return new CustomRef(target);
    }

    function shallowRef(target) {
        return new RefClass(target, void 0, void 0, !0)
    }

    function toRef(root, ref) {
        if (root[ref] instanceof RefClass) return root[ref]
        return new RefClass(root[ref], root, ref);
    }

    function ref(target) {
        if (target instanceof RefClass) return target
        return new RefClass(target, void 0, void 0)
    }

    function toRefs(target) {
        const obj = isArray(target) ? new Array(target.length) : {};
        if (isReactive(target)) {
            for (let w in target) {
                obj[w] = toRef(target, w)
            }
        } else {
            log.warn1("toRefs() expects a reactive object but received a plain one.")
        }
        return obj
    }

    function isReactiveSensitive(target) {
        return [RefClass, Computed, CustomRef].indexOf(target && target.constructor) > -1
    }

    function _toValue(target, deep) {
        try {
            if (isFunction(target)) {
                return !deep ? target() : _toValue(target(), deep)
            }
        } catch (err) {
            warn1(err)
        }
        return __toValue(target)
    }

    function toValue(target) {
        return _toValue(target, false)
    }

    function toValues(target) {
        return _toValue(target, true)
    }

    function isProxy(target) {
        return isReactive(target) || isReadonly(target)
    }

    function toRaw(target) {
        const _target = _isReactive(target)
        if (_target) {
            return _target[0]
        }
        return target
    }

    function _isRef(target) {
        return target._is_ref === !0
    }

    function isRef(target) {
        return target != null && _isRef(target)
    }

    function unref(target) {
        return _isRef(target) ? target.value : target
    }

    function _markRaw(target) {
        const _target = _isReactive(target)
        configTool.markRawProxy.set(target, _target ? _target.self : target)
        return configTool.markRawProxy.get(target)
    }

    function markRaw(target) {
        return _markRaw(target)
    }

    function _unMarkRaw(target) {
        configTool.markRawProxy.delete(target)
        return target
    }

    function unMarkRaw(target) {
        return _unMarkRaw(target)
    }

    function unReactive(target) {
        const _target = _isReactive(target)
        if (_target) {
            const result = toRaw(target)
            configTool.proxy.delete(_target[0])
            configTool.proxy.delete(_target[1].selfProxy)
            return result
        }
        return target
    }

    function unProxy(target) {
        if (_isObject(target)) {
            return unReactive(target)
        }
        return target
    }

    function effectScope(...args) {
        const scope = new EffectScope(...args)
        return scope
    }

    function _reactiveToValueDeep(target) {
        const _obj = new WeakMap()
        function _run(_target) {
            const reactiveData = __$isReactive(_target) || [_target]
            if (_obj.has(reactiveData[0])) return
            if (!ordinaryType(_target)) {
                _obj.set(reactiveData[0], _target)
                try {
                    for (let w of _target) {
                        _run(w)
                    }
                } catch {
                    try {
                        for (let w in _target) {
                            _run(_target[w])
                        }
                    } catch {
                    }
                }
            }
        }
        _run(target)
        return target
    }

    function isReactiveArr(target) {
        return !isReactive(target) && isArray(target) ? target.map(i => toValue(i)) : [target]
    }
    function argumentsFlatShape(_arguments) {
        if (!isArray(_arguments)) {
            return _arguments
        } else if (_arguments.length === 1) {
            return _arguments[0]
        } else {
            let flag = !_arguments.some(i => isArray(i) && i.length > +true);
            const flatArr = []
            for (let w in _arguments) {
                if (isArray(_arguments[w])) {
                    flatArr.push(flag ? _arguments[w][0] : _arguments[w])
                } else flatArr.push(_arguments[w])
            }
            return flatArr
        }
    }

    const queue = []
    const JOB_KEY = Symbol("job_id")
    let isFlushing;

    function queueJob(job) {
        const i = queue.findIndex(i => i === job || i[JOB_KEY] === job[JOB_KEY])
        if (i === -1) {
            job[JOB_KEY] = Date.now()
            queue.push(job);
        } else
            queue.splice(i, 1, job);

        queueFlush()
    }
    function queueFlush() {
        if (!isFlushing) {
            currentFlushPromise = resolvedPromise.then(flushJobs)
        }
    }
    const getId = (job) => job.id == null ? Infinity : job.id;
    const comparator = (a, b) => {
        const diff = getId(a) - getId(b);
        if (diff === 0) {
            if (a.pre && !b.pre)
                return -1;
            if (b.pre && !a.pre)
                return 1;
        }
        return diff;
    };
    function callWithErrorHandling(fn, args) {
        let res;
        try {
            res = args ? fn(...args) : fn();
        } catch (err) {
            log.warn1(err)
        }
        return res;
    }
    function flushJobs(seen) {
        isFlushing = true
        queue.sort(comparator);
        seen = seen || new Map()
        const check = (job) => checkRecursiveUpdates(seen, job);
        try {
            for (let w = 0; w < queue.length; w++) {
                const cb = queue[w]
                if (check(cb)) {
                    continue;
                }
                queue.splice(w, 1)
                w--
                callWithErrorHandling(cb)
            }
        } finally {
            queue.length = 0
            isFlushing = false
            if (queue.length) {
                queueFlush(seen)
            }
        }
    }

    const RECURSION_LIMIT = 100;
    function checkRecursiveUpdates(seen, fn) {
        if (!seen.has(fn)) {
            seen.set(fn, 1);
        } else {
            const count = seen.get(fn);
            if (count > RECURSION_LIMIT) {
                log.warn1(
                    `Maximum recursive updates`
                );
                return true;
            } else {
                seen.set(fn, count + 1);
            }
        }
    }

    function doWatch(source, handler, { immediate, deep, flush, onTrack, onTrigger } = options || {}) {
        if (ordinaryType(source)) {
            return log.warn1("")
        }
        let _source, getter;
        if (isFunction(source)) {
            _source = [source]
        } else if (!isReactive(source) && isArray(source)) {
            _source = source.map(item => isFunction(item) ? item : () => item)
        } else if (isReactive(source) || true) {
            _source = [() => [source]]
        }
        if (!flush) flush = "pre"
        let cleanup, newVal, oldVal;
        const job = () => {
            oldVal = newVal || void 0
            newVal = _effectReactive.run();
            handler(newVal, oldVal)
        }

        if (flush === "sync") {
            cleanup = job
        } else if (flush === "pre" || (flush !== "pre" && flush !== "sync")) {
            cleanup = () => queueJob(job)
        }
        getter = () => {
            const result = _source.map(cb => {
                const rt = isReactiveArr(__toValue(cb()))
                return deep ? _reactiveToValueDeep(rt) : rt
            })
            return argumentsFlatShape(argumentsFlatShape(result))
        }

        const _effectReactive = effectReactive(getter, () => cleanup(), { onTrack, onTrigger, deep, isRecollect: true })
        if (immediate === true) {
            job()
        } else {
            newVal = _effectReactive.run();
        }

        return () => _effectReactive.stop()
    }

    function propsReactive(target) {
        if (ordinaryType(target)) {
            return log.warn1("")
        }
        const _target = new Proxy(toRaw(target), {
            set() {
                return log.warn1("")
            },
            get(_target, p) {
                return Reflect.get(target, p) || Reflect.get(_target, p)
            }
        })
        def(_target, proxyKEY1, true)
        return _target
    }

    function triggerRef(target) {
        if (__$isReactive(target)) {
            try {
                for (let w of target) {
                    triggerEffects(target, w[0], 'set', w[1], w[1])
                }
            } catch {
                try {
                    for (let w in target) {
                        triggerEffects(target, w, 'set', target[w], target[w])
                    }
                } catch {

                }
            }
        }
        return target
    }
    function recordEffectScope(effect, scope = activeEffectScope) {
        if (scope && scope.active) {
            scope.effects.push(effect);
        }
    }
    let activeEffectScope;
    class EffectScope {
        constructor(detached = false) {
            this.detached = detached;
            this._active = true;
            this.effects = [];
            this.cleanups = [];
            this.parent = activeEffectScope;
            if (!detached && activeEffectScope) {
                this.index = (activeEffectScope.scopes || (activeEffectScope.scopes = [])).push(
                    this
                ) - 1;
            }
        }
        get active() {
            return this._active;
        }
        run(fn) {
            if (this._active) {
                const currentEffectScope = activeEffectScope;
                try {
                    activeEffectScope = this;
                    return fn();
                } finally {
                    activeEffectScope = currentEffectScope;
                }
            } else {
                log.warn1(`cannot run an inactive effect scope.`);
            }
        }
        on() {
            activeEffectScope = this;
        }
        off() {
            activeEffectScope = this.parent;
        }
        stop(fromParent) {
            if (this._active) {
                let i, l;
                for (i = 0, l = this.effects.length; i < l; i++) {
                    this.effects[i].stop();
                }
                for (i = 0, l = this.cleanups.length; i < l; i++) {
                    this.cleanups[i]();
                }
                if (this.scopes) {
                    for (i = 0, l = this.scopes.length; i < l; i++) {
                        this.scopes[i].stop(true);
                    }
                }
                if (!this.detached && this.parent && !fromParent) {
                    const last = this.parent.scopes.pop();
                    if (last && last !== this) {
                        this.parent.scopes[this.index] = last;
                        last.index = this.index;
                    }
                }
                this.parent = void 0;
                this._active = false;
            }
        }
    }


    class RefClassModel extends RefClass {
        effect = null
        set value(v) {
            if (!is(v, this._value)) {
                const oldVal = this._value
                $triggerEffect(this._objectRoot, this._key, 'set', v, oldVal)
                triggerEffects(this, 'value', 'set', v, oldVal)
            }
        }
        get value() {
            if (!this.effect) {
                this.effect = new EffectReactive(() => this._objectRoot[this._key], () => {
                    this._value = this._objectRoot[this._key]
                })
                this.effect.run()
            }
            trackRefEffect(this)
            return !_isObject(this._value) ? this._value : this.__f__isShallow ? toRaw(this._value) : reactive(this._value)
        }
    }

    function toRefsModel(target) {
        const obj = isArray(target) ? new Array(target.length) : {};
        if (isReactive(target)) {
            for (let w in target) {
                obj[w] = new RefClassModel(target[w], target, w, true)
            }
        } else {
            log.warn1("toRefsModel() expects a reactive object but received a plain one.")
        }
        return obj
    }

    const $$hooks = (function () {
        const _is = is
        function collectTime() {
            const _ = Date.now()
            return () => Date.now() - _
        }
        function createState() {
            const _index = index
            const __ = collectTime()
            let _gate = false
            try {
                return def({
                    refId: 0,
                    state: [],
                    effects: [],
                    effectIndex: 0,
                    stateIndex: 0,
                    id: Date.now(),
                    _: __(),
                    _index: _index,
                    flag: true,
                }, 'gate', {
                    get() {
                        return _gate
                    },
                    set(v) {
                        _gate = v
                        if (this.flag) {
                            if (v) {
                                this.flag = true
                                this.refId = 0
                                this.stateIndex = 0
                                this.effectIndex = 0
                            } else {
                                if (this.stateIndex !== this.state.length || this.effectIndex !== this.effects.length) {
                                    try {
                                        throw new Error("error Rendered fewer hooks than expected. This may be caused by an accidental early return statement.")
                                    } catch (err) {
                                        throw new Error(err)
                                    } finally {
                                        this.flag = false
                                    }
                                }
                            }
                        }
                    }
                })[0]
            } finally {
                index++
            }
        }
        const def = (obj, key, options) => {
            Object.defineProperty(obj, key, {
                configurable: true,
                enumerable: false,
                ...options || {},
            });
            return [obj, def]
        };

        function createSelfState(dep) {

            if (tasks.some((cb) => cb === dep)) {
                return tasks.find((cb) => cb === dep) || (() => { })
            }
            const state = createState()
            function _() {
                return state
            }
            tasks.push(_)
            return _
        }

        function _createState(target, options, prev) {
            const state = {
                initValue: target,
                history: [target],
                updateTime: null,
                optionbs: options || null,
                scheduler: null,
                prevUpdateTime: null,
                add(v) {
                    if (this.history.length > 2) {
                        this.history.splice(this.history.length - 2, 1)
                    }
                    this.history.push(v)
                },
                prev: prev || null,
                next: null
            }
            let _updateTime = null
            def(state, "updateTime", {
                get() {
                    return _updateTime
                },
                set(v) {
                    state.prevUpdateTime = _updateTime
                    _updateTime = v
                }
            })[1](state, 'value', {
                get() {
                    return state.history.at(-1)
                }
            })
            return state
        }

        function examineStateTasks() {
            if (currentState) {
                const _currentState = currentState
                _currentState.gate = true
                return () => {
                    _currentState.gate = false
                }
            } else {
                throw new Error("error")
            }
        }


        function _judgeCurrentState() {
            if (!currentState || !currentState.gate) {
                console.error("Invalid hook call. Hooks can only be called inside of the body of a function component.")
                return true
            }
        }

        function scopeTaskStateScheduler(renderHandler, $callback = v => v) {
            let _ = null
            const callback = (props) => {
                let result = null
                currentState = (_ = createSelfState(_))()
                currentState.scheduler = () => {
                    (props.updateScheduler && props.updateScheduler()) || globalCurrentScheduler && globalCurrentScheduler()
                }
                currentScheduler = props.updateScheduler
                const resultExamineStateTasks = examineStateTasks()
                try {
                    result = renderHandler(props)
                } catch (err) {
                    console.error(err)
                } finally {
                    result = $callback(result)
                    try {
                        resultExamineStateTasks()
                    } catch (err) {
                        console.warn(err)
                    } finally {
                        currentState = null
                        return result
                    }
                }
            }
            return callback
        }

        function renderDeef(node, treeNode, treeSub, callback) {
            let _node = node
            if (isObject(node)) {
                _node = { ...node, originNode: node, props: { ...node.props } }
                const props = _node.props
                if (props && props.children) {
                    const _children = uniteArray(props.children)
                    const __children = [..._children]
                    for (let w in _children) {
                        if (isRef(_children[w])) {
                            __children[w] = toValue(_children[w])
                        }
                        __children[w] = renderDeef(__children[w], [...treeNode, __children[w]], [...treeSub, +w], callback)
                    }
                    props.children = __children
                }
            } else {
                if (isArray(node)) {
                    _node = [...node]
                    for (let w = 0; w < _node.length; w++) {
                        _node[w] = renderDeef(_node[w], [...treeNode, _node[w]], [...treeSub, w], callback)
                    }
                }
            }

            return isFunction(callback) ? callback(_node, treeNode, treeSub, node) : _node
        }

        function render(renderHandler, callback) {
            return scopeTaskStateScheduler(renderHandler, (result) => {
                return renderDeef(result, [result], [0], callback)
            })
        }

        function createCurrentState(target, options) {
            if (currentState) {
                const _currentState = currentState
                try {
                    const currentSub = _currentState.stateIndex
                    const state = _currentState.state
                    let current = state[currentSub] || state[state.push(_createState(target, options)) - 1];
                    const _options = current.options || options
                    if (!('replaceFlag' in _options)) options.replaceFlag = false
                    current = _is(current.initValue, target) || !_options.replaceFlag ? current : (current.next = state.splice(currentSub, 1, _createState(target, options, current)) && state[currentSub]);
                    current._scheduler = _options?.scheduler || _currentState.scheduler || currentScheduler;
                    return [current.value, (current.scheduler || (current.scheduler = (value) => {
                        if (!_is(value, current.value)) {
                            current.add(value)
                            current.updateTime = Date.now()
                            current._scheduler()
                        }
                    }))]
                } finally {
                    _currentState.stateIndex++
                }
            }
        }

        function createCurrentEffect(callback, schedule, deps) {
            if (currentState) {
                try {
                    const _currentState = currentState
                    const currentSub = _currentState.effectIndex
                    const effects = _currentState.effects
                    if (effects.length <= currentSub || effects.length === 0) {
                        effects.push({
                            scheduler(options) {
                                if (_currentState.effectIndex >= currentSub && _currentState.flag) {
                                    effects[currentSub].deps = options.deps
                                    effects[currentSub].init = true
                                    schedule(() => _currentState.flag, options, effects, currentSub, _currentState);
                                }
                            },
                            resultScheduler: null,
                            deps: null,
                            init: false
                        })
                    }
                    if ((function () {
                        if (effects[currentSub].init === false) {
                            return true
                        }
                        const oldDeps = uniteFunction(effects[currentSub].deps)();
                        const newDeps = uniteFunction(deps)();
                        return oldDeps == null || oldDeps.length && (newDeps.length !== oldDeps?.length || oldDeps?.some((dep, index) => newDeps[index] !== dep))
                    })()) {
                        effects[currentSub].scheduler({
                            callback, deps
                        })
                    }

                } finally {
                    currentState.effectIndex++
                }
            }
        }

        function useEffectPre(target, deps) {
            if (_judgeCurrentState()) return
            createCurrentEffect(target, (validate, options, effects, currentSub) => {
                const _callback = options.callback
                effects[currentSub].resultScheduler && effects[currentSub].resultScheduler()
                nextTick(() => {
                    if (!validate()) return
                    effects[currentSub].resultScheduler = _callback()
                })
            }, deps)
        }

        function useEffectSync(target, deps) {
            if (_judgeCurrentState()) return
            createCurrentEffect(target, (validate, options, effects, currentSub) => {
                if (!validate()) return
                effects[currentSub].resultScheduler && effects[currentSub].resultScheduler()
                effects[currentSub].resultScheduler = options.callback()
            }, deps)
        }

        function useState(target, options = {}) {
            if (_judgeCurrentState()) return
            return createCurrentState(target, options)
        }

        function useUpdate() {
            if (_judgeCurrentState()) return
            const updateScheduler = currentState.scheduler
            return () => {
                updateScheduler && updateScheduler()
            }
        }

        function useEffect(callback, deps) {
            return useEffectPre(callback, deps)
        }

        function watchEffect(target, deps, scheduler = (v) => v) {
            if (_judgeCurrentState()) return
            let [result, setResult] = useState(null, {
                scheduler: () => { },
                replaceFlag: false
            })
            useEffectPre(() => {
                setResult(result = scheduler(target))
            }, deps)
            return result
        }

        function useCallback(target, deps) {
            return watchEffect(target, deps)
        }

        function useMemo(target, deps) {
            return watchEffect(target, deps, (v) => v())
        }

        function useId() {
            if (_judgeCurrentState()) return
            return `:rud${currentState.refId++}`
        }

        function useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot) {
            if (_judgeCurrentState()) return
            const _currentState = currentState
            let [dispatcher, setDispatcher] = createCurrentState(null, {
                scheduler: () => void 0
            })
            useEffectPre(() => {
                if (typeof dispatcher === "function") {
                    dispatcher()
                }
                const __ = () => {
                    _currentState.scheduler()
                }
                setDispatcher(dispatcher = subscribe(__))
            }, [subscribe])

            return getSnapshot()
        }

        function useLayoutEffect(target, deps) {
            return useEffectPre(target, deps)
        }

        function useReducer(reducer, initialArg, init) {
            if (_judgeCurrentState()) return
            const [isInit, setInit] = createCurrentState(false, {
                scheduler() { }
            })
            const _store = (typeof init === "function" && !isInit ? !setInit(true) && init(initialArg) : initialArg)
            let [store, setStore] = createCurrentState(_store, { replaceFlag: false })
            const updateScheduler = useCallback((target) => {
                setStore(reducer(store, target))
            })
            return [store, updateScheduler]
        }

        function memo(component, callback) {
            let result = null
            let oldProps = null
            let init = false
            const _callback = typeof callback === "function" ? callback : () => !void 0
            function _(props) {
                let next = !!_callback()
                if (next) {
                    try {
                        for (let w in (props || {})) {
                            if (oldProps[w] !== props[w]) {
                                next = false
                                break
                            }
                        }
                    } catch {
                        next = false
                    }
                }
                oldProps = props || {}
                return !init ? !(init = true) : next
            }

            return function (props) {
                if (!_(props)) {
                    result = component(props)
                }
                return result
            }
        }

        function useRef(target) {
            return $$hooks.useState({ current: target }, { replaceFlag: false })[0]
        }

        return {
            useState: useState,
            useEffect: useEffect,
            renderScheduler: render,
            useCallback: useCallback,
            useMemo: useMemo,
            useId: useId,
            useSyncExternalStore: useSyncExternalStore,
            useLayoutEffect: useLayoutEffect,
            useReducer: useReducer,
            memo: memo,
            useRef: useRef,
            useEffectPre: useEffectPre,
            useEffectSync: useEffectSync,
            useUpdate: useUpdate
        }
    })()
    const stateRefTask = new WeakMap();

    $$hooks.useStateRef = function useStateRef(target) {
        try {
            const [state] = $$hooks.useState(ref(target), { replaceFlag: false })
            stateRefTask.set(state, {
                state: currentState,
                index: currentState.stateIndex + 1
            })
            const [__, $useState] = $$hooks.useState(state.value)
            $$hooks.useEffectSync(() => {
                return watch(state, (nv, ov) => {
                    $useState(nv)
                }, { flush: "sync" })
            }, [state.value])
            return state
        } catch { }
    }

    function uniteFunction(target) {
        return isFunction(target) ? target : () => target;
    }

    function uniteArray(target) {
        return isArray(target) ? target : [target];
    }

    $$hooks.useEffectRef = function useEffectRef(callback, deps, options = { flush: 'pre' }) {
        const _deps = uniteFunction(deps)()
        const newDeps = _deps == null ? null : uniteArray(_deps).map(i => stateRefTask.has(i) ? toValue(i) : i);
        $$hooks[options.flush === 'pre' ? 'useEffectPre' : options.flush === "sync" ? 'useEffectSync' : 'useEffect'](() => {
            return callback()
        }, newDeps)
    }

    const hooks = {
        computed,
        reactive,
        watchEffect,
        watch,
        ref,
        toRefs,
        toRef,
        readonly,
        customRef, isReadonly, unReadonly,
        shallowRef, toValues, isReactive, toValue, isRef, unref, isProxy, toRaw, markRaw, unMarkRaw, unProxy,
        effectScope, nextTick, effectReactive, watchEffectSync, propsReactive, triggerRef, EffectScope, toRefsModel, configTool, isFunction, isObject, isArray, ...$$hooks
    }
    return hooks
}))