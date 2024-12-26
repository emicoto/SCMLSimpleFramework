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
            onTime      : new SeriesData('time'),
            onCondition : new SeriesData('condition')
                .add(
                    new ConditionSeries('passout').Cond(() => iEvent.passoutCheck()),
                    new ConditionSeries('common').Cond(() => true)
                )
        },
        postFunc : {},

        patches : {},

        listener : [],

        passoutconditions : [
            // default passout condition
            function () {
                return V.stress >= V.stressmax;
            }
        ],

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
        },

        /**
         * the param condition should be function that return boolean
         * @param {function} condition
         */
        newPassoutCondition(condition) {
            this.passoutconditions.push(condition);
        },

        get(type, id) {
            let typeId;
            if (type.includes('on')) {
                typeId = type;
            }
            else {
                typeId = `on${type[0].toUpperCase()}${type.slice(1)}`;
            }

            const storage = _data.events[typeId];
            if (!storage) {
                console.error(`Event type ${typeId} is not defined`);
                return;
            }
            return id ? storage.get(id) : storage;
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
        if (V.eFlags[series] === undefined) {
            return undefined;
        }
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
        if (typeof V.eFlags[series][flag] == 'number' && typeof value == 'number' && isValid(value)) {
            V.eFlags[series][flag] += value;
        }
        // if is string, append value to string with , separator
        else if (typeof V.eFlags[series][flag] == 'string') {
            V.eFlags[series][flag] += `,${value}`;
        }
        // if is array, push value to array
        else if (Array.isArray(V.eFlags[series][flag])) {
            V.eFlags[series][flag].push(value);
        }
        // anyways, just set value
        else {
            V.eFlags[series][flag] = value;
        }
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
            return;
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

    function _doPostFunc(passage, prevPassage) {
        const keys = Object.keys(_data.postFunc);
        if (keys.length === 0) {
            return;
        }
        for (const [key, value] of Object.entries(_data.postFunc)) {
            if (value.passage && value.passage.includes(passage.title)) {
                value.func(passage);
            }
            else if (value.prevPassage && value.prevPassage.includes(prevPassage.title)) {
                value.func(passage, prevPassage);
            }
            else if (value.passage === undefined && value.prevPassage === undefined) {
                value.func(passage);
            }
        }
    }

    function _onPassoutCheck() {
        const conditions = _data.passoutconditions;
        for (const condition of conditions) {
            if (condition()) {
                return true;
            }
        }
        return false;
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
        if (data instanceof SeriesData || data instanceof EventSeries || data instanceof ConditionSeries) {
            data.initSeries();
        }

        if (data instanceof EventSeries || data instanceof ConditionSeries) {
            data.sort();
        }
        else if (Array.isArray(data)) {
            for (const item of data) {
                if (typeof item.sort === 'function') {
                    item.sort();
                }
            }
        }
        else if (data instanceof Map) {
            for (const item of data.values()) {
                if (typeof item.sort === 'function') {
                    item.sort();
                }
                else if (typeof item === 'object') {
                    _sortEvents(item);
                }
            }
        }
    }

    const _state = {
        running : '',
        init    : false,
        /**
         * @type {Scene}
         */
        event   : null,
        set(state) {
            this.running = state;
        },
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

        /**
         * ensure return a SceneData object of current event
         * @returns {SceneData}
         */
        getEvent() {
            if (this.event === null) {
                console.error('[SF/EventSystem] Event is not set');
                return;
            }

            const src = this.event.source;
            if (src instanceof SceneData === false) {
                const data = new SceneData(src.Id, src.type, src.priorty).setData(src);
                data.restore();
                this.event.source = data;
            }

            return this.event.source;
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

        _state.set('ready');
        _state.init = true;
    }

    function _onLoad() {
        _defineObj();

        if (V.eFlags.systemState) {
            _state.set(V.eFlags.systemState);
        }
        else {
            _state.set('idle');
        }

        if (_state.isPlaying()) {
            const event = _state.currentEvent();
            console.log(`[SF/EventSystem] Event ${event} is running`);

            _play(Tvar.event).restore(Tvar.event);
        }
    }

    function _onSave(arg) {
        console.log('[SF/EventSystem] Saving event system', arg);
        V.eFlags.systemState = _state.running;
        // save event running data
        Tvar.event = _state.event;
    }

    // fast play event by given id on Current Stage
    // only work if V.stage is valid
    function _play(eventId, phase = 0) {
        if (!V.stage) {
            console.error('[SF/EventSystem] No stage is set');
            return;
        }

        _state.event = new Scene('scene', eventId);
        if (phase > 0) {
            _state.event.maxPhase = phase;
        }

        _state.set(`starting:${_state.event.baseTitle}`);
        return _state.event;
    }

    // set event and ready to play a event by given data
    function _setEvent(eventData) {
        _state.event = new Scene('scene', eventData.Id, eventData);
        _state.event.getFullTitle();
        _state.set(`starting:${_state.event.baseTitle}`);

        console.log(`[SF/EventSystem] Event ${_state.event.baseTitle} is set to ready`);
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
        _state.set('idle');

        V.phase = 0;
        V.eFlags.systemState = _state.running;
        Tvar.event = null;
        Tvar.eventId = null;
        Tvar.eventTitle = null;
        Tvar.baseTitle = null;

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
        get current() {
            return _state.event;
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
        
        doPatch      : _doPatch,
        doPostFunc   : _doPostFunc,
        getFlags     : _getFlagField,
        passoutCheck : _onPassoutCheck
        
    });
})();
