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

    function _getModList() {
        const MLlist = modUtils.getModListName();
        // if utils not avaqilable, return empty array
        if (!MLlist) return [];

        // find index of Simple Frameworks
        const index = MLlist.indexOf('Simple Frameworks');
        // then get rest after Simple Frameworks
        const rest = MLlist.slice(index + 1);
        return rest;
    }

    const _modData = {
        modList          : [],
        defaultConfigs   : {},
        defaultVariables : {}
    };

    function _modRegist(modId, defaultConfig = null, defaultVariables = null) {
        if (_modData.defaultConfigs[modId] === undefined) {
            _modData.defaultConfigs[modId] = {};
        }
        if (_modData.defaultVariables[modId] === undefined) {
            _modData.defaultVariables[modId] = {};
        }

        if (defaultConfig !== null) {
            _modData.defaultConfigs[modId] = defaultConfig;
        }

        if (defaultVariables !== null) {
            _modData.defaultVariables[modId] = defaultVariables;
        }

        _modData.modList.push(modId);
        console.log('[SF] regist mod:', modId, defaultConfig, defaultVariables);

        return {
            modId,
            config    : defaultConfig,
            variables : defaultVariables
        };
    }

    function _autoRegister() {
        const modList = _getModList();
        if (modList.length == 0) return;

        console.log('[SF] autoRegister:', modList);

        for (const modId of modList) {
            _register(modId, _modData.defaultConfigs[modId], _modData.defaultVariables[modId]);
        }
        
        // 以防万一，直接从数据库里检查Mod列表
        for (const modId of _modData.modList) {
            if (modList.includes(modId) === true) continue;
            _register(modId, _modData.defaultConfigs[modId], _modData.defaultVariables[modId]);
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
        
        gatherModV     : _gatherModV,
        gatherVariable : _gatherVariable,
        getModList     : _getModList,

        play : _playZone,

        isSafePeriod : _isSafePerieod
    });
})();

Object.defineProperties(window, {
    Story  : { get : () => SugarCube.Story },
    Macro  : { get : () => SugarCube.Macro },
    Engine : { get : () => SugarCube.Engine }
});
