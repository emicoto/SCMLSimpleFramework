/* eslint-disable no-var */
var iEvent = (() => {
    'use strict';

    //---------------------------------------------
    //
    // data storage for events, actions, patches, listeners, post functions
    //
    //---------------------------------------------
    const _data = {
        events : {
            onScene     : new SeriesData('scene'),
            onCondition : new SeriesData('condition')
                .add(
                    new ConditionSeries('common', 'condition')
                        .Cond(() => true)
                ),

            get(type, id) {
                const storage = _data.events[type];
                if (!storage) {
                    console.error(`Event type ${type} is not defined`);
                    return;
                }
                return id ? storage.get(id) : storage;
            }
        },

        actions : {
            onLocation  : {},
            onCharacter : {}
        },

        postFunc : {},

        patches : {},

        listener : [],

        /**
         * add event to events storage
         * @param {string} eventType
         * @param {*} eventData
         * @returns {Map}
         */
        add(eventType, eventData) {
            const typeId = `on${eventType[0].toUpperCase()}${eventType.slice(1)}`;
            const eventStorage = this.events[typeId];
            if (!eventStorage) {
                console.error(`Event type ${eventType} is not defined`);
                return;
            }

            if (eventStorage.has(eventData)) {
                console.error(`Event ${eventData} is already defined`);
                return;
            }

            eventStorage.set(eventData.Id, eventData);
            return eventStorage.get(eventData.Id);
        },

        /**
         * regist post function to postFunc storage for each passage
         * @param {string} passsageTile
         * @param {function} callback
         */
        registTo(passsageTile, callback) {
            if (!this.postFunc[passsageTile]) {
                this.postFunc[passsageTile] = [];
            }

            this.postFunc[passsageTile].push(callback);
        },

        /**
         * patch data to passage
         * @param {string} passageTitle
         * @param {*} data
         */
        patchTo(passageTitle, data) {
            if (!this.patches[passageTitle]) {
                this.patches[passageTitle] = [];
            }

            this.patches[passageTitle].push(data);
        },
        
        /**
         * add listener to listener storage
         * @param {{
         *   passages: string[],
         *   watchvars: string[],
         *   onInit: function,
         *   onPost: function
         * }} listenerObj
         */
        listen(listenerObj) {
            this.listener.push(listenerObj);
        }
    };

    //----------------------------------------------------------------
    //
    //  short cuts for flags management
    //
    //----------------------------------------------------------------

    /**
     * initialize event flags for a series
     * @param {string} series
     * @param {string} flag
     */
    function _initFlag(series, flag) {
        if (V.eFlags[series] === undefined) {
            V.eFlags[series] = {};
        }

        if (flag && V.eFlags[series][flag] === undefined) {
            V.eFlags[series][flag] = 0;
        }
    }

    /**
     * set event flag value
     * @param {string} series
     * @param {string} flag
     * @param {number | string | boolean } value
     * @returns {number | string | boolean}
     */
    function _setFlag(series, flag, value) {
        _initFlag(series, flag);
        V.eFlags[series][flag] = value;
        return V.eFlags[series][flag];
    }

    /**
     * get event flag value
     * @param {string} series
     * @param {string} flag
     * @returns {object| number | string | boolean}
     */
    function _getFlag(series, flag) {
        _initFlag(series);
        return flag ? V.eFlags[series][flag] : V.eFlags[series];
    }

    /**
     * add event value to flag, only work if flag is number
     * @param {string} series
     * @param {string} flag
     * @param {number} value
     * @returns {number}
     */
    function _addFlag(series, flag, value) {
        _initFlag(series, flag);
        V.eFlags[series][flag] += value;
        return V.eFlags[series][flag];
    }

    //----------------------------------------------------------------
    //
    //  Handle functions
    //
    //----------------------------------------------------------------
    /**
     * @description on patch passage. if has patch, append html to patch div
     */
    function _doPatch() {
        const passage = V.passage;
        let patchId = 'addAfterMsg';

        // won't run if in combat
        if (V.combat !== 0) {
            return result;
        }

        if (!_data.patches[passage]) {
            return;
        }

        // find div id addAfterMsg
        const div = document.getElementById(patchId);
        if (!div) {
            htmlTools.appendPatch('before', 'patchContents');
            patchId = 'patchContents';
        }

        _data.patches[passage].forEach(content => {
            const html = typeof content === 'function' ? content() : content;
            new Wikifier(null, `<<append #${patchId}>${html}</<append>>`);
        });
    }

    function _getFlagField(flagKeys) {
        const flags = {};
        if (!flagKeys || flagKeys.length === 0) {
            return flags;
        }
 
        for (const key of flags) {
            flags[key] = _getFlag(key);
        }

        return flags;
    }

    function _sortEvents(data) {
        if (data instanceof EventSeries) {
            data.sort();
        }

        if (typeof data == 'object' && String(data) == '[object Object]') {
            for (const key in data) {
                _sortEvents(data[key]);
            }
        }
    }

    const _state = {
        running : '',
        init    : false,
        event   : null,
        isReady() {
            return this.init;
        },
        isIdle() {
            return this.running === 'idle';
        },
        isPlaying() {
            return this.running.includes('running:');
        },
        isRunning() {
            // if is running or playing
            return this.running.includes('running:') || this.running.includes('starting:');
        },
        isStartingUp() {
            return this.running.includes('starting:');
        },
        isLoading() {
            return this.onload === true;
        },
        currentEvent() {
            if (!this.isRunning()) {
                return '';
            }
            return this.running.split(':')[1];
        },
        getEvent() {
            if (this.event === null) {
                console.error('[SF/EventSystem] Event is not set');
                return;
            }

            const data = this.event;
            return new SceneData(data.Id, data.type, data.priorty).setData(data);
        }
    };

    function _defineObj() {
        if (typeof V.eFlags == 'undefined') {
            V.eFlags = {};
        }

        if (typeof Flags == 'undefined') {
            Object.defineProperty(window, 'Flags', {
                get : () => V.eFlags
            });
        }
    }

    function _initSystem() {
        for (const key in _data.events) {
            _sortEvents(_data.events[key]);
        }

        _defineObj();
        console.log('[SF/EventSystem] variable Flags is ready:', Flags);

        _state.running = 'ready';
        _state.init = true;
    }

    function _onLoad() {
        _defineObj();

        if (V.eFlags.systemState) {
            _state.running = V.eFlags.systemState;
        }
        else {
            _state.running = 'idle';
        }

        if (_state.isPlaying()) {
            const event = _state.currentEvent();
            console.log(`[SF/EventSystem] Event ${event} is running`);

            _play(Tvar.event).restore(Tvar.event);
        }
    }

    function _onSave() {
        V.eFlags.systemState = _state.running;
        // save event running data
        Tvar.event = _state.event;
    }

    // fast play event by given id on Current Stage
    // only work if V.stage is valid
    function _play(eventId, phase = 0) {
        _state.event = new Scene('scene', eventId);
        _state.running = `starting:${_state.event.fullTitle}`;
        if (phase > 0) {
            _state.event.maxPhase = phase;
        }
        return _state.event;
    }

    // set event and ready to play a event by given data
    function _setEvent(eventData) {
        _state.event = new Scene('scene', eventData.Id, eventData).initData();
        _state.running = `starting:${_state.event.fullTitle}`;

        console.log(`[SF/EventSystem] Event ${_state.event.fullTitle} is set to ready`);
        return _state.event;
    }

    // get event data by given seriesId and eventId
    function _getEvent(seriesId, eventId) {
        let data = _data.events.onScene.get(seriesId);
        if (data) {
            return data.get(eventId);
        }

        data = _data.events.onCondition.get(seriesId);
        if (data) {
            return data.get(eventId);
        }
        
        return null;
    }

    function _unsetEvent() {
        _state.event = null;
        _state.running = 'idle';

        V.phase = 0;
        V.eFlags.systemState = 'idle';
        Tvar.event = null;

        wikifier('endevent');
        wikifier('endcombat');
    }

    return Object.seal({
        get data() {
            return _data;
        },
        get state() {
            return _state;
        },

        init   : _initSystem,
        onLoad : _onLoad,
        onSave : _onSave,
        
        set   : _setEvent,
        get   : _getEvent,
        play  : _play,
        unset : _unsetEvent,

        flag : {
            init : _initFlag,
            set  : _setFlag,
            get  : _getFlag,
            add  : _addFlag
        },
        
        doPatch  : _doPatch,
        getFlags : _getFlagField
    });
})();
