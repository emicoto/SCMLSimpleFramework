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

    function _setConfig(prop, value) {
        V.iModConfigs[prop] = value;
    }

    function _getConfig(prop) {
        return V.iModConfigs[prop];
    }

    function _setV(modId, prop, value) {
        if (!V.iModVar[modId]) {
            V.iModVar[modId] = {};
        }

        V.iModVar[modId][prop] = value;
    }

    function _getV(modId, prop) {
        return V.iModVar[modId] && prop ? V.iModVar[modId][prop] : V.iModVar[modId];
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

        for (const key in refObj) {
            // 如果 newObj[key] 有效并且类型与 refObj[key] 相同
            if (isValid(newObj[key]) && typeof newObj[key] === typeof refObj[key]) {
                if (Array.isArray(refObj[key])) {
                    // 如果是数组并且长度不同而且不覆盖
                    if (newObj[key].length !== refObj[key].length && overwrite === false) {
                        data[key] = clone(refObj[key]);
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
                    data[key] = newObj[key];
                }
            }
            else {
                data[key] = clone(refObj[key]);
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
        
        if (defaultConfig !== null) {
            _updateObj(V.iModConfigs[modId], defaultConfig);
        }

        if (defaultVariables !== null) {
            _updateObj(V.iModVar[modId], defaultVariables);
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
            obj[arg] = V[arg];
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

    function _playZone(zone, passageTItle) {
        const data = simpleFrameworks.data[zone];
        console.log('[SFDebug] checkzone:', zone, data);

        if (!data) return '';
        if (data.length == 0) return '';

        const title = passageTItle ?? V.passage;
        const html = data.reduce((result, widgets) => {
            if (String(widgets) == '[object Object]') {
                if (
                    typeof widgets.passage == 'string' && widgets.passage == title ||
                    Array.isArray(widgets.passage) && widgets.passage.includes(title) ||
                    typeof widgets.passage == 'undefined' ||
                    widgets.passage.length == 0
                ) {
                    result += `<<${widgets.widget}>>`;
                }
                else if (typeof widgets == 'string') {
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

        return {
            modId,
            config    : defaultConfig,
            variables : defaultVariables
        };
    }

    function _autoRegister() {
        const modList = _getModList();
        if (modList.length == 0) return;

        for (const modId of modList) {
            _register(modId, _modData.defaultConfigs[modId], _modData.defaultVariables[modId]);
        }
    }

    Object.defineProperty(window, 'updateObj', { value : _updateObj });

    return Object.freeze({
        get state() {
            return _state;
        },

        init  : _init,
        setV  : _setV,
        getV  : _getV,
        setCf : _setConfig,
        getCf : _getConfig,
        
        regist   : _modRegist,  // regist mod to iMod manager and will auto init when variables is ready;
        registV  : _register,   // regist mod to V.iModVar and V.iModConfigs directly
        remove   : _remove,
        initMods : _autoRegister,
        
        gatherModV     : _gatherModV,
        gatherVariable : _gatherVariable,

        play : _playZone,

        isSafePeriod : _isSafePerieod
    });
})();

Object.defineProperties(window, {
    Story  : { get : () => SugarCube.Story },
    Macro  : { get : () => SugarCube.Macro },
    Engine : { get : () => SugarCube.Engine }
});
