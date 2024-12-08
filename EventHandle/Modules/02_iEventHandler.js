const iEventHandler = (() => {
    // Event Handler for SimpleEventHandle

    // on Navigator start
    // return false or string to override passage title
    function _onNavigator(passage, prevPassage) {
        // won't run if in combat
        if (V.combat !== 0) {
            return false;
        }
        // if already running, just return;
        if (iEvent.state.isPlaying()) {
            return false;
        }

        const eventResult = {};

        _getEventOnCondition(eventResult, passage, prevPassage);

        if (!eventResult.ready && passage.tags.includes('stage')) {
            _getEventOnStage(eventResult, passage, prevPassage);
        }

        // should finish event condition check on navigator and register event at this point
        if (eventResult.ready) {
            _setEvent(eventResult);
            return eventResult.passageTitle;
        }

        return false;
    }

    function _bakRestore(restorePassage) {
        window.variableBackup = clone(V);
        setup.restoredPassage = restorePassage;
    }

    function _doRestore() {
        for (const key in window.variableBackup) {
            V[key] = clone(window.variableBackup[key]);
        }
        delete window.variableBackup;
        const passage = setup.backupPassage.split(':')[1];
        setTimeout(() => {
            Engine.play(passage);
            delete setup.restoredPassage;

            // return feedback to listener after restore
            _checkVariableChange(Story.get(passage));
        }, 300);
    }

    // before variable change
    function _onPreHistroy(passage, prevPassage) {
        // fix wrong event at this point if player cheated
        // backup last variables and restore

        if (iEvent.state.isPlaying()) {
            const condition = _onFixEvent(passage);
            if (condition.has('restore')) {
                _bakRestore(condition.split(':')[1]);
                return;
            }
        }

        // setup a listner for variable change
        _setupVariableChange(passage);

        // won't run if in combat
        if (V.combat !== 0) {
            return;
        }

        // if starting up, do init
        if (iEvent.state.isStartingUp()) {
            _initEvent();
        }
    }

    function _onBeforeHeader(passage) {
        // won't run if in combat
        if (V.combat !== 0) {
            return;
        }
        
        // if event is setup, do event
        if (iEvent.state.isPlaying()) {
            _doEvent();
        }
    }

    // after passage is shown
    function _onPostPassage() {
        const passage = Story.get(V.passage);
        const lastPassage = Story.get(V.lastPassage);
        
        // won't rest run if in combat
        if (V.combat !== 0) {
            return;
        }

        // check after passage event
        const data = iEvent.state.getEvent();
    }

    function _onRenderDone() {
        const psg = Story.get(V.passage);
        // save system state ot variable for loading event;
        V.eFlags.systemState = iEvent.state.running;

        // clear backup and do restore if needed
        if (typeof setup.restoredPassage === 'string') {
            _doRestore();
        }
        else {
            // return feedback to listener
            _checkVariableChange(psg);
        }
    }

    function _linkDetect() {
        // detect if there is a link on the page
        const $dom = $('#passage-content');
        if ($dom.find('.macro-link').length === 0) {
            return false;
        }
        return true;
    }

    function _onLinkDetect() {
        if (!iEvent.state.isRunning()) return;
        if (_linkDetect()) return;

        // if not link detected, generate a next button for next step;
        const scene = iEvent.state.event;
        /**
         * @type {SceneData}
         */
        const data = scene.data;
        const actions = data.actions;

        let code = '';
        if (scene.maxPhase && V.phase < scene.maxPhase - 1) {
            code += '<<set $phase to $phase + 1>>';
        }
        if (scene.maxPhase && V.phase === scene.maxPhase) {
            code += '<<doEventEnd>>';
        }
        if (!code) {
            code = '<<doEventEnd>>';
        }

        if (actions) {
            if (typeof actions.next === 'function') {
                code += '<<run iEvent.state.data.actions.next()>>';
            }
            else if (typeof actions.next === 'string') {
                code += actions.next;
            }
        }

        const $button = jQuery('<a>')
            .addClass('macro-link')
            .html(Lang.get('common.next'))
            .onClick(() => {
                new Wikifier(null, code);
            })
        ;

        jQuery('#passage-content').append($button);
    }

    // on time handle if needed
    function _onTimeHandle(passed, passage) {
        if (V.combat !== 0) return;
        if (iEvent.state.isPlaying()) return;

        const eventResult = {};
        _checkCondition(iEvent.data.get('onTime'), eventResult, passed, passage);
    }

    /**
     *
     * @param {passageObj} passage;
     * @returns {'restore' | 'ok'} condition
     */
    function _onFixEvent(passage) {
        // fix wrong event at this point if player cheated
    }

    function _getFlags(series, eventflags) {
        const flag = _getFlag(series.flagfield ?? '') ?? {};

        if (eventflags) {
            for (const key of eventflags) {
                flag[key] = _getFlag(key);
            }
        }

        return flag;
    }
    /**
     * 
     * @param { SceneData[] } eventList - list of event to check
     * @param {object} feedback - the feedback object to return
     * @param { passageObj } passage - current passage, will be passed for time check
     * @param { passageObj } prevPassage - previous passage, will be current passage for time check
     * @returns {object} feedback
     */
    function _checkCondition(eventList, feedback, passage, prevPassage) {
        if (!eventList || eventList.length === 0) return feedback;
        for (const event of eventList) {
            const { trigger, cond } = event;
            if (typeof cond == 'function' && !cond(passage, prevPassage)) continue;

            const flags = _getFlags(series, event.flagfield);
            if (trigger.onCheck(flags, passage, prevPassage) === false) continue;

            feedback.ready = true;
            feedback.data = event;
            break;
        }

        return feedback;
    }

    function _getEventOnStage(feedback, passage, prevPassage) {
        if (!V.stage) return;

        const series = iEvent.data.get('onScene', V.stage);
        if (!series) return;
        if (series.length === 0) return;
        if (series.seriesType !== 'scene') return;
        if (typeof series.cond == 'function' && !series.cond(passage, prevPassage)) return;

        _checkCondition(series, feedback, passage, prevPassage);

        return feedback;
    }

    function _getEventOnCondition(feedback, passage, prevPassage) {
        const serieslist = iEvent.data.get('onCondition');
        const series = [...serieslist.get('common').data];

        if (serieslist.size > 1) {
            console.log('Multiple condition series detected');
            // check condition series availability
            const list = serieslist.values();
            for (const item of list) {
                if (item.cond()) {
                    series.push(...item.data);
                }
            }
        }

        _checkCondition(series, feedback, passage, prevPassage);

        return feedback;
    }

    function _setEvent(resultdata) {
        // set event data to iEvent ready to run;
        const data = resultdata.data;
        const scene = iEvent.set(data);

        let stage = scene.getStage();
        if (!Story.has(stage)) {
            console.warn(`Scene ${stage} not found, set to alternative`);
            stage = 'SFEventLoop';
        }
        resultdata.passageTitle = stage;
    }

    function _endEvent() {
        // end event and clear event data
        const event = iEvent.state.getEvent();
        const action = event.data.action ?? {};
        if (typeof action.end == 'function') {
            action.end();
        }
        else if (typeof action.end == 'string') {
            new Wikifier(null, action.end);
        }

        iEvent.unset();
    }

    function _setupVariableChange(passage) {
        // setup a listner for variable change
        const data = iEvent.data.listner;
        if (!data || data.length === 0) return;

        for (const listner of data) {
            const { passages, watchvars, onInit } = listner;
            if (passages && !passages.includes(passage.title)) continue;

            const vars = {};
            for (const key of watchvars) {
                if (key.includes('.')) {
                    setPath(vars, key, getPath(V, key));
                }
                else {
                    vars[key] = V[key];
                }
            }

            if (typeof onInit == 'function') {
                onInit(vars);
            }
        }
    }

    function _checkVariableChange(passage) {
        // check variable change
        const data = iEvent.data.listner;
        if (!data || data.length === 0) return;

        for (const listner of data) {
            const { passages, watchvars, onPost } = listner;
            if (passages && !passages.includes(passage.title)) continue;

            const vars = {};
            for (const key of watchvars) {
                if (key.includes('.')) {
                    setPath(vars, key, getPath(V, key));
                }
                else {
                    vars[key] = V[key];
                }
            }

            if (typeof onPost == 'function') {
                onPost(vars);
            }
        }
    }

    function _initEvent() {
        // init event data
        const scene = iEvent.state.event;
        scene.getBranch();
        scene.initData();

        const { stage } = scene;
        if (!Story.has(stage)) {
            // set a alternative stage if not found
            scene.stage = 'SFEventLoop';
        }
        
        // try get available language title, will try every possible title in order on .getLanguage()
        const fullTitle = scene.initLanguage();
        // ensure is available, if not found unset the event;
        if (!Story.has(fullTitle)) {
            console.warn(`Scene ${fullTitle} not found, ${scene.data.Id} is unset`, scene);
            iEvent.unset();

            // backup last variables ready to restore
            _bakRestore(Tvar.backupPassage);
            return;
        }
        // do init action
        scene.init();
    }

    function _doEvent() {
        if (!iEvent.state.isRunning()) return;

        // try get available language title and update the title
        const scene = iEvent.state.event;
        const fullTitle = scene.getLanguage();

        // check if just just started
        if (iEvent.state.isStartingUp()) {
            Tvar.eventTitle = scene.fullTitle;
            iEvent.state.set(`running:${scene.baseTitle}`);
        }
        else {
            Tvar.eventTitle = fullTitle;
        }

        let code = '';
        // check if there is a phase code to run
        const phase = `phase_${V.phase + 1}`;
        if (typeof actions[phase] === 'function') {
            actions[phase]();
        }
        else if (typeof actions[phase] === 'string') {
            code += actions[phase];
        }

        // check if there is a branch code to run
        const branch = scene.branch;
        if (branch.length > 0) {
            const branchId = branch.pop();
            const branchCode = `branch_${branchId}`;
            if (typeof actions[branchCode] === 'function') {
                actions[branchCode]();
            }
            else if (typeof actions[branchCode] === 'string') {
                code += actions[branchCode];
            }
        }

        new Wikifier(null, code);

        if (scene.maxPhase > 0 && V.phase < scene.maxPhase) {
            V.phase++;
        }

        console.log(`Event ${scene.fullTitle} is running`, scene);
        
        T.link = true;
    }

    return Object.freeze({
        onNavi       : _onNavigator,
        onPre        : _onPreHistroy,
        onPost       : _onPostPassage,
        onDone       : _onRenderDone,
        onLinkDetect : _onLinkDetect,

        checkCond  : _checkCondition,
        getEvent   : _getEventOnStage,
        getCEvent  : _getEventOnCondition,
        bakRestore : _bakRestore,
        
        endEvent : _endEvent
    });
})();
