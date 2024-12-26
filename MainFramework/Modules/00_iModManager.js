//------------------------------------------------------
//
//  模组相关管理器
//
//------------------------------------------------------
/**
 * iModManager is an object that provides methods to manage mod variables/configurations and handle mod widgets.
 */

const iMod = (() => {
    'use strict';

    function _setConfig(path, value) {
        setPath(V.iModConfigs, path, value);
    }

    function _getConfig(path) {
        return getPath(V.iModConfigs, path);
    }

    function _setV(modId, path, value) {
        if (!V.iModVar[modId]) {
            V.iModVar[modId] = {};
        }

        setPath(V.iModVar[modId], path, value);
    }

    function _getV(modId, path) {
        if (!V.iModVar[modId]) {
            V.iModVar[modId] = {};
        }

        return V.iModVar[modId] && path ? getPath(V.iModVar[modId], path) : V.iModVar[modId];
    }

    /**
     * 更新二个对象的值
     * @param {Object} refObj 参考对象
     * @param {Object} newObj 新值对象
     * @param {boolean} overwrite 是否覆盖存在的值
     * @returns {Object} 更新后的新对象
     */
    function _updateObj(refObj, newObj, overwrite = false) {
        const data = {};
        // 先更新原有的键值对
        for (const key in refObj) {
            // 如果 newObj[key] 有效并且类型与 refObj[key] 相同
            if (isValid(newObj[key]) && typeof newObj[key] === typeof refObj[key]) {
                if (Array.isArray(refObj[key])) {
                    // 如果是数组并且长度不同而且不覆盖，则会合并数组并去重
                    if (newObj[key].length !== refObj[key].length && overwrite === false) {
                        const arr = clone(refObj[key].concat(newObj[key]));
                        data[key] = [...new Set(arr)];
                    }
                    else {
                        data[key] = clone(newObj[key]);
                    }
                }
                else if (String(newObj[key]) === '[object Object]') {
                    // 如果是对象，再次调用 updateObj 函数
                    data[key] = updateObj(refObj[key], newObj[key], overwrite);
                }
                else {
                    data[key] = clone(newObj[key]);
                }
            }
            else {
                data[key] = clone(refObj[key]);
            }
        }

        
        // 接着添加新的键值对
        for (const key in newObj) {
            if (!refObj[key]) {
                data[key] = clone(newObj[key]);
            }
        }

        return data;
    }

    function _register(modId, defaultConfig = null, defaultVariables = null) {
        if (!V.iModVar[modId]) {
            V.iModVar[modId] = {};
        }
        if (!V.iModConfigs[modId]) {
            V.iModConfigs[modId] = {};
        }

        console.log('[SF] register mod:', modId, defaultConfig, defaultVariables);
        
        if (defaultConfig !== null) {
            V.iModConfigs[modId] = _updateObj(V.iModConfigs[modId], defaultConfig);
        }

        if (defaultVariables !== null) {
            V.iModVar[modId] = _updateObj(V.iModVar[modId], defaultVariables);
        }
    }

    function _gatherModV(modId, ...args) {
        const obj = {};
        for (const arg of args) {
            obj[arg] = V.iModVar[modId][arg];
        }

        return obj;
    }

    function _gatherVariable(...args) {
        const obj = {};
        for (const arg of args) {
            setPath(obj, arg, getPath(V, arg));
        }
        return obj;
    }

    function _remove(modId) {
        delete V.iModVar[modId];
        delete V.iModConfigs[modId];
    }

    function _init() {
        if (typeof V.iModConfigs === 'undefined') {
            V.iModConfigs = {};
        }
        if (typeof V.iModVar === 'undefined') {
            V.iModVar = {};
        }

        if (typeof V.tvar === 'undefined') {
            V.tvar = {
                init : 1
            };
        }
    
        if (typeof Tvar === 'undefined') {
            Object.defineProperty(window, 'Tvar', {
                get() {
                    return V.tvar;
                }
            });
            console.log('[SF] variable Tvar is ready:', Tvar);
        }

        const lang = _getConfig('language') ?? null;

        // if the language setting is not initialized
        if (lang === null) {
            _setConfig('language', setup.language);
        }
    }

    function _playZone(zone, passageTitle) {
        const data = simpleFrameworks.data[zone];
        console.log('[SFDebug] checkzone:', zone, data);

        if (!data) return '';
        if (data.length == 0) return '';

        const title = passageTitle ?? V.passage;
        const html = data.reduce((result, widgets) => {
            if (String(widgets) == '[object Object]') {
                // if is exclude
                if (
                    typeof widgets.exclude == 'string' && widgets.exclude !== title ||
                    Array.isArray(widgets.exclude) && !widgets.exclude.includes(title)
                ) {
                    result += `<<${widgets.widget}>>`;
                }
                // if has match and is regex
                else if (widgets.match && widgets.match instanceof RegExp && widgets.match.test(title)) {
                    result += `<<${widgets.widget}>>`;
                }
                else if (
                    typeof widgets.passage == 'string' && widgets.passage == title ||
                    Array.isArray(widgets.passage) && widgets.passage.includes(title) ||
                    typeof widgets.passage == 'undefined' ||
                    widgets.passage.length == 0
                ) {
                    result += `<<${widgets.widget}>>`;
                }
                else if (typeof widgets.widget == 'string') {
                    result += `<<${widgets.widget}>>`;
                }

                return result;
            }

            result += `<<${widgets}>>`;
            return result;
        }, '');

        console.log('[SFDebug] zoneHtml:', html);

        return html;
    }

    function _isSafePerieod() {
        return V.combat == 0 && eventCheck() === false;
    }

    const _state = {
        state : null,
        isReady() {
            return this.state !== null;
        },
        isLoading() {
            return this.state === 'loading';
        },
        isRunning() {
            return this.state === 'Ok';
        },
        setReady() {
            _state.state = 'Ok';
        },
        setLoading() {
            _state.state = 'loading';
        }
    };

    function _checkDep(arr) {
        if (!Array.isArray(arr)) return false;
        for (let i = 0; i < arr.length; i++) {
            const depinfo = arr[i];
            if (depinfo.modName == 'Simple Frameworks') return true;
        }
        return false;
    }

    function _getModJson(modId) {
        const mod = modUtils.getMod(modId);
        if (!mod) return null;

        const modJson = mod.bootJson;
        if (!modJson) return null;

        return modJson;
    }

    function _getModName(modinfo) {
        if (!modinfo.nickName) return modinfo.name;
        if (typeof modinfo.nickName === 'string') return modinfo.nickName;
        if (modinfo.nickName.EN || modinfo.nickName.CN) return lanSwitch(modinfo.nickName);
        return lanSwitch(modinfo.nickName.en, modinfo.nickName.cn);
    }

    const _modData = {
        modList : [],
        mods    : {}
    };

    function _getModList() {
        const MLlist = modUtils.getModListName();
        // if utils not avaqilable, return empty array
        if (!MLlist) return [];

        // find index of Simple Frameworks
        const modlist = [];
        // find all mod that depend on Simple Frameworks
        for (let i = 0; i < MLlist.length; i++) {
            const modId = MLlist[i];
            const moddata = modUtils.getMod(modId);
            if (!moddata) continue;

            const modinfo = _getModJson(modId);
            if (_checkDep(modinfo.dependenceInfo) === false) continue;

            modlist.push({
                modId,
                name : _getModName(moddata),
                data : modinfo
            });
        }
        return modlist;
    }

    function _modRegist(modId, defaultConfig = null, defaultVariables = null) {
        if (!_modData.mods[modId]) {
            _modData.mods[modId] = {
                modId,
                config   : defaultConfig || {},
                variable : defaultVariables || {}
            };
        }
        else {
            if (defaultConfig !== null && _modData.mods[modId].config) {
                _modData.mods[modId].config = _updateObj(_modData.mods[modId].config, defaultConfig);
            }
            if (defaultVariables !== null && _modData.mods[modId].variable) {
                _modData.mods[modId].variable = _updateObj(_modData.mods[modId].variable, defaultVariables);
            }
        }

        _modData.modList.push(modId);
        console.log('[SF] regist mod:', modId, defaultConfig, defaultVariables);

        return {
            modId,
            config    : defaultConfig,
            variables : defaultVariables
        };
    }

    function _resetTvar(...keys) {
        const ignore = ['passage', 'prevPassage', 'passageHistory'];
        if (keys.length == 0) {
            const tvar = {};
            ignore.forEach(key => {
                tvar[key] = V.tvar[key];
            });

            V.tvar = tvar;
            return;
        }

        if (keys.length == 1 && array.isArray(keys[0])) {
            keys = keys[0];
        }

        for (const key of keys) {
            delete V.tvar[key];
        }
    }

    function _initModsBeforeSC() {
        const modlist = _getModList();
        if (modlist.length == 0) return;

        for (const mod of modlist) {
            const id = mod.modId;
            const configs = mod.data.SFPlugin?.defaultConfigs || {};
            const variables = mod.data.SFPlugin?.defaultVariables || {};
            _modData.mods[id] = {
                modId    : id,
                config   : configs,
                variable : variables,
                data     : mod.data
            };

            _modData.modList.push(id);

            if (mod.data.SFPlugin?.addWidget) {
                console.log('[SF] addWidget:', clone(mod.data.SFPlugin.addWidget));
                for (const [zone, options] of Object.entries(mod.data.SFPlugin.addWidget)) {
                    simpleFrameworks.addto(zone, ...options);
                }
            }
        }
    }

    function _autoRegister() {
        const modList = _getModList();
        if (modList.length == 0) return;

        console.log('[SF] autoRegister:', modList);

        for (const [modId, mod] of Object.entries(_modData.mods)) {
            _register(modId, mod.config, mod.variable);
        }
    }

    function _hasMod(modId) {
        return _modData.modList.includes(modId);
    }

    Object.defineProperty(window, 'updateObj', { value : _updateObj });

    return Object.freeze({
        get state() {
            return _state;
        },
        get modData() {
            return _modData;
        },

        init  : _init,
        setV  : _setV,
        getV  : _getV,
        setCf : _setConfig,
        getCf : _getConfig,
        has   : _hasMod,
        
        regist   : _modRegist,  // regist mod to iMod manager and will auto init when variables is ready;
        registV  : _register,   // regist mod to V.iModVar and V.iModConfigs directly
        remove   : _remove,
        initMods : _autoRegister,

        initModsBefore : _initModsBeforeSC,
        
        gatherModV     : _gatherModV,
        gatherVariable : _gatherVariable,
        getModList     : _getModList,
        getModName     : _getModName,

        play : _playZone,

        isSafePeriod : _isSafePerieod,
        resetTvar    : _resetTvar
    });
})();

Object.defineProperties(window, {
    Story  : { get : () => SugarCube.Story },
    Macro  : { get : () => SugarCube.Macro },
    Engine : { get : () => SugarCube.Engine }
});

