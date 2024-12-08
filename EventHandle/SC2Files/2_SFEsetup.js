Save.onLoad.add(() => {
    iEvent.state.onload = true;
});

Save.onSave.add(() => {

});


/**
 * @param {string} stage - the stage name for set
 */
function setStage(stage) {
    V.stage = stage;

    // do nothing if not a string;
    if (typeof V.prevStage === 'string' && V.prevStage !== stage) {
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
window.setStage = setStage;
window.unsetStage = unsetStage;

// if not a function should get error
if (typeof Config.navigation.override !== 'function') {
    throw new Error('Config.navigation.override is not a function');
}

// save old navigator function
const OldNavigator = Config.navigation.override;


// override navigation to handle events
Config.navigation.override = function (passageTitle) {
    const passage = Story.get(passageTitle);
    let result = OldNavigator(passageTitle);

    // won't run if not ready
    if (!V.passage || passage.title.has('Start', 'Downgrade Waiting Room', 'Settings') !== false || result === 'Downgrade Waiting Room') {
        return result;
    }

    if (iEvent.state.isReady() === false) {
        return result;
    }

    if (result === false) {
        Tvar.backupPassage = passageTitle;
    }
    else {
        Tvar.backupPassage = result;
    }

    const prevPassage = Story.get(V.passage);
    const _result = iEventHandler.onNavi(passage, prevPassage);
    if (typeof _result === 'string') {
        result = _result;
        V.passageOverride = _result;
    }

    return result;
};


prehistory.SFE_Prehistory = function () {
    const passage = this;
    if (!passage || passage.tags.has('widget', 'system')) {
        return;
    }

    // if not ready
    if (!V.passage || passage.title.has('Start', 'Downgrade Waiting Room')) {
        return;
    }

    // save the last passage if it's different
    if (V.passage !== passage.title) {
        V.lastPassage = V.passage;
    }

    // save the stage. stage passage should be Stage <stageName>; no more space should be used
    // but if it's special stage can set after in the passage
    if (passage.tags.has('stage')) {
        const stage = passage.title.split(' ')[1];
        setStage(stage);
    }
    // if not stage, then unset the stage
    else {
        unsetStage();
    }

    if (iEvent.state.isReady() === false) {
        return;
    }

    // won't run if in system passage
    if (passage.title.has('Options', 'Settings', 'Cheats') !== false || passage.tags.has('system')) {
        return;
    }

    const prevPassage = Story.get(V.passage);

    // do pre passage event
    iEventHandler.onPre(passage, prevPassage);
};

postrender.SFEInit = function () {
    const passage = this;
    if (!passage || passage.tags.has('widget', 'system') || !V.passage) {
        return;
    }

    if (iEvent.state.isLoading() === true) {
        iEvent.onLoad();
        iEvent.state.onload = false;
    }

    if (iEvent.state.isReady() === true) {
        return;
    }

    iEvent.init();
};

// onHeader
function SFE_onHeader() {
    const psg = Story.get(passage());
    // won't run if not ready
    if (iEvent.state.isReady() === false) {
        return;
    }
    // do header event
    iEventHandler.onBefore(psg);
}

postrender.SFE_onPostevent = function () {
    const passage = this;
    if (!passage || passage.tags.has('widget', 'system') || !V.passage) {
        return;
    }

    if (iEvent.state.isReady() === false) {
        return;
    }

    if (iEvent.state.isRunning() === false) {
        return;
    }

    iEventHandler.onPost(passage);
};

postdisplay.SFE_onPostshown = function () {
    const passage = this;
    if (!passage || passage.tags.has('widget', 'system') || !V.passage) {
        return;
    }

    if (iEvent.state.isReady() === false) {
        return;
    }

    if (iEvent.state.isRunning() === false) {
        return;
    }

    iEventHandler.onShown(passage);
};


$(document).on(':postApplyZone', () => {
    // makesure everything to be ready, before doing event patches wait for 100ms
    setTimeout(() => {
    // do patch at first if available
        iEvent.doPatch();

        // do done event after patch;
        iEventHandler.onDone();
        iEventHandler.onLinkDetect();
    }, 100);
});
