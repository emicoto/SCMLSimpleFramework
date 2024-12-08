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

    function _register(modId, defaultConfig = null, defaultVariables = null) {
        if (!V.iModVar[modId]) {
            V.iModVar[modId] = {};
        }
        if (!V.iModConfigs[modId]) {
            V.iModConfigs[modId] = {};
        }
        
        if (defaultConfig !== null) {
            for (const [key, value] of Object.entries(defaultConfig)) {
                if (!V.iModConfigs[modId][key]) {
                    V.iModConfigs[modId][key] = clone(value);
                }
            }
        }

        if (defaultVariables !== null) {
            for (const [key, value] of Object.entries(defaultVariables)) {
                if (!V.iModVar[modId][key]) {
                    V.iModVar[modId][key] = clone(value);
                }
            }
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
        V.iModConfigs = { };
        V.iModVar = {};
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
        }
    };

    return Object.freeze({
        get state() {
            return _state;
        },

        init  : _init,
        setV  : _setV,
        getV  : _getV,
        setCF : _setConfig,
        getCF : _getConfig,
        
        register : _register,
        remove   : _remove,
        
        gatherModV     : _gatherModV,
        gatherVariable : _gatherVariable,

        play : _playZone,

        isSafePeriod : _isSafePerieod
    });
})();
