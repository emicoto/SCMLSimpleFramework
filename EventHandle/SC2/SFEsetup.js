setup.SFEonLoad = false;

Save.onLoad.add(() => {
    setup.SFEonLoad = true;
});

Save.onSave.add(() => {

});

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

    if (setup.SFEonLoad) {
        iEvent.onLoad();
        setup.SFEonLoad = false;
    }

    if (iEvent.state.isReady() === true) {
        return;
    }

    iEvent.init();
};

// onHeaxer
function SFE_onHeader() {
    // do header event
    iEventHandler.onBefore();
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
