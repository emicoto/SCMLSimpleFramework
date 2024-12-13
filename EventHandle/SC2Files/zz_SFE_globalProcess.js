
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
        const stage = passage.title.replace('Stage ', '');
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

    console.log('Pre Passage Event:', passage, prevPassage);
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
