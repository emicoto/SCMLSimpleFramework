/* eslint-disable no-var */
var iEventHandler = (() => {
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

    // before variable change
    function _onPreHistroy(passage, prevPassage) {
        // fix wrong event at this point if player cheated
        // backup last variables and restore
        if (iEvent.state.isPlaying()) {
            const condition = _onFixEvent(passage);
            if (condition.has('restore')) {
                window.variableBackup = clone(V);
                setup.restoredPassage = condition.split(':')[1];
                return;
            }
        }

        // setup a listner for variable change


        // won't run if in combat
        if (V.combat !== 0) {
            return;
        }

        // if starting up, do init
        if (iEvent.state.isStartingUp()) {

        }

        // update the last passage if it's different
        if (prevPassage && prevPassage.title !== passage.title) {
            V.lastPassage = prevPassage.title;
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
        // save system state ot variable for loading event;
        V.eFlags.systemState = iEvent.state.running;

        // clear backup and do restore if needed
        if (typeof setup.restoredPassage === 'string') {
            for (const key in window.variableBackup) {
                V[key] = clone(window.variableBackup[key]);
            }
            delete window.variableBackup;
            setTimeout(() => {
                Engine.play(setup.restoredPassage);
                delete setup.restoredPassage;
            }, 300);
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
        const data = iEvent.state.getEvent();
        let code = '';
        if (data.maxPhase && V.phase < data.maxPhase - 1) {
            code += '<<set $phase to $phase + 1>>';
        }
        if (data.maxPhase && V.phase === data.maxPhase) {
            code += '<<doEventEnd>>';
        }
        if (!code) {
            code = '<<doEventEnd>>';
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

    function _onTimeHandle() {

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

    function _getEventOnStage(feedback, passage, prevPassage) {
        if (!V.stage) return;

        const series = iEvent.data.get('onScene', V.stage);
        if (!series) return;
        if (series.length === 0) return;
        if (series.seriesType !== 'scene') return;
        if (typeof series.cond == 'function' && !series.cond()) return;

        _checkCondition(series, feedback, passage, prevPassage);

        return feedback;
    }

    function _checkCondition(eventList, feedback, passage, prevPassage) {
        for (const event of eventList) {
            const { trigger, cond } = event;
            if (typeof cond == 'function' && !cond()) continue;

            const flags = _getFlags(series, event.flagfield);
            if (trigger.onCheck(flags, passage, prevPassage) === false) continue;

            feedback.ready = true;
            feedback.data = event;
            break;
        }

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

        resultdata.passageTitle = scene.fullTitle;
    }

    function _endEvent() {
        // end event and clear event data
        iEvent.unset();
    }

    return Object.freeze({
        onPre        : _onPreHistroy,
        onNavi       : _onNavigator,
        onPost       : _onPostPassage,
        onDone       : _onRenderDone,
        onLinkDetect : _onLinkDetect
    });
})();
