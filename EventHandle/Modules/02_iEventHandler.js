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
        const condition = _onFixEvent(passage);
        if (condition.has('restore')) {
            _bakRestore(condition.split(':')[1]);
            return;
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

        // bak passage and prevPassage to Tvar
        Tvar.passage = passage.title;
        Tvar.prevPassage = prevPassage.title;
    }

    function _onBeforeHeader(passage) {
        // won't run if in combat
        if (V.combat !== 0) {
            return;
        }
        
        // if event is setup, do event
        if (iEvent.state.isPlaying()) {
            _doEvent();
            T.link = true;
        }

        // auto set danger rate if in stage when not in event loop;
        if (iEvent.stage.isRunning() === false && passage.tags.includes('stage') && V.eventskip === 0) {
            V.danger = random(1, 100000);
            V.dangerevent = 0;
        }
    }

    // after passage is shown
    function _onPostPassage() {
        const passage = Story.get(V.passage);
        const prevPassage = Story.get(Tvar.prevPassage);
        
        // won't rest run if in combat
        if (V.combat !== 0) {
            return;
        }

        // do post function of iEvent system
        iEvent.doPostFunc(passage, prevPassage);

        // if not running just return
        if (iEvent.state.isPlaying() === false) {
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

    function _isValidStage(passage) {
        return passage.tags.includes('stage') || passage.title === 'SFEventLoop' || passage.text.has('<<iStage>>', '<<include $tvar.eventTitle>>');
    }

    /**
     * fix wrong event at this point if player cheated
     * @param {passageObj} passage;
     * @returns {'restore' | 'ok'} condition
     */
    function _onFixEvent(passage) {
        // if not running, but still in event loop, restore;
        if (iEvent.state.isRunning() === false && passage.title === 'SFEventLoop') {
            iEvent.unset();
            return `restore:${Tvar.backupPassage}`;
        }
        // if not running but event still exist, unset it;
        if (iEvent.state.isRunning() === false && iEvent.state.event !== null) {
            iEvent.unset();
            return `restore:${Tvar.backupPassage}`;
        }
        // if not running, return;
        if (iEvent.state.isRunning() === false) return 'ok';

        // if already in event loop, return;
        if (iEvent.state.isPlaying() === true && _isValidStage(passage)) return 'ok';

        const event = iEvent.state.event;
        // if the time not passing, means still starting up, then return;
        if (event.startTime === V.timeStamp) return 'ok';

        // beacause no more async event, so no need to double check if event is trying to starting up.
        // so at this point, all event should be in valid stage or their own special passage, if not just unset it.
        if (_isValidStage(passage) === false && passage.title !== event.stage) {
            console.warn(`Event ${event.baseTitle} is not in valid stage. current passage: ${passage.title}, event stage: ${event.stage}`);
            iEvent.unset();
            return `restore:${Tvar.backupPassage}`;
        }

        // ------------- end of event type start scene type ----------------------

        // scene is short inframe event, should be in stage and have stage tag
        // but some scene should match their location
        // get play options from event.data
        const option = iEvent.getEvent().playOptions;
        if (!option) {
            if (event.type === 'scene' && passage.title.has(event.seriesId, V.stage) === false) {
                console.warn(`Event ${event.baseTitle} is not in correct passage, current passage: ${passage.title}, scene series: ${event.seriesId}`);
                iEvent.unset();
                return `restore:${Tvar.backupPassage}`;
            }
        }
        else if (option.onCheckScene(passage.title) === false) {
            // if has option just check the current passage.title has the correct stage of setting
            console.warn(`Event ${event.baseTitle} is not in correct stage or location, current passage: ${passage.title}, playoptions:`, option);
            iEvent.unset();
            return `restore:${Tvar.backupPassage}`;
        }

        return 'ok';
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
        const series = [...serieslist.get('passout').data].concat([...serieslist.get('common').data]);

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
        if (!Story.has(stage) && scene.type !== 'scene') {
            stage = 'SFEventLoop';
            console.warn(`Scene ${stage} not found, try set to alternative stage`);
        }
        else if (!Story.has(stage)) {
            console.warn(`Scene ${stage} not found, ${scene.data.Id} is unset`, scene);
            iEvent.unset();
            resultdata.data = null;
            resultdata.passageTitle = false;
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
        // at least pass 10 second for every phase
        Time.pass(10);
        console.log(`Event ${scene.fullTitle} is running`, scene);
        T.link = true;
    }

    return Object.freeze({
        onNavi       : _onNavigator,
        onPre        : _onPreHistroy,
        onBefore     : _onBeforeHeader,
        onPost       : _onPostPassage,
        onDone       : _onRenderDone,
        onLinkDetect : _onLinkDetect,
        onTime       : _onTimeHandle,
        onFix        : _onFixEvent,

        checkCond  : _checkCondition,
        getEvent   : _getEventOnStage,
        getCEvent  : _getEventOnCondition,
        bakRestore : _bakRestore,
        doRestore  : _doRestore,
        
        setEvent  : _setEvent,
        endEvent  : _endEvent,
        initEvent : _initEvent,
        doEvent   : _doEvent,

        setListner : _setupVariableChange,
        doListner  : _checkVariableChange
    });
})();
