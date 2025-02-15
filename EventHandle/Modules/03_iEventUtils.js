const iEventUtils = (() => {
    'use strict';

    function _isValidStage(passage) {
        return passage.tags.includes('stage') || passage.title === 'SFEventLoop' || passage.text.has('<<iStage>>', '<<include $tvar.eventTitle>>');
    }

    function _getFlags(seriesData, eventflags) {
        const flag = iEvent.flag.get(seriesData.flagfield ?? '') ?? {};

        if (eventflags) {
            for (const key of eventflags) {
                flag[key] = iEvent.flag.get(key);
            }
        }
        return flag;
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
    
    function _resetPhase(data, phase) {
        let branchData;
        let currentBranch = null;
        if (data.branch && data.branch.length > 0) {
            currentBranch = data.branch[data.branch.length - 1];
        }

        if (currentBranch !== null && data.source.branches) {
            branchData = data.source.branches.find(b => b.Id === data.branch[data.branch.length - 1]);
        }

        if (branchData) {
            data.maxPhase = branchData.maxPhase;
        }
        else {
            data.maxPhase = phase ?? data.source.maxPhase;
        }
    }

    function _nextBranch(branchId) {
        console.log('[SFDebug] add branch to current event:', branchId);
        const event = iEvent.current;
        if (!event) return;

        if (!event.branch) {
            event.branch = [];
        }

        event.branch.push(branchId);
        V.phase = 0;

        // try update maxPhase if has branchPhase inside source data
        _resetPhase(event);
        console.log('[SFDebug] branch added:', event.branch, 'event:', event, 'branchData:', branchData);
    }

    function _prevBranch(phase) {
        const event = iEvent.current;
        if (!event) return;
        if (!event.branch || event.branch.length === 0) {
            console.error('[SFError] no branch to pop');
            return;
        }

        event.branch.pop();
        _resetPhase(event, phase);

        if (event.maxPhase > 0 && isValid(Number(phase))) {
            V.phase = Number(phase);
        }
    }

    function _setBranch(branchId) {
        const event = iEvent.current;
        if (!event) return;

        event.branch = [branchId];
        V.phase = 0;

        _resetPhase(event);
    }

    function _endEvent() {
        iEventHandler.end();
    }

    function _setEvent(eventType, seriesId, eventId) {
        iEventHandler.start(eventType, seriesId, eventId);
    }

    /**
 * @param {string} stage - the stage name for set
 */
    function setStage(stage) {
        V.stage = stage;

        // if in different stage, save the previous stage
        if (V.prevStage !== stage) {
            V.prevStage = stage;
        }
    }


    function unsetStage() {
        if (isValid(V.stage)) {
            V.lastStage = V.stage; // save for backup
            V.prevStage = null;
            V.stage = null;
        }
    }

    function _generalStreetEvent() {
        let result = '';

        if (V.exposed >= 1) {
            result += '<<exhibitionism "street">>';
        }
        if (V.arousal >= V.arousalmax) {
            result += '<<orgasmstreet>>';
        }
        if (V.stress >= V.stressmax && !V.possessed) {
            result += '<<passoutstreet>>';
        }
        return result;
    }

    return {
        getFlags : _getFlags,
        
        isValidStage : _isValidStage,
        backRestore  : _bakRestore,
        doRestore    : _doRestore,
        resetPhase   : _resetPhase,
        nextBranch   : _nextBranch,
        prevBranch   : _prevBranch,
        setBranch    : _setBranch,
        endEvent     : _endEvent,
        setEvent     : _setEvent,

        generalStreetEvent : _generalStreetEvent,

        setStage,
        unsetStage
    };
})();
