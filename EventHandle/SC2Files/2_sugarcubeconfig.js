Save.onLoad.add(() => {
    iEvent.state.onload = true;
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

    console.log(`[SFDebug] onNavigation: ${passageTitle}, result: ${result}`);

    // back up available passage for restore, should backup outside of event loop
    if (passageTitle !== 'SFEventLoop' && iEvent.state.isPlaying() === false) {
        if (result === false) {
            Tvar.backupPassage = passageTitle;
        }
        else {
            Tvar.backupPassage = result;
        }
    }

    const prevPassage = Story.get(V.passage);
    const _result = iEventHandler.onNavi(passage, prevPassage);
    if (typeof _result === 'string') {
        result = _result;
        V.passageOverride = _result;
    }

    return result;
};


